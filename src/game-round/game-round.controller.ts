import { Controller, Post, Param, Patch, Get } from '@nestjs/common';
import { GameRoundService } from './game-round.service';
import { GameRound } from './entities/game-round.entity';

@Controller('game-round')
export class GameRoundController {
  constructor(private readonly gameRoundService: GameRoundService) {}

  @Post('start/:sessionId/:questionId')
  async startRound(
    @Param('sessionId') sessionId: number,
    @Param('questionId') questionId: number,
  ): Promise<GameRound> {
    return this.gameRoundService.startNewRound(sessionId, questionId);
  }

  @Patch('complete/:roundId')
  async completeRound(@Param('roundId') roundId: number): Promise<GameRound> {
    return this.gameRoundService.completeRound(roundId);
  }

  @Get('active/:sessionId')
  async getActiveRound(
    @Param('sessionId') sessionId: number,
  ): Promise<GameRound | null> {
    return this.gameRoundService.getActiveRound(sessionId);
  }
}
