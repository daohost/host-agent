import { daos } from '@daohost/host';

export function getFullDaos() {
  return daos.map((dao) => ({
    ...dao,
    daoMetaData: dao.metaData,
  }));
}
