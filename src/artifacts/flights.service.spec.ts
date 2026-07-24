import { IFlight } from '@daohost/host';
import { ConfigService } from '@nestjs/config';
import { ArtifactsService } from './artifacts.service';
import { FlightsService } from './flights.service';
import { FlightsGateway } from './flights.gateway';

const flight = (id: string, time: number, complete?: number): IFlight =>
  ({
    id,
    time,
    created: time,
    complete,
  }) as IFlight;

describe('FlightsService cleanup', () => {
  let service: FlightsService;
  let artifactsService: { findByIds: jest.Mock };

  beforeEach(() => {
    artifactsService = { findByIds: jest.fn(() => []) };
    service = new FlightsService(
      {
        broadcastFlightDeleted: jest.fn(),
        broadcastFlightUpdated: jest.fn(),
      } as unknown as FlightsGateway,
      {
        get: jest.fn((key: string) =>
          key === 'storagePath' ? process.cwd() : false,
        ),
      } as unknown as ConfigService,
      artifactsService as unknown as ArtifactsService,
    );
  });

  it('deletes flights inactive for more than six hours but keeps the current flight', async () => {
    const now = Date.now();
    const current = flight('current', now - 7 * 60 * 60 * 1000);
    const staleCompleted = flight(
      'stale-completed',
      now - 7 * 60 * 60 * 1000,
      now - 7 * 60 * 60 * 1000,
    );
    const staleAbandoned = flight('stale-abandoned', now - 8 * 60 * 60 * 1000);
    const recentCompleted = flight(
      'recent-completed',
      now - 5 * 60 * 60 * 1000,
      now - 5 * 60 * 60 * 1000,
    );
    const flights = [current, staleCompleted, staleAbandoned, recentCompleted];

    jest.spyOn(service, 'findAll').mockResolvedValue(flights);
    jest
      .spyOn(service, 'findById')
      .mockImplementation(
        async (id) => flights.find((f) => f.id === id) ?? null,
      );
    const deleteSpy = jest.spyOn(service, 'delete').mockResolvedValue(true);

    await service.deleteInactiveFlights();

    expect(deleteSpy).toHaveBeenCalledTimes(2);
    expect(deleteSpy).toHaveBeenCalledWith('stale-completed');
    expect(deleteSpy).toHaveBeenCalledWith('stale-abandoned');
    expect(deleteSpy).not.toHaveBeenCalledWith('current');
    expect(deleteSpy).not.toHaveBeenCalledWith('recent-completed');
  });

  it('does not delete a flight that became active during cleanup', async () => {
    const now = Date.now();
    const stale = flight('stale', now - 7 * 60 * 60 * 1000, now);

    jest.spyOn(service, 'findAll').mockResolvedValue([stale]);
    jest.spyOn(service, 'findById').mockResolvedValue(flight('stale', now));
    const deleteSpy = jest.spyOn(service, 'delete').mockResolvedValue(true);

    await service.deleteInactiveFlights();

    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('does not delete a flight that produced an artifact in the last six hours', async () => {
    const now = Date.now();
    const stale = {
      ...flight('stale', now - 7 * 60 * 60 * 1000, now),
      made: ['recent-artifact'],
    };

    artifactsService.findByIds.mockReturnValue([
      { id: 'recent-artifact', created: now - 5 * 60 * 60 * 1000 },
    ]);
    jest.spyOn(service, 'findAll').mockResolvedValue([stale]);
    jest.spyOn(service, 'findById').mockResolvedValue(stale);
    const deleteSpy = jest.spyOn(service, 'delete').mockResolvedValue(true);

    await service.deleteInactiveFlights();

    expect(artifactsService.findByIds).toHaveBeenCalledWith([
      'recent-artifact',
    ]);
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});
