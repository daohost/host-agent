import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  IMevArtifact,
} from '@daohost/host/out/daos/mevbots';

@Injectable()
export class ArtifactsService implements OnModuleInit {
  private readonly logger = new Logger(ArtifactsService.name);
  private readonly storagePath: string;

  constructor() {
    this.storagePath = path.resolve(process.cwd(), 'artifacts');
  }

  onModuleInit() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
      this.logger.log(`Created artifacts storage at ${this.storagePath}`);
    }
  }

  private getFilePath(id: string): string {
    const safeId = id.replace(/[^a-zA-Z0-9_\-]/g, '_');
    return path.join(this.storagePath, `${safeId}.json`);
  }

  create(artifact: IMevArtifact): IMevArtifact {
    const filePath = this.getFilePath(artifact.id);
    if (fs.existsSync(filePath)) {
      throw new Error(`Artifact ${artifact.id} already exists`);
    }

    fs.writeFileSync(filePath, JSON.stringify(artifact, null, 2), 'utf-8');
    this.logger.log(`Created artifact: ${artifact.id}`);
    return artifact;
  }

  findById(id: string): IMevArtifact | null {
    const filePath = this.getFilePath(id);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as IMevArtifact;
  }

  findAll(): IMevArtifact[] {
    if (!fs.existsSync(this.storagePath)) {
      return [];
    }

    const files = fs.readdirSync(this.storagePath).filter((f) => f.endsWith('.json'));
    return files.map((file) => {
      const content = fs.readFileSync(path.join(this.storagePath, file), 'utf-8');
      return JSON.parse(content) as IMevArtifact;
    });
  }

  update(id: string, updates: Partial<IMevArtifact>): IMevArtifact {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Artifact ${id} not found`);
    }

    const updated: IMevArtifact = {
      ...existing,
      ...updates,
      id: existing.id,
      updated: Date.now(),
    };

    const filePath = this.getFilePath(id);
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    this.logger.log(`Updated artifact: ${id}`);
    return updated;
  }

  delete(id: string): boolean {
    const filePath = this.getFilePath(id);
    if (!fs.existsSync(filePath)) {
      return false;
    }

    fs.unlinkSync(filePath);
    this.logger.log(`Deleted artifact: ${id}`);
    return true;
  }
}
