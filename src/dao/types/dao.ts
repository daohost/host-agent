import { IHostAgentMemoryV3 } from '@daohost/host';
import { DaoService } from '../abstract-dao';

export type OnChainData =
  IHostAgentMemoryV3['data']['daos'][string]['onChainData'];

export type UnitData = OnChainData[string]['units'];
export type DaoList = Record<string, DaoService>;
