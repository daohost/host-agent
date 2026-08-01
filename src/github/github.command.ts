import { Injectable } from '@nestjs/common';
import { Command } from 'nestjs-command';
import { GithubService } from './github.service';

@Injectable()
export class GithubCommand {
  constructor(private readonly githubService: GithubService) {}
  @Command({
    command: 'sync:labels',
  })
  async syncLabels(): Promise<void> {
    await this.githubService.syncLabels();
  }
}
