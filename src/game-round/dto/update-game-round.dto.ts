import { PartialType } from '@nestjs/mapped-types';
import { CreateGameRoundDto } from './create-game-round.dto';

export class UpdateGameRoundDto extends PartialType(CreateGameRoundDto) {}
