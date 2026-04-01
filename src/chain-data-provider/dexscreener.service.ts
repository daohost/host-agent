import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { statusOk } from '../utils/statusOk';

@Injectable()
export class DexscreenerService {
  private baseUrl = 'https://api.dexscreener.com/';
  private readonly pairUrl = (network: string, address: string) =>
    `${this.baseUrl}latest/dex/pairs/${network}/${address}`;
  constructor(private readonly httpService: HttpService) {}

  async getPair(network: string, address: string) {
    const response = await firstValueFrom(
      this.httpService.get(this.pairUrl(network, address)),
    );

    if (!statusOk(response.status)) {
      throw new Error(
        `Failed to get pair from Dexscreener: ${response.data}. Status: ${response.status}`,
      );
    }

    const pair = response.data.pair ?? response.data.pairs?.[0];

    if (!pair) {
      throw new Error(
        `Pair not found on Dexscreener for ${network}/${address}`,
      );
    }

    return { priceUsd: pair.priceUsd, priceChange: pair.priceChange?.h24 };
  }
}
