import { IDAOData, LifecyclePhase } from '@stabilitydao/host/out/host';

export function isLive(dao: IDAOData): boolean {
  return [
    LifecyclePhase.LIVE_VESTING,
    LifecyclePhase.LIVE,
    LifecyclePhase.LIVE_CLIFF,
  ].includes(dao.phase);
}
