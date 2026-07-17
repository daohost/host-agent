import { ArtifactsController } from './artifacts.controller';

describe('ArtifactsController filters', () => {
  const MINER_A = '0x0000000000000000000000000000000000000001';
  const MINER_B = '0x0000000000000000000000000000000000000002';

  function artifact(id: string, loseReason: string, miner: string) {
    return {
      id,
      compare: { result: loseReason },
      value: { miner },
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
});
