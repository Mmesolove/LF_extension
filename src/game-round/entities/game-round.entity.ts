import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GameSession } from '../../game-session/entities/game-session.entity';
import { Question } from '../../question/entities/question.entity';

export enum RoundStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

@Entity()
export class GameRound {
  @PrimaryGeneratedColumn()
  roundId: number;

  @ManyToOne(() => GameSession, (session) => session.rounds, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  session: GameSession;

  @ManyToOne(() => Question, { nullable: false, onDelete: 'CASCADE' })
  question: Question;

  @CreateDateColumn()
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'enum', enum: RoundStatus, default: RoundStatus.PENDING })
  status: RoundStatus;

  @Column({ type: 'int', default: 30 })
  timeLimit: number;

  @Column({ type: 'int', default: 10 })
  pointValue: number;
}
