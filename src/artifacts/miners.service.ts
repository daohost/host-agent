import { Injectable } from '@nestjs/common';
import { mevMiners, type IMevArtifact } from '@daohost/host';
import { ArtifactsService } from './artifacts.service';

export type MinerSortField = 'mevMined' | 'profit';
export type MinerSortOrder = 'asc' | 'desc';
export type MinerPeriod = '24h' | 'week' | 'month' | 'all';

const PERIOD_MS: Record<Exclude<MinerPeriod, 'all'>, number> = {
  '24h': 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};

export interface IMinerLeaderboardRow {
  addr: string;
  name: string;
  mevMined: number;
  profit: number;
}

function finiteNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function timestampMs(value: unknown): number {
  const timestamp = finiteNumber(value);
  if (timestamp <= 0) return 0;
  return timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
}

@Injectable()
export class MinersService {
  constructor(private readonly artifactsService: ArtifactsService) {}

  findAll(
    sort: MinerSortField = 'mevMined',
    order: MinerSortOrder = 'desc',
    period: MinerPeriod = 'all',
  ): IMinerLeaderboardRow[] {
    return this.aggregate(this.artifactsService.findAll(), sort, order, period);
  }

  findAllFromArtifacts(artifacts: IMevArtifact[]): IMinerLeaderboardRow[] {
    return this.aggregate(artifacts, 'mevMined', 'desc', 'all');
  }

  private aggregate(
    artifacts: IMevArtifact[],
    sort: MinerSortField,
    order: MinerSortOrder,
    period: MinerPeriod,
  ): IMinerLeaderboardRow[] {
    const byAddress = new Map<string, IMinerLeaderboardRow>();
    const cutoff = period === 'all' ? 0 : Date.now() - PERIOD_MS[period];

    for (const artifact of artifacts) {
      const value = artifact.value;
      if (!value?.miner) continue;
      const minedAt = timestampMs(
        artifact.block?.timestamp || artifact.created,
      );
      if (cutoff > 0 && (minedAt === 0 || minedAt < cutoff)) continue;

      const addr = value.miner.toLowerCase();
      let miner = byAddress.get(addr);
      if (!miner) {
        miner = {
          addr,
          name: mevMiners[addr as `0x${string}`]?.name ?? '',
          mevMined: 0,
          profit: 0,
        };
        byAddress.set(addr, miner);
      }

      miner.mevMined++;
      miner.profit += finiteNumber(value.profit);
    }

    const direction = order === 'asc' ? 1 : -1;
    return [...byAddress.values()].sort((a, b) => {
      const primary = (a[sort] - b[sort]) * direction;
      if (primary !== 0) return primary;

      const secondaryField: MinerSortField =
        sort === 'mevMined' ? 'profit' : 'mevMined';
      const secondary = (a[secondaryField] - b[secondaryField]) * direction;
      return secondary !== 0 ? secondary : a.addr.localeCompare(b.addr);
    });
  }
}
