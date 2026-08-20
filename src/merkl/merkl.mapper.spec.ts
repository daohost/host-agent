import { mapSeedTokenOpportunity, SeedTokenDeployment } from './merkl.mapper';
import { opportunity } from './merkl.fixture';

const seedMEVBOTSAddress = '0x999995c72dd0c41241552c9c889a93dc78d99999';
const deployment = {
  daoSymbol: 'MEVBOTS',
  chainId: '1',
  address: seedMEVBOTSAddress,
} satisfies SeedTokenDeployment;

describe('mapSeedTokenOpportunity', () => {
  it('maps the displayed APR and campaign under the seed-token address', () => {
    const result = mapSeedTokenOpportunity(opportunity, deployment);

    expect(result['1'][seedMEVBOTSAddress]).toEqual({
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

  it('falls back to APR and token symbol when optional values are absent', () => {
    const result = mapSeedTokenOpportunity(
      {
        ...opportunity,
        totalApr: undefined,
        latestCampaignEnd: undefined,
        rewardsRecord: {
          breakdowns: [
            {
              ...opportunity.rewardsRecord.breakdowns[0],
              token: {
                ...opportunity.rewardsRecord.breakdowns[0].token,
                name: null,
              },
            },
          ],
        },
      },
      deployment,
    );

    expect(result['1'][seedMEVBOTSAddress]).toMatchObject({
      apr: 590,
      endDate: undefined,
      rewards: [{ symbol: 'USDC', name: 'USDC' }],
    });
  });

  it('rejects an opportunity without an active campaign', () => {
    expect(() =>
      mapSeedTokenOpportunity(
        {
          ...opportunity,
          apr: 0,
          totalApr: 0,
          rewardsRecord: undefined,
        },
        deployment,
      ),
    ).toThrow('Merkl opportunity has no active campaign');
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])(
    'rejects invalid APR %s',
    (apr) => {
      expect(() =>
        mapSeedTokenOpportunity(
          {
            ...opportunity,
            apr,
            totalApr: undefined,
          },
          deployment,
        ),
      ).toThrow('Merkl opportunity has invalid APR');
    },
  );

  it.each([
    [{ ...opportunity, chainId: 10 }, 'unexpected chain'],
    [
      {
        ...opportunity,
        identifier: '0x0000000000000000000000000000000000000000',
      },
      'unexpected identifier',
    ],
    [{ ...opportunity, action: 'STAKE' }, 'unexpected action'],
    [{ ...opportunity, status: 'PAST' }, 'is not live'],
  ])('rejects a mismatched opportunity', (value, message) => {
    expect(() => mapSeedTokenOpportunity(value, deployment)).toThrow(message);
  });

  it('omits malformed reward-token addresses', () => {
    const result = mapSeedTokenOpportunity(
      {
        ...opportunity,
        rewardsRecord: {
          breakdowns: [
            {
              ...opportunity.rewardsRecord.breakdowns[0],
              token: {
                ...opportunity.rewardsRecord.breakdowns[0].token,
                address: 'invalid',
              },
            },
          ],
        },
      },
      deployment,
    );

    expect(result['1'][seedMEVBOTSAddress].rewards).toEqual([]);
  });
});
