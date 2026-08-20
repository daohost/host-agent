import { daos, IDAOData } from '@daohost/host';
import { IDAOAPIDataV2 } from '@daohost/host/out/api';
import { ContractIndices } from '@daohost/host/out/host.types';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MerklApi } from '@merkl/api';
import {
  mapSeedTokenOpportunity,
  MerklOpportunity,
  SeedTokenDeployment,
} from './merkl.mapper';

const MERKL_API_URL = 'https://api.merkl.xyz';

type MerklData = NonNullable<IDAOAPIDataV2['merkl']>;

export function getSeedTokenDeployments(
  daoRegistry: IDAOData[] = daos,
): SeedTokenDeployment[] {
  return daoRegistry.flatMap((dao) =>
    Object.entries(dao.deployments).flatMap(([chainId, deployments]) => {
      const address = deployments?.[ContractIndices.SEED_TOKEN_1];

      return address ? [{ daoSymbol: dao.symbol, chainId, address }] : [];
    }),
  );
}

@Injectable()
export class MerklService implements OnModuleInit {
  private readonly logger = new Logger(MerklService.name);
  private readonly api = MerklApi(MERKL_API_URL).v4;
  private merklByDao: Record<string, MerklData> = {};

  async onModuleInit() {
    await this.updateMerklData();
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateMerklData() {
    await Promise.all(
      getSeedTokenDeployments().map((deployment) =>
        this.updateSeedToken(deployment),
      ),
    );
  }

  private async updateSeedToken(deployment: SeedTokenDeployment) {
    try {
      const response = await this.api.opportunities.get({
        query: {
          identifier: deployment.address,
          chainId: deployment.chainId,
          action: 'HOLD',
          status: 'LIVE',
          campaigns: true,
        },
      });

      if (response.error || !response.data) {
        throw new Error(`Merkl API returned status ${response.status}`);
      }

      const opportunity = response.data.find(
        (item) =>
          item !== null &&
          item.identifier.toLowerCase() === deployment.address.toLowerCase() &&
          String(item.chainId) === deployment.chainId &&
          item.action === 'HOLD' &&
          item.status === 'LIVE',
      );

      if (!opportunity) {
        throw new Error('Merkl API returned no matching live HOLD opportunity');
      }

      const mapped = mapSeedTokenOpportunity(
        opportunity as MerklOpportunity,
        deployment,
      );
      const currentDaoData = this.merklByDao[deployment.daoSymbol] ?? {};

      this.merklByDao[deployment.daoSymbol] = {
        ...currentDaoData,
        [deployment.chainId]: {
          ...currentDaoData[deployment.chainId],
          ...mapped[deployment.chainId],
        },
      };
    } catch (error) {
      this.logger.warn(
        `Failed to update ${deployment.daoSymbol} seed-token APR on chain ${deployment.chainId}: ${this.getErrorMessage(error)}`,
      );
    }
  }

  getDaoMerklData(daoSymbol: string): MerklData | undefined {
    return this.merklByDao[daoSymbol];
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
