import { AnalyticsService } from './analytics.service';
import { analyticsAssets } from './config/analytics-config';

describe('AnalyticsService', () => {
  const tvls = new Map([['146', 123]]);
  const pairs = Object.fromEntries(
    analyticsAssets.map((asset, index) => [
      asset.symbol,
      { priceUsd: String(index + 1), priceChange: index },
    ]),
  );

  function createService() {
    const dexScreenerService = {
      getPair: jest.fn((_network: string, address: string) => {
        const asset = analyticsAssets.find((item) => item.address === address);
        if (!asset) throw new Error('unknown asset');
        return Promise.resolve(pairs[asset.symbol]);
      }),
    };
    const defiLlamaService = {
      getChainTvls: jest.fn(() => Promise.resolve(tvls)),
    };
    const chainsService = {
      getViemChainById: jest.fn(),
    };

    return {
      service: new AnalyticsService(
        dexScreenerService as never,
        defiLlamaService as never,
        chainsService as never,
      ),
      dexScreenerService,
      defiLlamaService,
    };
  }

  it('publishes primary and wrapped symbols after a successful refresh', async () => {
    const { service } = createService();

    await service.onModuleInit();

    expect(service.getChainTvls()).toEqual({ '146': 123 });
    expect(service.getPricesList()).toMatchObject({
      STBL: pairs.STBL,
      xSTBL: pairs.STBL,
      BTC: pairs.BTC,
      WBTC: pairs.BTC,
      ETH: pairs.ETH,
      wETH: pairs.ETH,
      weETH: pairs.ETH,
    });
  });

  it('publishes successful prices when one asset request fails', async () => {
    const { service, dexScreenerService } = createService();
    dexScreenerService.getPair.mockImplementation(
      (_network: string, address: string) => {
        const asset = analyticsAssets.find((item) => item.address === address);
        if (!asset) throw new Error('unknown asset');
        if (asset.symbol === 'BTC') throw new Error('temporary failure');
        return Promise.resolve(pairs[asset.symbol]);
      },
    );

    await service.onModuleInit();

    expect(service.getPricesList().STBL).toEqual(pairs.STBL);
    expect(service.getPricesList().ETH).toEqual(pairs.ETH);
    expect(service.getPricesList().BTC).toBeUndefined();
  });

  it('retains the last good value when a later refresh fails', async () => {
    const { service, dexScreenerService } = createService();
    await service.onModuleInit();

    dexScreenerService.getPair.mockRejectedValue(new Error('provider down'));
    await service.updateAnalyticsData();

    expect(service.getPricesList().STBL).toEqual(pairs.STBL);
    expect(service.getPricesList().BTC).toEqual(pairs.BTC);
  });

  it('updates prices even when the TVL provider fails', async () => {
    const { service, defiLlamaService } = createService();
    defiLlamaService.getChainTvls.mockRejectedValue(new Error('llama down'));

    await service.onModuleInit();

    expect(service.getChainTvls()).toEqual({});
    expect(service.getPricesList().STBL).toEqual(pairs.STBL);
  });
});
