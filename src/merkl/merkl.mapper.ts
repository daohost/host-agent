import { IDAOAPIDataV2 } from '@daohost/host/out/api';

type MerklData = NonNullable<IDAOAPIDataV2['merkl']>;

export interface MerklOpportunity {
  chainId: number;
  status: string;
  name: string;
  apr: number;
  totalApr?: number;
  latestCampaignEnd?: string | bigint;
  rewardsRecord?: {
    breakdowns: {
      campaignId: string;
      token: {
        address: string;
        symbol: string;
        name: string | null;
      };
    }[];
  };
}

export function mapSeedMevBotsOpportunity(
  opportunity: MerklOpportunity,
  seedMEVBOTSAddress: `0x${string}`,
): MerklData {
  const campaignId = opportunity.rewardsRecord?.breakdowns[0]?.campaignId;
  const apr = opportunity.totalApr ?? opportunity.apr;

  if (opportunity.chainId !== 1) {
    throw new Error(
      `seedMEVBOTS Merkl opportunity has unexpected chain: ${opportunity.chainId}`,
    );
  }
  if (opportunity.status !== 'LIVE') {
    throw new Error(
      `seedMEVBOTS Merkl opportunity is not live: ${opportunity.status}`,
    );
  }
  if (!campaignId) {
    throw new Error('Merkl opportunity has no active campaign');
  }
  if (!Number.isFinite(apr) || apr < 0) {
    throw new Error(`Merkl opportunity has invalid APR: ${apr}`);
  }

  const rewards = Array.from(
    new Map(
      (opportunity.rewardsRecord?.breakdowns ?? [])
        .filter((reward) => /^0x[0-9a-fA-F]{40}$/.test(reward.token.address))
        .map((reward) => [
          reward.token.address.toLowerCase(),
          {
            address: reward.token.address as `0x${string}`,
            symbol: reward.token.symbol,
            name: reward.token.name ?? reward.token.symbol,
          },
        ]),
    ).values(),
  );

  const endTimestamp = Number(opportunity.latestCampaignEnd);
  const endDate = Number.isFinite(endTimestamp)
    ? new Date(endTimestamp * 1000).toISOString()
    : undefined;

  return {
    [String(opportunity.chainId)]: {
      [seedMEVBOTSAddress]: {
        apr,
        campaignId,
        rewards,
        name: opportunity.name,
        endDate,
      },
    },
  };
}
