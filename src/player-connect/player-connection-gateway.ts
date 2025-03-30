// src/player-connection/player-connection.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PlayerConnectionService } from './player-connection.service';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class PlayerConnectionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(PlayerConnectionGateway.name);
  
  @WebSocketServer()
  server: Server;

  constructor(private readonly playerConnectionService: PlayerConnectionService) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token and verify (implementation depends on your auth strategy)
      const token = client.handshake.auth.token || client.handshake.query.token;
      // Verify token and get userId - this is simplified, you should use your auth service
      const userId = await this.getUserIdFromToken(token as string);
      
      if (!userId) {
        client.disconnect();
        return;
      }
      
      const deviceInfo = {
        ip: client.handshake.address,
        userAgent: client.handshake.headers['user-agent'],
      };
      
      const connection = await this.playerConnectionService.createConnection(userId, deviceInfo);
      
      // Store sessionId in socket data for later use
      client.data.sessionId = connection.sessionId;
      client.data.userId = userId;
      
      // Join user to a personal room
      client.join(`user_${userId}`);
      
      this.logger.log(`Client connected: ${client.id} for user ${userId}`);
    } catch (error) {
      this.logger.error('Connection error', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const { sessionId, userId } = client.data;
      if (sessionId) {
        await this.playerConnectionService.disconnect(sessionId);
        this.logger.log(`Client disconnected: ${client.id} for user ${userId}`);
      }
    } catch (error) {
      this.logger.error('Disconnect error', error);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: Socket): Promise<void> {
    const { sessionId } = client.data;
    if (sessionId) {
      await this.playerConnectionService.updateHeartbeat(sessionId);
    }
  }

  // Helper method to extract userId from token (simplified)
  private async getUserIdFromToken(token: string): Promise<string | null> {
    // This is a placeholder - implement your token verification logic
    // You should use your actual auth service here
    try {
      // Example: const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // return decoded.userId;
      return 'sample-user-id'; // Replace with actual implementation
    } catch (error) {
      this.logger.error('Invalid token', error);
      return null;
    }
  }
}