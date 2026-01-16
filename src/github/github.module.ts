import { Module } from '@nestjs/common';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';
import { GithubCommand } from './github.command';
import { DaoModule } from '../dao/dao.module';
import { RevenueModule } from '../revenue/revenue.module';
import { OnChainDataModule } from '../on-chain-data/on-chain-data.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  controllers: [GithubController],
  imports: [DaoModule, RevenueModule, OnChainDataModule, AnalyticsModule],
  providers: [GithubService, GithubCommand],
  exports: [GithubService],
})
export class GithubModule {}
