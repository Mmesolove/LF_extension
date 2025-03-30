// src/player-connection/player-connection.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlayerConnection, ConnectionStatus } from './schemas/player-connection.schema';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Interval } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PlayerConnectionService {
  private readonly logger = new Logger(PlayerConnectionService.name);
  
  constructor(
    @InjectModel(PlayerConnection.name) private playerConnectionModel: Model<PlayerConnection>,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async createConnection(userId: string, deviceInfo: any): Promise<PlayerConnection> {
    const sessionId = uuidv4();
    
    const connection = new this.playerConnectionModel({
      userId,
      sessionId,
      deviceInfo,
      connectionStatus: ConnectionStatus.CONNECTED,
      lastActive: new Date(),
      heartbeatInterval: 30000, // Default 30 seconds heartbeat
    });

    await connection.save();
    
    // Set up heartbeat check for this connection
    this.setupHeartbeatCheck(sessionId);
    
    this.logger.log(`Player ${userId} connected with session ${sessionId}`);
    
    return connection;
  }

  private setupHeartbeatCheck(sessionId: string): void {
    const callback = async () => {
      try {
        const connection = await this.playerConnectionModel.findOne({ sessionId });
        
        if (!connection) {
          this.removeHeartbeatCheck(sessionId);
          return;
        }
        
        const now = new Date();
        const lastActiveTime = new Date(connection.lastActive);
        const timeDiff = now.getTime() - lastActiveTime.getTime();
        
        // If no activity for more than 2 minutes, mark as idle
        if (connection.connectionStatus === ConnectionStatus.CONNECTED && timeDiff > 120000) {
          connection.connectionStatus = ConnectionStatus.IDLE;
          await connection.save();
          this.logger.log(`Player ${connection.userId} is now idle`);
        }
        
        // If no activity for more than 5 minutes, mark as disconnected
        if (connection.connectionStatus !== ConnectionStatus.DISCONNECTED && timeDiff > 300000) {
          connection.connectionStatus = ConnectionStatus.DISCONNECTED;
          connection.lastDisconnect = now;
          await connection.save();
          this.logger.log(`Player ${connection.userId} marked as disconnected due to inactivity`);
        }
      } catch (error) {
        this.logger.error(`Error in heartbeat check for session ${sessionId}`, error);
      }
    };
    
    const interval = setInterval(callback, 60000); // Check every minute
    this.schedulerRegistry.addInterval(`heartbeat_${sessionId}`, interval);
  }

  private removeHeartbeatCheck(sessionId: string): void {
    try {
      this.schedulerRegistry.deleteInterval(`heartbeat_${sessionId}`);
    } catch (e) {
      this.logger.warn(`No heartbeat found for session ${sessionId}`);
    }
  }

  async updateHeartbeat(sessionId: string): Promise<void> {
    await this.playerConnectionModel.updateOne(
      { sessionId },
      { 
        lastActive: new Date(),
        connectionStatus: ConnectionStatus.CONNECTED,
      }
    );
  }

  async disconnect(sessionId: string): Promise<void> {
    const connection = await this.playerConnectionModel.findOne({ sessionId });
    if (connection) {
      connection.connectionStatus = ConnectionStatus.DISCONNECTED;
      connection.lastDisconnect = new Date();
      await connection.save();
      
      this.removeHeartbeatCheck(sessionId);
      this.logger.log(`Player ${connection.userId} disconnected`);
    }
  }

  async reconnect(userId: string, sessionId: string): Promise<PlayerConnection | null> {
    const connection = await this.playerConnectionModel.findOne({ sessionId });
    
    if (!connection) {
      return null;
    }
    
    connection.connectionStatus = ConnectionStatus.CONNECTED;
    connection.lastActive = new Date();
    connection.reconnectCount += 1;
    await connection.save();
    
    // Setup heartbeat again
    this.setupHeartbeatCheck(sessionId);
    
    this.logger.log(`Player ${userId} reconnected with session ${sessionId}`);
    
    return connection;
  }

  async getPlayerConnections(userId: string): Promise<PlayerConnection[]> {
    return this.playerConnectionModel.find({ userId }).sort({ lastActive: -1 }).exec();
  }

  async getActiveConnections(): Promise<PlayerConnection[]> {
    return this.playerConnectionModel.find({
      connectionStatus: { $in: [ConnectionStatus.CONNECTED, ConnectionStatus.IDLE] }
    }).exec();
  }

  @Interval(300000) // Every 5 minutes
  async cleanupStaleConnections() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // Delete connections inactive for 7 days
    
    const result = await this.playerConnectionModel.deleteMany({
      connectionStatus: ConnectionStatus.DISCONNECTED,
      lastActive: { $lt: cutoffDate }
    });
    
    if (result.deletedCount > 0) {
      this.logger.log(`Cleaned up ${result.deletedCount} stale connections`);
    }
  }

  async getConnectionStats(): Promise<any> {
    const [connected, idle, disconnected, total] = await Promise.all([
      this.playerConnectionModel.countDocuments({ connectionStatus: ConnectionStatus.CONNECTED }),
      this.playerConnectionModel.countDocuments({ connectionStatus: ConnectionStatus.IDLE }),
      this.playerConnectionModel.countDocuments({ connectionStatus: ConnectionStatus.DISCONNECTED }),
      this.playerConnectionModel.countDocuments(),
    ]);
    
    return {
      connected,
      idle,
      disconnected,
      total,
      activeRate: total > 0 ? ((connected + idle) / total) * 100 : 0,
      timestamp: new Date()
    };
  }
}