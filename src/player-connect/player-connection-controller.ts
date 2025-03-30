// src/player-connection/player-connection.controller.ts
import { Controller, Post, Get, Body, Param, UseGuards, Req, Logger } from '@nestjs/common';
import { PlayerConnectionService } from './player-connection.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlayerConnection } from './schemas/player-connection.schema';

@Controller('player-connection')
export class PlayerConnectionController {
  private readonly logger = new Logger(PlayerConnectionController.name);

  constructor(private readonly playerConnectionService: PlayerConnectionService) {}

  @UseGuards(JwtAuthGuard)
  @Post('connect')
  async connect(@Req() req): Promise<{ sessionId: string }> {
    const userId = req.user.id;
    const deviceInfo = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      // You can extract more device info here
    };
    
    const connection = await this.playerConnectionService.createConnection(userId, deviceInfo);
    return { sessionId: connection.sessionId };
  }

  @UseGuards(JwtAuthGuard)
  @Post('heartbeat/:sessionId')
  async heartbeat(@Param('sessionId') sessionId: string): Promise<{ status: string }> {
    await this.playerConnectionService.updateHeartbeat(sessionId);
    return { status: 'ok' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('disconnect/:sessionId')
  async disconnect(@Param('sessionId') sessionId: string): Promise<{ status: string }> {
    await this.playerConnectionService.disconnect(sessionId);
    return { status: 'disconnected' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('reconnect/:sessionId')
  async reconnect(@Req() req, @Param('sessionId') sessionId: string): Promise<{ status: string, connection?: PlayerConnection }> {
    const userId = req.user.id;
    const connection = await this.playerConnectionService.reconnect(userId, sessionId);
    
    if (!connection) {
      return { status: 'failed', connection: null };
    }
    
    return { status: 'reconnected', connection };
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-connections')
  async getMyConnections(@Req() req): Promise<PlayerConnection[]> {
    const userId = req.user.id;
    return this.playerConnectionService.getPlayerConnections(userId);
  }

  // Admin endpoints (should have proper admin guard)
  @Get('stats')
  async getConnectionStats(): Promise<any> {
    return this.playerConnectionService.getConnectionStats();
  }

  @Get('active')
  async getActiveConnections(): Promise<PlayerConnection[]> {
    return this.playerConnectionService.getActiveConnections();
  }
}