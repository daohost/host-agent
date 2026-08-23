import { ArtifactsController } from './artifacts.controller';

describe('ArtifactsController filters', () => {
  const MINER_A = '0x0000000000000000000000000000000000000001';
  const MINER_B = '0x0000000000000000000000000000000000000002';

  function artifact(
    id: string,
    loseReason: string,
    miner: string,
    income = 0,
    profit = 0,
  ) {
    return {
      id,
      compare: { result: loseReason },
      value: { miner, income, profit },
    };
  }

  it('returns strict miner/reason results and reason totals in miner scope', async () => {
    const artifactsService = {
      findAll: jest.fn(() => [
        artifact('a', 'Making fail', MINER_A),
        artifact('b', 'Unknown', MINER_A),
        artifact('c', 'Making fail', MINER_B),
      ]),
    };
    const flightsService = { findAll: jest.fn(async () => []) };
    const minersService = { findAll: jest.fn(() => []) };
    const controller = new ArtifactsController(
      artifactsService as never,
      flightsService as never,
      minersService as never,
    );

    const response = await controller.findAll(
      undefined,
      undefined,
      ' making FAIL ',
      MINER_A.toUpperCase(),
    );

    expect(response.total).toBe(1);
    expect(response.data.map(({ id }) => id)).toEqual(['a']);
    expect(response.totalsByLoseReason).toEqual({
      'Making fail': 1,
      Unknown: 1,
    });
  });

  it('sorts before pagination', async () => {
    const artifactsService = {
      findAll: jest.fn(() => [
        artifact('a', 'Unknown', MINER_A, 10, 3),
        artifact('b', 'Unknown', MINER_A, 30, 1),
        artifact('c', 'Unknown', MINER_A, 20, 2),
      ]),
    };
    const controller = new ArtifactsController(
      artifactsService as never,
      { findAll: jest.fn(async () => []) } as never,
      { findAll: jest.fn(() => []) } as never,
    );

    const response = await controller.findAll(
      '1',
      '2',
      undefined,
      undefined,
      'income',
      'desc',
    );

    expect(response.data.map(({ id }) => id)).toEqual(['b', 'c']);
    expect(response.total).toBe(3);
  });

  it('sorts artifacts within a flight before pagination', async () => {
    const artifactsService = {
      findByIds: jest.fn(() => [
        artifact('a', 'Unknown', MINER_A, 10, 3),
        artifact('b', 'Unknown', MINER_A, 30, 1),
        artifact('c', 'Unknown', MINER_A, 20, 2),
      ]),
    };
    const flightsService = {
      findById: jest.fn(async () => ({
        id: 'flight-1',
        made: ['a', 'b', 'c'],
      })),
    };
    const controller = new ArtifactsController(
      artifactsService as never,
      flightsService as never,
      { findAll: jest.fn(() => []) } as never,
    );

    const response = await controller.findByFlight(
      'flight-1',
      '1',
      '2',
      undefined,
      undefined,
      'profit',
      'asc',
    );

    expect(response.data.map(({ id }) => id)).toEqual(['b', 'c']);
    expect(response.total).toBe(3);
  });

  it('rejects unsupported sort fields and orders', async () => {
    const controller = new ArtifactsController(
      { findAll: jest.fn(() => []) } as never,
      { findAll: jest.fn(async () => []) } as never,
      { findAll: jest.fn(() => []) } as never,
    );

    await expect(
      controller.findAll(
        undefined,
        undefined,
        undefined,
        undefined,
        'created',
        'asc',
      ),
    ).rejects.toThrow('sort must be one of: income, profit');
    await expect(
      controller.findAll(
        undefined,
        undefined,
        undefined,
        undefined,
        'income',
        'sideways',
      ),
    ).rejects.toThrow('order must be one of: asc, desc');
  });
});
