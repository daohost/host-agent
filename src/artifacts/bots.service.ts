import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { IBot } from '@daohost/host/out/bot';

@Injectable()
export class BotsService implements OnModuleInit {
  private readonly logger = new Logger(BotsService.name);
  private readonly storagePath: string;

  constructor() {
    this.storagePath = path.resolve(process.cwd(), 'bots');
  }

  onModuleInit() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
      this.logger.log(`Created bots storage at ${this.storagePath}`);
    }
  }

  private getFilePath(software: string): string {
    const safeId = software.replace(/[^a-zA-Z0-9_\-]/g, '_');
    return path.join(this.storagePath, `${safeId}.json`);
  }

  upsert(bot: IBot): IBot {
    const filePath = this.getFilePath(bot.software);
    fs.writeFileSync(filePath, JSON.stringify(bot, null, 2), 'utf-8');
    this.logger.log(`Saved bot: ${bot.software}`);
    return bot;
  }

  findBySoftware(software: string): IBot | null {
    const filePath = this.getFilePath(software);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as IBot;
  }

  findAll(): IBot[] {
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
      return JSON.parse(content) as IBot;
    });
  }

  delete(software: string): boolean {
    const filePath = this.getFilePath(software);
    if (!fs.existsSync(filePath)) {
      return false;
    }

    fs.unlinkSync(filePath);
    this.logger.log(`Deleted bot: ${software}`);
    return true;
  }
}
