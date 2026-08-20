jest.mock('@merkl/api', () => ({ MerklApi: jest.fn() }));

import { MerklApi } from '@merkl/api';
import { MerklService } from './merkl.service';
import { opportunity } from './merkl.fixture';

const seedMEVBOTSAddress = '0x999995c72dd0c41241552c9c889a93dc78d99999';

describe('MerklService', () => {
  const get = jest.fn();
  const opportunities = jest.fn(() => ({ get }));

  beforeEach(() => {
    jest.clearAllMocks();
    (MerklApi as jest.Mock).mockReturnValue({ v4: { opportunities } });
  });

  it('loads seedMEVBOTS data during module initialization', async () => {
    get.mockResolvedValue({ data: opportunity, error: null, status: 200 });
    const service = new MerklService();

    await service.onModuleInit();

    expect(opportunities).toHaveBeenCalledWith({
      id: '9682604972499820963',
    });
    expect(
      service.getDaoMerklData('MEVBOTS')?.['1'][seedMEVBOTSAddress].apr,
    ).toBe(596.1648072800859);
    expect(service.getDaoMerklData('STBL')).toBeUndefined();
  });

  it('retains the last successful value after an API error response', async () => {
    get
      .mockResolvedValueOnce({ data: opportunity, error: null, status: 200 })
      .mockResolvedValueOnce({ data: null, error: {}, status: 503 });
    const service = new MerklService();

    await service.updateMerklData();
    const lastSuccessfulValue = service.getDaoMerklData('MEVBOTS');
    await service.updateMerklData();

    expect(service.getDaoMerklData('MEVBOTS')).toBe(lastSuccessfulValue);
  });

  it('retains the last successful value after a network failure', async () => {
    get
      .mockResolvedValueOnce({ data: opportunity, error: null, status: 200 })
      .mockRejectedValueOnce(new Error('network unavailable'));
    const service = new MerklService();

    await service.updateMerklData();
    const lastSuccessfulValue = service.getDaoMerklData('MEVBOTS');
    await service.updateMerklData();

    expect(service.getDaoMerklData('MEVBOTS')).toBe(lastSuccessfulValue);
  });
});
