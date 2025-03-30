// src/player-connection/schemas/player-connection.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  IDLE = 'idle',
}

@Schema({ timestamps: true })
export class PlayerConnection extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, unique: true })
  sessionId: string;

  @Prop({ type: Object })
  deviceInfo: {
    ip?: string;
    userAgent?: string;
    platform?: string;
    browser?: string;
  };

  @Prop({ 
    type: String, 
    enum: ConnectionStatus, 
    default: ConnectionStatus.CONNECTED,
    index: true
  })
  connectionStatus: ConnectionStatus;

  @Prop({ default: Date.now })
  lastActive: Date;

  @Prop()
  lastDisconnect?: Date;

  @Prop({ default: 0 })
  reconnectCount: number;

  @Prop()
  heartbeatInterval: number;
}

export const PlayerConnectionSchema = SchemaFactory.createForClass(PlayerConnection);
