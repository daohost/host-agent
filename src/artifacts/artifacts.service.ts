import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { IMevArtifact } from '@daohost/host';
import { readJsonFiles } from './read-json-files';

const READ_CONCURRENCY = 64;

@Injectable()
export class ArtifactsService implements OnModuleInit {
  private readonly logger = new Logger(ArtifactsService.name);
  private readonly storagePath: string;
  private readonly cacheEnabled: boolean;
  private readonly cache = new Map<string, IMevArtifact>();
  private cacheReady = false;

  constructor(private readonly configService: ConfigService) {
    const base =
      this.configService.get<string>('storagePath') ?? process.cwd();
    this.storagePath = path.resolve(base, 'artifacts');
    this.cacheEnabled =
      this.configService.get<boolean>('cacheEnabled') ?? false;
  }

  onModuleInit(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
      this.logger.log(`Created artifacts storage at ${this.storagePath}`);
    }
    if (!this.cacheEnabled) {
      this.logger.log('Artifacts cache disabled — serving from disk');
      return;
    }
    // Fire-and-forget: warming reads the whole store, so don't block app
    // startup on it. Reads fall back to disk until the cache is ready.
    this.logger.log('Artifacts cache enabled — warming in background...');
    void this.warmCache().catch((e) =>
      this.logger.error(`Artifacts cache warm failed: ${e?.message}`),
    );
  }

  private async warmCache(): Promise<void> {
    const startedAt = process.hrtime.bigint();
    this.cache.clear();

    if (fs.existsSync(this.storagePath)) {
      const files = fs
        .readdirSync(this.storagePath)
        .filter((f) => f.endsWith('.json'));
      const artifacts = await readJsonFiles<IMevArtifact>(
        this.storagePath,
        files,
        READ_CONCURRENCY,
        (file, message) =>
          this.logger.warn(`Skipping corrupt artifact file ${file}: ${message}`),
      );
      for (const artifact of artifacts) {
        this.cache.set(artifact.id, artifact);
      }
    }

    this.cacheReady = true;
    const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;
    this.logger.log(
      `Loaded ${this.cache.size} artifacts into cache in ${ms.toFixed(0)}ms`,
    );
  }

  private readAllFromDisk(): IMevArtifact[] {
    if (!fs.existsSync(this.storagePath)) {
      return [];
    }

    const files = fs
      .readdirSync(this.storagePath)
      .filter((f) => f.endsWith('.json'));
    const artifacts: IMevArtifact[] = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(
          path.join(this.storagePath, file),
          'utf-8',
        );
        artifacts.push(JSON.parse(content) as IMevArtifact);
      } catch (e) {
        this.logger.warn(`Skipping corrupt artifact file ${file}: ${e?.message}`);
      }
    }
    return artifacts;
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
    if (this.cacheEnabled) {
      this.cache.set(artifact.id, artifact);
    }
    this.logger.log(`Created artifact: ${artifact.id}`);
    return artifact;
  }

  findById(id: string): IMevArtifact | null {
    if (this.cacheEnabled && this.cacheReady) {
      return this.cache.get(id) ?? null;
    }

    const filePath = this.getFilePath(id);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as IMevArtifact;
  }

  findByIds(ids: string[]): IMevArtifact[] {
    return ids
      .map((id) => this.findById(id))
      .filter((a): a is IMevArtifact => a !== null);
  }

  findAll(): IMevArtifact[] {
    const artifacts =
      this.cacheEnabled && this.cacheReady
        ? [...this.cache.values()]
        : this.readAllFromDisk();
    // here we decreasing reply size (on copies, so cache entries stay intact)
    return artifacts
      .map((a) => ({ ...a, data: undefined, mevMined: undefined }))
      .sort((a, b) => (b.created ?? 0) - (a.created ?? 0));
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
    if (this.cacheEnabled) {
      this.cache.set(id, updated);
    }
    this.logger.log(`Updated artifact: ${id}`);
    return updated;
  }

  delete(id: string): boolean {
    const filePath = this.getFilePath(id);
    if (!fs.existsSync(filePath)) {
      return false;
    }

    fs.unlinkSync(filePath);
    if (this.cacheEnabled) {
      this.cache.delete(id);
    }
    this.logger.log(`Deleted artifact: ${id}`);
    return true;
  }
}
