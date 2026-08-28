import { HttpService } from '@nestjs/axios';
import { BadGatewayException } from '@nestjs/common';
import { AxiosHeaders, AxiosRequestConfig } from 'axios';
import { of, throwError } from 'rxjs';
import { MerklRewardsService } from './merkl-rewards.service';

describe('MerklRewardsService', () => {
  const get = jest.fn();
  const service = new MerklRewardsService({ get } as unknown as HttpService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards the address, original query string, and authorization', async () => {
    const data = '[{"rewards":{"amount":"900719925474099312345"}}]';
    get.mockReturnValue(
      of({
        data,
        status: 200,
        headers: AxiosHeaders.from({ 'content-type': 'application/json' }),
      }),
    );

    await expect(
      service.getUserRewards(
        '0xabc/def',
        'chainId=1&chainId=10&claimableOnly=true',
        'Bearer secret',
      ),
    ).resolves.toEqual({
      data,
      status: 200,
      contentType: 'application/json',
    });

    expect(get).toHaveBeenCalledWith(
      'https://api.merkl.xyz/v4/users/0xabc%2Fdef/rewards?chainId=1&chainId=10&claimableOnly=true',
      expect.objectContaining({
        headers: {
          accept: 'application/json',
          authorization: 'Bearer secret',
        },
        responseType: 'text',
      }),
    );
    const call = get.mock.calls[0] as unknown as [string, AxiosRequestConfig];
    expect(call[1].validateStatus?.(503)).toBe(true);
  });

  it('preserves an upstream error response', async () => {
    get.mockReturnValue(
      of({
        data: '{"type":"validation"}',
        status: 422,
        headers: AxiosHeaders.from({
          'content-type': 'application/json; charset=utf-8',
        }),
      }),
    );

    await expect(service.getUserRewards('0xabc', 'chainId=1')).resolves.toEqual(
      {
        data: '{"type":"validation"}',
        status: 422,
        contentType: 'application/json; charset=utf-8',
      },
    );
  });

  it('returns a bad gateway error when Merkl cannot be reached', async () => {
    get.mockReturnValue(throwError(() => new Error('network unavailable')));

    await expect(
      service.getUserRewards('0xabc', 'chainId=1'),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
