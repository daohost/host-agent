import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { MerklRewardsService } from './merkl-rewards.service';

@Controller('v4/users')
export class MerklController {
  constructor(private readonly merklRewardsService: MerklRewardsService) {}

  @Get(':address/rewards')
  async getUserRewards(
    @Param('address') address: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const queryStart = request.originalUrl.indexOf('?');
    const queryString =
      queryStart === -1 ? '' : request.originalUrl.slice(queryStart + 1);
    const merklResponse = await this.merklRewardsService.getUserRewards(
      address,
      queryString,
      request.get('authorization'),
    );

    if (merklResponse.contentType) {
      response.type(merklResponse.contentType);
    }

    response.status(merklResponse.status).send(merklResponse.data);
  }
}
