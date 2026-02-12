import { RpcService } from '../rpc/rpc.service';
import { SubgraphService } from '../subgraph/subgraph.service';
import { OnChainData } from './types/dao';
import { IDAOData } from '@stabilitydao/host/out/host';
import { RevenueChart } from '@stabilitydao/host/out/api';
import { AnalyticsService } from 'src/analytics/analytics.service';
import { RevenueChartV2 } from './types/xStakign';

export abstract class DaoService {
  dao: IDAOData;

  subgraphProvider: SubgraphService;
  rpcProvider: RpcService;
  analyticsService: AnalyticsService;
  constructor(
    dao: IDAOData,
    subgraphProvider: SubgraphService,
    rpcProvider: RpcService,
    analyticsService: AnalyticsService,
  ) {
    this.dao = dao;
    this.subgraphProvider = subgraphProvider;
    this.rpcProvider = rpcProvider;
    this.analyticsService = analyticsService;
  }

  abstract getRevenueChart(): Promise<RevenueChart>;
  // TODO: Remove
  abstract getRevenueChartV2(): Promise<RevenueChartV2>;
  abstract getOnchainData(): Promise<OnChainData>;
}
