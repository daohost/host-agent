import { IDAOAPIDataV2 } from '@daohost/host/out/api';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MerklApi } from '@merkl/api';
import { mapSeedMevBotsOpportunity } from './merkl.mapper';

const MERKL_API_URL = 'https://api.merkl.xyz';
const MEVBOTS_DAO_SYMBOL = 'MEVBOTS';
const SEED_MEVBOTS_OPPORTUNITY_ID = '9682604972499820963';

type MerklData = NonNullable<IDAOAPIDataV2['merkl']>;

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
    try {
      const response = await this.api
        .opportunities({ id: SEED_MEVBOTS_OPPORTUNITY_ID })
        .get({ query: {} });

      if (response.error || !response.data) {
        throw new Error(`Merkl API returned status ${response.status}`);
      }

      this.merklByDao[MEVBOTS_DAO_SYMBOL] = mapSeedMevBotsOpportunity(
        response.data,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to update seedMEVBOTS APR: ${this.getErrorMessage(error)}`,
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
