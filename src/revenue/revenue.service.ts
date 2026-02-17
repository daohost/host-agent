import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { daos } from '@daohost/host/out';
import { RevenueChart } from '@stabilitydao/stability/out/api.types';
import { DaoFactory } from '../dao/dao-factory';
import { RevenueChartV2 } from 'src/dao/types/xStakign';

@Injectable()
export class RevenueService implements OnModuleInit {
  public revenueCharts: { [daoSymbol: string]: RevenueChart } = {};
  public revenueChartsV2: { [daoSymbol: string]: RevenueChartV2 } = {};
  private logger = new Logger(RevenueService.name);
  constructor(private readonly daoFactory: DaoFactory) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleUpdateRevenueChart() {
    await this.updateRevenueChart();
  }

  async onModuleInit() {
    await this.updateRevenueChart();
  }

  getRevenueChart(daoSymbol: string) {
    return this.revenueCharts[daoSymbol];
  }

  getRevenueChartV2(daoSymbol: string) {
    return this.revenueChartsV2[daoSymbol];
  }

  private async updateRevenueChart() {
    for (const dao of daos) {
      try {
        const daoService = this.daoFactory.create(dao);
        if (!daoService) {
          this.revenueCharts[dao.symbol] = {};
          continue;
        }

        const revenueChart = await daoService.getRevenueChart();
        const revenueChartV2 = await daoService.getRevenueChartV2();

        this.revenueChartsV2[dao.symbol] = revenueChartV2;
        this.revenueCharts[dao.symbol] = revenueChart;
      } catch (e) {
        this.logger.warn(e.message);
        if (!e.message) {
          this.logger.error(e);
        }
      } finally {
        continue;
      }
    }
  }
}
