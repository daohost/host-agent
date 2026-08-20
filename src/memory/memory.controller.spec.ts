jest.mock('../merkl/merkl.service', () => ({
  MerklService: class MerklService {},
}));
jest.mock('src/analytics/analytics.service', () => ({
  AnalyticsService: class AnalyticsService {},
}));
jest.mock('src/github/github.service', () => ({
  GithubService: class GithubService {},
}));
jest.mock('src/on-chain-data/on-chain-data.service', () => ({
  OnChainDataService: class OnChainDataService {},
}));
jest.mock('src/revenue/revenue.service', () => ({
  RevenueService: class RevenueService {},
}));
jest.mock('src/telegram/telegram.service', () => ({
  TelegramService: class TelegramService {},
}));
jest.mock('src/token-holders/token-holders.service', () => ({
  TokenHoldersService: class TokenHoldersService {},
}));
jest.mock('src/twitter/twitter.service', () => ({
  TwitterService: class TwitterService {},
}));
jest.mock('src/tx-sender/tx-monitoring.service', () => ({
  TxMonitoringService: class TxMonitoringService {},
}));

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IHostAgentMemoryV3 } from '@daohost/host';
import { Server } from 'http';
import * as request from 'supertest';
import { AnalyticsService } from 'src/analytics/analytics.service';
import { GithubService } from 'src/github/github.service';
import { MerklService } from '../merkl/merkl.service';
import { OnChainDataService } from 'src/on-chain-data/on-chain-data.service';
import { RevenueService } from 'src/revenue/revenue.service';
import { TelegramService } from 'src/telegram/telegram.service';
import { TokenHoldersService } from 'src/token-holders/token-holders.service';
import { TwitterService } from 'src/twitter/twitter.service';
import { TxMonitoringService } from 'src/tx-sender/tx-monitoring.service';
import { MemoryController } from './memory.controller';
import { MemoryV2Service } from './memory.service';

const seedMEVBOTSAddress = '0x999995c72dd0c41241552c9c889a93dc78d99999';

describe('MemoryController Merkl integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [MemoryController],
      providers: [
        MemoryV2Service,
        { provide: GithubService, useValue: { builderMemory: {} } },
        {
          provide: AnalyticsService,
          useValue: { getChainTvls: () => ({}), getPricesList: () => ({}) },
        },
        {
          provide: RevenueService,
          useValue: {
            getRevenueChart: () => ({}),
            getRevenueChartV2: () => ({}),
          },
        },
        {
          provide: OnChainDataService,
          useValue: { getOnChainData: () => ({}) },
        },
        {
          provide: TxMonitoringService,
          useValue: { spendingReport: undefined },
        },
        { provide: TelegramService, useValue: { daoUsers: {} } },
        { provide: TwitterService, useValue: { twitterFollowers: {} } },
        {
          provide: TokenHoldersService,
          useValue: { getDaoTokenHolder: () => ({}) },
        },
        {
          provide: MerklService,
          useValue: {
            getDaoMerklData: (symbol: string) =>
              symbol === 'MEVBOTS'
                ? {
                    '1': {
                      [seedMEVBOTSAddress]: {
                        apr: 596.1648072800859,
                        campaignId: '2316894702041849715',
                        rewards: [],
                      },
                    },
                  }
                : undefined,
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes seedMEVBOTS Merkl data through the v3 memory endpoint', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/host-agent-memory-v3')
      .expect(200);
    const body = response.body as IHostAgentMemoryV3;

    expect(
      body.data.daos.MEVBOTS.merkl?.['1'][seedMEVBOTSAddress],
    ).toMatchObject({
      apr: 596.1648072800859,
      campaignId: '2316894702041849715',
    });
  });
});
