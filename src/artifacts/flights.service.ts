import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { IFlight } from '@daohost/host/out/bot';
import { FlightsGateway } from './flights.gateway';

@Injectable()
export class FlightsService implements OnModuleInit {
  private readonly logger = new Logger(FlightsService.name);
  private readonly storagePath: string;

  constructor(private readonly flightsGateway: FlightsGateway) {
    this.storagePath = path.resolve(process.cwd(), 'flights');
  }

  onModuleInit() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
      this.logger.log(`Created flights storage at ${this.storagePath}`);
    }
  }

  private getFilePath(id: string): string {
    const safeId = id.replace(/[^a-zA-Z0-9_\-]/g, '_');
    return path.join(this.storagePath, `${safeId}.json`);
  }

  upsert(flight: IFlight): IFlight {
    const filePath = this.getFilePath(flight.id);
    fs.writeFileSync(filePath, JSON.stringify(flight, null, 2), 'utf-8');
    this.logger.log(`Saved flight: ${flight.id}`);
    this.flightsGateway.broadcastFlightUpdated(flight);
    return flight;
  }

  findById(id: string): IFlight | null {
    const filePath = this.getFilePath(id);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as IFlight;
  }

  findSuccessful(): IFlight[] {
    return this.findAll().filter((f) => f.made?.length > 0);
  }

  findActive(): IFlight[] {
    return this.findAll().filter((f) => f.complete == null);
  }

  findAll(): IFlight[] {
    if (!fs.existsSync(this.storagePath)) {
      return [];
    }

    const files = fs
      .readdirSync(this.storagePath)
      .filter((f) => f.endsWith('.json'));
    return files.map((file) => {
      const content = fs.readFileSync(
        path.join(this.storagePath, file),
        'utf-8',
      );
      return JSON.parse(content) as IFlight;
    });
  }

  delete(id: string): boolean {
    const filePath = this.getFilePath(id);
    if (!fs.existsSync(filePath)) {
      return false;
    }

    fs.unlinkSync(filePath);
    this.logger.log(`Deleted flight: ${id}`);
    this.flightsGateway.broadcastFlightDeleted(id);
    return true;
  }
}
