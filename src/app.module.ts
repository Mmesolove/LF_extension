import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameRoundModule } from './game-round/game-round.module';
import { GameSessionModule } from './game-session/game-session.module';
import question

@Module({
  imports: [GameRoundModule, GameRoundModule, QuestionModule],
  controllers: [AppController],
  providers: [AppService],
}), 
export class AppModule {}
