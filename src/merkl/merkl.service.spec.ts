import { ContractIndices } from '@daohost/host/out/host.types';
import { mapSeedMevBotsOpportunity } from './merkl.mapper';

describe('mapSeedMevBotsOpportunity', () => {
  it('maps the displayed APR and campaign into the seed token entry', () => {
    const result = mapSeedMevBotsOpportunity({
      chainId: 1,
      name: 'Hold MEV Machines SEED',
      apr: 590,
      totalApr: 596.1648072800859,
      latestCampaignEnd: '1787443200',
      rewardsRecord: {
        breakdowns: [
          {
            campaignId: '2316894702041849715',
            token: {
              address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              symbol: 'USDC',
              name: 'USD Coin',
            },
          },
        ],
      },
    });

    expect(result['1'][String(ContractIndices.SEED_TOKEN_1)]).toEqual({
      apr: 596.1648072800859,
      campaignId: '2316894702041849715',
      rewards: [
        {
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          symbol: 'USDC',
          name: 'USD Coin',
        },
      ],
      name: 'Hold MEV Machines SEED',
      endDate: '2026-08-23T00:00:00.000Z',
    });
  });

  it('rejects an opportunity without an active campaign', () => {
    expect(() =>
      mapSeedMevBotsOpportunity({
        chainId: 1,
        name: 'Hold MEV Machines SEED',
        apr: 0,
        totalApr: 0,
      }),
    ).toThrow('Merkl opportunity has no active campaign');
  });
});
