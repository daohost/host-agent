import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

const MERKL_API_URL = 'https://api.merkl.xyz';

export interface MerklRewardsResponse {
  data: string;
  status: number;
  contentType?: string;
}

@Injectable()
export class MerklRewardsService {
  constructor(private readonly httpService: HttpService) {}

  async getUserRewards(
    address: string,
    queryString: string,
    authorization?: string,
  ): Promise<MerklRewardsResponse> {
    const query = queryString ? `?${queryString}` : '';
    const url = `${MERKL_API_URL}/v4/users/${encodeURIComponent(address)}/rewards${query}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<string>(url, {
          headers: {
            accept: 'application/json',
            ...(authorization ? { authorization } : {}),
          },
          responseType: 'text',
          transformResponse: [(data: string) => data],
          validateStatus: () => true,
        }),
      );

      return this.mapResponse(response);
    } catch {
      throw new BadGatewayException('Unable to reach Merkl API');
    }
  }

  private mapResponse(response: AxiosResponse<string>): MerklRewardsResponse {
    const contentType = response.headers['content-type'] as unknown;

    return {
      data: response.data,
      status: response.status,
      contentType: typeof contentType === 'string' ? contentType : undefined,
    };
  }
}
