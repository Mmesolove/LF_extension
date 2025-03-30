import { Module } from '@nestjs/common';
import { GameRoundService } from './game-round.service';
import { GameRoundController } from './game-round.controller';

@Module({
  controllers: [GameRoundController],
  providers: [GameRoundService],
})
export class GameRoundModule {}
