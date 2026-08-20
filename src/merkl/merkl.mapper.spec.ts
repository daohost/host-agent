import { mapSeedMevBotsOpportunity } from './merkl.mapper';
import { opportunity } from './merkl.fixture';

const seedMEVBOTSAddress = '0x999995c72dd0c41241552c9c889a93dc78d99999';

describe('mapSeedMevBotsOpportunity', () => {
  it('maps the displayed APR and campaign into the seed contract index', () => {
    const result = mapSeedMevBotsOpportunity(opportunity, seedMEVBOTSAddress);

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
    const result = mapSeedMevBotsOpportunity(
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
      seedMEVBOTSAddress,
    );

    expect(result['1'][seedMEVBOTSAddress]).toMatchObject({
      apr: 590,
      endDate: undefined,
      rewards: [{ symbol: 'USDC', name: 'USDC' }],
    });
  });

  it('rejects an opportunity without an active campaign', () => {
    expect(() =>
      mapSeedMevBotsOpportunity(
        {
          chainId: 1,
          status: 'LIVE',
          name: 'Hold MEV Machines SEED',
          apr: 0,
          totalApr: 0,
        },
        seedMEVBOTSAddress,
      ),
    ).toThrow('Merkl opportunity has no active campaign');
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])(
    'rejects invalid APR %s',
    (apr) => {
      expect(() =>
        mapSeedMevBotsOpportunity(
          {
            ...opportunity,
            apr,
            totalApr: undefined,
          },
          seedMEVBOTSAddress,
        ),
      ).toThrow('Merkl opportunity has invalid APR');
    },
  );

  it.each([
    [{ ...opportunity, chainId: 10 }, 'unexpected chain'],
    [{ ...opportunity, status: 'PAST' }, 'is not live'],
  ])('rejects an invalid fixed opportunity', (value, message) => {
    expect(() => mapSeedMevBotsOpportunity(value, seedMEVBOTSAddress)).toThrow(
      message,
    );
  });

  it('omits malformed reward-token addresses', () => {
    const result = mapSeedMevBotsOpportunity(
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
      seedMEVBOTSAddress,
    );

    expect(result['1'][seedMEVBOTSAddress].rewards).toEqual([]);
  });
});
