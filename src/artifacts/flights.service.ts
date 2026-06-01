import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IFlight } from '@daohost/host';
import { FlightsGateway } from './flights.gateway';

@Injectable()
export class FlightsService implements OnModuleInit {
  private readonly logger = new Logger(FlightsService.name);
  private readonly storagePath: string;

  constructor(
    @Inject(forwardRef(() => FlightsGateway))
    private readonly flightsGateway: FlightsGateway,
  ) {
    this.storagePath = path.resolve(process.cwd(), 'flights');
  }

  async onModuleInit(): Promise<void> {
    await fs.mkdir(this.storagePath, { recursive: true });
    this.logger.log(`Flights storage ready at ${this.storagePath}`);
  }

  private getFilePath(id: string): string {
    const safeId = id.replace(/[^a-zA-Z0-9_\-]/g, '_');
    return path.join(this.storagePath, `${safeId}.json`);
  }

  async upsert(flight: IFlight): Promise<IFlight> {
    const filePath = this.getFilePath(flight.id);
    await fs.writeFile(filePath, JSON.stringify(flight, null, 2), 'utf-8');
    this.logger.log(`Saved flight: ${flight.id}`);
    this.flightsGateway.broadcastFlightUpdated(flight);
    return flight;
  }

  async findById(id: string): Promise<IFlight | null> {
    const filePath = this.getFilePath(id);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as IFlight;
    } catch (e) {
      if (e?.code === 'ENOENT') return null;
      throw e;
    }
  }

  async findSuccessful(): Promise<IFlight[]> {
    return (await this.findAll()).filter((f) => f.made?.length > 0);
  }

  async findActive(): Promise<IFlight[]> {
    return (await this.findAll()).filter((f) => f.complete == null);
  }

  async findAll(): Promise<IFlight[]> {
    let entries: string[];
    try {
      entries = await fs.readdir(this.storagePath);
    } catch (e) {
      if (e?.code === 'ENOENT') return [];
      throw e;
    }

    const files = entries.filter((f) => f.endsWith('.json'));
    const flights = await Promise.all(
      files.map(async (file) => {
        const content = await fs.readFile(
          path.join(this.storagePath, file),
          'utf-8',
        );
        return JSON.parse(content) as IFlight;
      }),
    );
    // here we decreasing reply size
    for (let i = 0; i < flights.length; i++) {
      flights[i].workflows = [];
    }
    return flights.sort((a, b) => (b.created ?? 0) - (a.created ?? 0));
  }

  async delete(id: string): Promise<boolean> {
    const filePath = this.getFilePath(id);
    try {
      await fs.unlink(filePath);
    } catch (e) {
      if (e?.code === 'ENOENT') return false;
      throw e;
    }
    this.logger.log(`Deleted flight: ${id}`);
    this.flightsGateway.broadcastFlightDeleted(id);
    return true;
  }
}
