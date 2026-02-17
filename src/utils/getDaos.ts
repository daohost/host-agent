import { metaData, daos } from '@daohost/host';

export function getFullDaos() {
  return daos.map((dao) => ({
    ...dao,
    daoMetaData: metaData[dao.symbol.toLowerCase()],
  }));
}
