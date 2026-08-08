import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DefiLlamaService } from '../chain-data-provider/defilama.service';
import { DexscreenerService } from '../chain-data-provider/dexscreener.service';
import { Analytics } from './types/analytics';
import { analyticsAssets } from './config/analytics-config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChainsService } from '../chains/chains.service';
import { IHostAgentMemoryV3 } from '@daohost/host';

@Injectable()
export class AnalyticsService implements OnModuleInit {
  private analytics: Analytics = {
    chainTvls: {},
    prices: {},
  };
  private logger = new Logger(AnalyticsService.name);
  constructor(
    private readonly dexScreenerService: DexscreenerService,
    private readonly defiLlamaService: DefiLlamaService,
    private readonly chainsService: ChainsService,
  ) {}

  async onModuleInit() {
    try {
      await this.updateAnalytics();
    } catch (e) {
      this.logger.warn(
        `Failed to get analytics data: ${this.getErrorMessage(e)}`,
      );
      this.analytics = {
        chainTvls: {},
        prices: {},
      };
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async updateAnalyticsData() {
    try {
      await this.updateAnalytics();
    } catch (e) {
      this.logger.warn(
        `Failed to get analytics data: ${this.getErrorMessage(e)}`,
      );
    }
  }

  getChainTvls(): IHostAgentMemoryV3['data']['chainTvl'] {
    return this.analytics.chainTvls;
  }

  getPricesList(): IHostAgentMemoryV3['data']['prices'] {
    const allSymbols = analyticsAssets.flatMap((asset) => [
      asset.symbol,
      ...asset.wrappedSymbols,
    ]);
    return Object.fromEntries(
      Object.entries(this.analytics.prices).filter(([symbol]) => {
        return allSymbols.includes(symbol);
      }),
    );
  }

  getPriceBySymbol(symbol: string): number {
    return +(this.analytics.prices[symbol]?.priceUsd ?? 0);
  }

  getxStblPrice(): number {
    return this.getPriceBySymbol('STBL');
  }

  getNativePriceForChain(chainId: string): number {
    const chain = this.chainsService.getViemChainById(chainId);
    const symbol = chain?.nativeCurrency.symbol;

    if (!symbol) {
      return 0;
    }

    const price = this.analytics.prices[symbol];
    if (!price) {
      return 0;
    }
    return +price.priceUsd;
  }

  private async updateAnalytics() {
    const [tvlsResult, ...priceResults] = await Promise.allSettled([
      this.defiLlamaService.getChainTvls(),
      ...analyticsAssets.map(async (asset) => {
        const pair = await this.dexScreenerService.getPair(
          asset.network,
          asset.address,
        );

        return [asset.symbol, ...asset.wrappedSymbols].map(
          (symbol) => [symbol, pair] as const,
        );
      }),
    ]);

    const chainTvls =
      tvlsResult.status === 'fulfilled'
        ? Object.fromEntries(tvlsResult.value)
        : this.analytics.chainTvls;

    if (tvlsResult.status === 'rejected') {
      this.logger.warn(
        `Failed to get chain TVLs: ${this.getErrorMessage(tvlsResult.reason)}`,
      );
    }

    const updatedPrices = { ...this.analytics.prices };
    priceResults.forEach((result, index) => {
      const asset = analyticsAssets[index];

      if (result.status === 'fulfilled') {
        Object.assign(updatedPrices, Object.fromEntries(result.value));
        return;
      }

      this.logger.warn(
        `Failed to get ${asset.symbol} price from Dexscreener ` +
          `(${asset.network}/${asset.address}): ${this.getErrorMessage(result.reason)}`,
      );
    });

    this.analytics = {
      chainTvls,
      prices: updatedPrices,
    };
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
