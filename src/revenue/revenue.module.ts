import { Module } from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { DaoModule } from '../dao/dao.module';

@Module({
  providers: [RevenueService],
  imports: [DaoModule],
  exports: [RevenueService],
})
export class RevenueModule {}
