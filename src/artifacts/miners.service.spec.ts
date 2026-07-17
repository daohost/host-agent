import { MinersService } from './miners.service';

describe('MinersService', () => {
  const JARED = '0xae2fc483527b8ef99eb5d9b44875f005ba1fae13';
  const OTHER = '0x0000000000000000000000000000000000000001';

  function createService() {
    const artifactsService = {
      findAll: jest.fn(() => [
        {
          value: {
            miner: JARED.toUpperCase(),
            profit: 2,
          },
        },
        {
          value: {
            miner: JARED,
            profit: 1,
          },
        },
        {
          value: {
            miner: OTHER,
            profit: 10,
          },
        },
        { value: undefined },
      ]),
    };
    return new MinersService(artifactsService as never);
  }

  it('builds a miner leaderboard sorted by mined MEV by default', () => {
    expect(createService().findAll()).toEqual([
      {
        addr: JARED,
        name: 'JaredFromSubway',
        mevMined: 2,
        profit: 3,
      },
      {
        addr: OTHER,
        name: '',
        mevMined: 1,
        profit: 10,
      },
    ]);
  });

  it('supports profit sorting in both directions', () => {
    const service = createService();

    expect(service.findAll('profit', 'desc').map(({ addr }) => addr)).toEqual([
      OTHER,
      JARED,
    ]);
    expect(service.findAll('profit', 'asc').map(({ addr }) => addr)).toEqual([
      JARED,
      OTHER,
    ]);
  });

  it('filters the leaderboard by 24h, week, month, or all', () => {
    const now = 1_800_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const daysAgo = (days: number) => now - days * 24 * 60 * 60 * 1000;
    const artifactsService = {
      findAll: jest.fn(() => [
        {
          block: { timestamp: daysAgo(0.5) / 1000 },
          value: { miner: JARED, profit: 1 },
        },
        {
          created: daysAgo(2),
          value: { miner: JARED, profit: 2 },
        },
        {
          block: { timestamp: daysAgo(15) / 1000 },
          value: { miner: JARED, profit: 3 },
        },
        {
          block: { timestamp: daysAgo(40) / 1000 },
          value: { miner: JARED, profit: 4 },
        },
      ]),
    };
    const service = new MinersService(artifactsService as never);

    expect(service.findAll('mevMined', 'desc', '24h')[0]).toMatchObject({
      mevMined: 1,
      profit: 1,
    });
    expect(service.findAll('mevMined', 'desc', 'week')[0]).toMatchObject({
      mevMined: 2,
      profit: 3,
    });
    expect(service.findAll('mevMined', 'desc', 'month')[0]).toMatchObject({
      mevMined: 3,
      profit: 6,
    });
    expect(service.findAll('mevMined', 'desc', 'all')[0]).toMatchObject({
      mevMined: 4,
      profit: 10,
    });

    jest.restoreAllMocks();
  });
});
