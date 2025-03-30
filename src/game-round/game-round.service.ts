/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameRound, RoundStatus } from './entities/game-round.entity';
import { GameSession } from '../game-session/entities/game-session.entity';
import { Question } from '../question/entities/question.entity';

@Injectable()
export class GameRoundService {
  constructor(
    @InjectRepository(GameRound) private roundRepository: Repository<GameRound>,
    @InjectRepository(GameSession)
    private sessionRepository: Repository<GameSession>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  async startNewRound(
    sessionId: number,
    questionId: number,
  ): Promise<GameRound> {
    const session = await this.sessionRepository.findOne({
      where: { sessionId },
    });
    if (!session) throw new NotFoundException('Game session not found');

    const question = await this.questionRepository.findOne({
      where: { id: questionId },
    });
    if (!question) throw new NotFoundException('Question not found');

    const newRound = this.roundRepository.create({
      session,
      question,
      startTime: new Date(),
      status: RoundStatus.ACTIVE,
    });

    const savedRound = await this.roundRepository.save(newRound);

    // Automatically complete round after `timeLimit` seconds
    setTimeout(async () => {
      await this.completeRound(savedRound.roundId);
    }, savedRound.timeLimit * 1000);

    return savedRound;
  }

  async completeRound(roundId: number): Promise<GameRound> {
    const round = await this.roundRepository.findOne({ where: { roundId } });
    if (!round) throw new NotFoundException('Round not found');

    round.status = RoundStatus.COMPLETED;
    round.endTime = new Date();

    const updatedRound = await this.roundRepository.save(round);

    this.gameGateway.notifyRoundUpdate(roundId);

    return updatedRound;
  }

  async getActiveRound(sessionId: number): Promise<GameRound | null> {
    return this.roundRepository.findOne({
      where: { session: { sessionId }, status: RoundStatus.ACTIVE },
    });
  }
}
