import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MerklController } from './merkl.controller';
import { MerklRewardsService } from './merkl-rewards.service';
import { MerklService } from './merkl.service';

@Module({
  imports: [HttpModule],
  controllers: [MerklController],
  providers: [MerklService, MerklRewardsService],
  exports: [MerklService],
})
export class MerklModule {}
