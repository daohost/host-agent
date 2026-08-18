import { Module } from '@nestjs/common';
import { MerklService } from './merkl.service';

@Module({
  providers: [MerklService],
  exports: [MerklService],
})
export class MerklModule {}
