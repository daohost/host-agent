import { RpcService } from '../rpc/rpc.service';
import { SubgraphService } from '../subgraph/subgraph.service';
import { OnChainData } from './types/dao';
import { IDAOData } from '@stabilitydao/host/out/host';
import { RevenueChart } from '@stabilitydao/host/out/api';

export abstract class DaoService {
  dao: IDAOData;

  subgraphProvider: SubgraphService;
  rpcProvider: RpcService;
  constructor(
    dao: IDAOData,
    subgraphProvider: SubgraphService,
    rpcProvider: RpcService,
  ) {
    this.dao = dao;
    this.subgraphProvider = subgraphProvider;
    this.rpcProvider = rpcProvider;
  }

  abstract getRevenueChart(): Promise<RevenueChart>;
  abstract getOnchainData(): Promise<OnChainData>;
}
