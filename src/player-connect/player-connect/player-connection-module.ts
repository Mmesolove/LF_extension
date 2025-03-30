// src/player-connection/player-connection.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { PlayerConnection, PlayerConnectionSchema } from './schemas/player-connection.schema';
import { PlayerConnectionService } from './player-connection.service';
import { PlayerConnectionController } from './player-connection.controller';
import { PlayerConnectionGateway } from './player-connection.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlayerConnection.name, schema: PlayerConnectionSchema },
    ]),
    ScheduleModule.forRoot(),
  ],
  providers: [PlayerConnectionService, PlayerConnectionGateway],
  controllers: [PlayerConnectionController],
  exports: [PlayerConnectionService],
})
export class PlayerConnectionModule {}