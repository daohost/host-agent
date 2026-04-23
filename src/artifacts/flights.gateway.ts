import { Inject, forwardRef, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IFlight } from '@daohost/host/out/bot';
import { FlightsService } from './flights.service';
import { BotsService } from './bots.service';

@WebSocketGateway({ namespace: 'flights', cors: { origin: '*' } })
export class FlightsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(FlightsGateway.name);

  @WebSocketServer()
  private server: Server;

  constructor(
    @Inject(forwardRef(() => FlightsService))
    private readonly flightsService: FlightsService,
    private readonly botsService: BotsService,
  ) {}

  handleConnection(client: Socket) {
    const flightId =
      (client.handshake.query.flightId as string) ||
      (client.handshake.auth?.flightId as string);

    if (!flightId) {
      client.emit('error', {
        message: 'flightId query parameter is required',
      });
      client.disconnect();
      return;
    }

    const flight = this.flightsService.findById(flightId);
    if (!flight) {
      client.emit('error', { message: `Flight ${flightId} not found` });
      client.disconnect();
      return;
    }

    client.join(flightId);

    const bot = this.botsService.findBySoftware(flight.software);
    client.emit('bot', bot);
    client.emit('flight', flight);

    this.logger.log(
      `Client ${client.id} subscribed to flight ${flightId} (software=${flight.software})`,
    );
  }

  broadcastFlightUpdated(flight: IFlight) {
    this.server?.to(flight.id).emit('flight:updated', flight);
  }

  broadcastFlightDeleted(id: string) {
    this.server?.to(id).emit('flight:deleted', { id });
  }
}
