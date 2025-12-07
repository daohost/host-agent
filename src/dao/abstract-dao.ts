import { RevenueChart } from '@stabilitydao/stability/out/api.types';
import { IDAO } from '@stabilitydao/stability/out/os';
import { RpcService } from 'src/rpc/rpc.service';
import { SubgraphService } from 'src/subgraph/subgraph.service';
import { OnChainData } from './types/dao';
import { ChainsService } from 'src/chains/chains.service';

export abstract class DaoService {
  dao: IDAO;

  chains: ChainsService;
  subgraphProvider: SubgraphService;
  rpcProvider: RpcService;
  constructor(
    dao: IDAO,
    chains: ChainsService,
    subgraphProvider: SubgraphService,
    rpcProvider: RpcService,
  ) {
    this.dao = dao;
    this.chains = chains;
    this.subgraphProvider = subgraphProvider;
    this.rpcProvider = rpcProvider;
  }

  abstract getRevenueChart(): Promise<RevenueChart>;
  abstract getOnchainData(): Promise<OnChainData>;
}
