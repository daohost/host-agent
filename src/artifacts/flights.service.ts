import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IFlight } from '@daohost/host';
import { FlightsGateway } from './flights.gateway';
import { readJsonFiles } from './read-json-files';

const READ_CONCURRENCY = 64;

@Injectable()
export class FlightsService implements OnModuleInit {
  private readonly logger = new Logger(FlightsService.name);
  private readonly storagePath: string;
  private readonly cacheEnabled: boolean;
  private readonly cache = new Map<string, IFlight>();
  private cacheReady = false;

  constructor(
    @Inject(forwardRef(() => FlightsGateway))
    private readonly flightsGateway: FlightsGateway,
    private readonly configService: ConfigService,
  ) {
    const base =
      this.configService.get<string>('storagePath') ?? process.cwd();
    this.storagePath = path.resolve(base, 'flights');
    this.cacheEnabled =
      this.configService.get<boolean>('cacheEnabled') ?? false;
  }

  async onModuleInit(): Promise<void> {
    await fs.mkdir(this.storagePath, { recursive: true });
    this.logger.log(`Flights storage ready at ${this.storagePath}`);
    if (!this.cacheEnabled) {
      this.logger.log('Flights cache disabled — serving from disk');
      return;
    }
    // Fire-and-forget: warming reads the whole store, so don't block app
    // startup on it. Reads fall back to disk until the cache is ready.
    this.logger.log('Flights cache enabled — warming in background...');
    void this.warmCache().catch((e) =>
      this.logger.error(`Flights cache warm failed: ${e?.message}`),
    );
  }

  private async warmCache(): Promise<void> {
    const startedAt = process.hrtime.bigint();
    this.cache.clear();
    for (const flight of await this.readAllFromDisk()) {
      this.cache.set(flight.id, flight);
    }
    this.cacheReady = true;
    const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;
    this.logger.log(
      `Loaded ${this.cache.size} flights into cache in ${ms.toFixed(0)}ms`,
    );
  }

  private getFilePath(id: string): string {
    const safeId = id.replace(/[^a-zA-Z0-9_\-]/g, '_');
    return path.join(this.storagePath, `${safeId}.json`);
  }

  async upsert(flight: IFlight): Promise<IFlight> {
    const filePath = this.getFilePath(flight.id);
    await fs.writeFile(filePath, JSON.stringify(flight, null, 2), 'utf-8');
    if (this.cacheEnabled) {
      this.cache.set(flight.id, flight);
    }
    this.logger.log(`Saved flight: ${flight.id}`);
    this.flightsGateway.broadcastFlightUpdated(flight);
    return flight;
  }

  async findById(id: string): Promise<IFlight | null> {
    if (this.cacheEnabled && this.cacheReady) {
      return this.cache.get(id) ?? null;
    }

    const filePath = this.getFilePath(id);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as IFlight;
    } catch (e) {
      if (e?.code === 'ENOENT') return null;
      if (e instanceof SyntaxError) {
        this.logger.warn(`Skipping corrupt flight file ${id}: ${e.message}`);
        return null;
      }
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
    const flights =
      this.cacheEnabled && this.cacheReady
        ? [...this.cache.values()]
        : await this.readAllFromDisk();
    // here we decreasing reply size (on copies, so cache entries stay intact)
    return flights
      .map((f) => ({ ...f, workflows: [] }))
      .sort((a, b) => (b.created ?? 0) - (a.created ?? 0));
  }

  private async readAllFromDisk(): Promise<IFlight[]> {
    let entries: string[];
    try {
      entries = await fs.readdir(this.storagePath);
    } catch (e) {
      if (e?.code === 'ENOENT') return [];
      throw e;
    }

    const files = entries.filter((f) => f.endsWith('.json'));
    return readJsonFiles<IFlight>(
      this.storagePath,
      files,
      READ_CONCURRENCY,
      (file, message) =>
        this.logger.warn(`Skipping corrupt flight file ${file}: ${message}`),
    );
  }

  async delete(id: string): Promise<boolean> {
    const filePath = this.getFilePath(id);
    try {
      await fs.unlink(filePath);
    } catch (e) {
      if (e?.code === 'ENOENT') return false;
      throw e;
    }
    if (this.cacheEnabled) {
      this.cache.delete(id);
    }
    this.logger.log(`Deleted flight: ${id}`);
    this.flightsGateway.broadcastFlightDeleted(id);
    return true;
  }
}
