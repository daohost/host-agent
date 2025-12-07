import { Module } from '@nestjs/common';
import { DefiLlamaService } from './defilama.service';
import { DexscreenerService } from './dexscreener.service';

@Module({
  providers: [DefiLlamaService, DexscreenerService],
  imports: [],
  exports: [DefiLlamaService, DexscreenerService],
})
export class ChainDataProviderModule {}
