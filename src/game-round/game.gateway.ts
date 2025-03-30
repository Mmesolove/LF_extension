import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class GameGateway {
  @WebSocketServer()
  server: Server;

  notifyRoundUpdate(roundId: number) {
    this.server.emit('roundUpdated', { roundId });
  }
}
