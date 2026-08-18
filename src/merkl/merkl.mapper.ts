import { IDAOAPIDataV2 } from '@daohost/host/out/api';
import { ContractIndices } from '@daohost/host/out/host.types';

type MerklData = NonNullable<IDAOAPIDataV2['merkl']>;

export interface MerklOpportunity {
  chainId: number;
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
): MerklData {
  const campaignId = opportunity.rewardsRecord?.breakdowns[0]?.campaignId;
  const apr = opportunity.totalApr ?? opportunity.apr;

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
      [String(ContractIndices.SEED_TOKEN_1)]: {
        apr,
        campaignId,
        rewards,
        name: opportunity.name,
        endDate,
      },
    },
  };
}
