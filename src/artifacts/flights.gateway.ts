import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IFlight } from '@daohost/host/out/bot';

const hostVersion: string = require('@daohost/host/package.json').version;

@WebSocketGateway({ namespace: 'flights', cors: { origin: '*' } })
export class FlightsGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server: Server;

  handleConnection(client: Socket) {
    client.emit('metadata', {
      mevbotVersion: hostVersion,
    });
  }

  broadcastFlightUpdated(flight: IFlight) {
    this.server?.emit('flight:updated', flight);
  }

  broadcastFlightDeleted(id: string) {
    this.server?.emit('flight:deleted', { id });
  }
}
