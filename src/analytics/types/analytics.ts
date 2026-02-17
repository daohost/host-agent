import { IHostAgentMemoryV3 } from '@daohost/host';

export type Analytics = {
  chainTvls: IHostAgentMemoryV3['data']['chainTvl'];
  prices: IHostAgentMemoryV3['data']['prices'];
};
