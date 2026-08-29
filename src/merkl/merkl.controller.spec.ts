import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'http';
import * as request from 'supertest';
import { MerklRewardsService } from './merkl-rewards.service';
import { MerklController } from './merkl.controller';

describe('MerklController', () => {
  let app: INestApplication;
  const getUserRewards = jest.fn();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [MerklController],
      providers: [
        {
          provide: MerklRewardsService,
          useValue: { getUserRewards },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableCors({
      origin: true,
      credentials: true,
      methods: '*',
      allowedHeaders: '*',
    });
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('mirrors rewards through the public host API route with CORS', async () => {
    const body = [
      {
        chain: { id: 1 },
        rewards: [{ amount: '900719925474099312345' }],
      },
    ];
    getUserRewards.mockResolvedValue({
      data: JSON.stringify(body),
      status: 200,
      contentType: 'application/json',
    });

    const response = await request(app.getHttpServer() as Server)
      .get(
        '/api/v4/users/0xabc/rewards?chainId=1&chainId=10&claimableOnly=true',
      )
      .set('Origin', 'https://dao.host')
      .set('Authorization', 'Bearer secret')
      .expect(200);

    expect(response.body).toEqual(body);
    expect(response.headers['access-control-allow-origin']).toBe(
      'https://dao.host',
    );
    expect(response.headers['access-control-allow-credentials']).toBe('true');
    expect(getUserRewards).toHaveBeenCalledWith(
      '0xabc',
      'chainId=1&chainId=10&claimableOnly=true',
      'Bearer secret',
    );
  });

  it('preserves Merkl error statuses and response bodies', async () => {
    getUserRewards.mockResolvedValue({
      data: '{"type":"validation","on":"query"}',
      status: 422,
      contentType: 'application/json',
    });

    const response = await request(app.getHttpServer() as Server)
      .get('/api/v4/users/0xabc/rewards')
      .expect(422);

    expect(response.body).toEqual({ type: 'validation', on: 'query' });
  });
});
