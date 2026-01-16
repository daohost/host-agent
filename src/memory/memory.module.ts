import { Module } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { MemoryController } from './memory.controller';
import { RevenueModule } from '../revenue/revenue.module';
import { GithubModule } from '../github/github.module';
import { OnChainDataModule } from '../on-chain-data/on-chain-data.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [RevenueModule, GithubModule, OnChainDataModule, AnalyticsModule],
  providers: [MemoryService],
  controllers: [MemoryController],
})
export class MemoryModule {}
