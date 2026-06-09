import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  ConflictException,
} from '@nestjs/common';
import { ArtifactsService } from './artifacts.service';
import { FlightsService } from './flights.service';
import { ArtifactsAccessGuard } from './artifacts.guard';
import { IMevArtifact } from '@daohost/host';

@Controller('artifacts')
export class ArtifactsController {
  constructor(
    private readonly artifactsService: ArtifactsService,
    private readonly flightsService: FlightsService,
  ) {}

  @Post()
  @UseGuards(ArtifactsAccessGuard)
  @HttpCode(201)
  create(@Body() artifact: IMevArtifact) {
    try {
      return this.artifactsService.create(artifact);
    } catch (e) {
      if (e.message?.includes('already exists')) {
        throw new ConflictException(e.message);
      }
      throw e;
    }
  }

  /**
   * An artifact is only exposed via the API once its value has actually been
   * mined — i.e. it has a `value` with a `miner`. Artifacts created before the
   * value is mined are persisted but not served.
   */
  private isMined(artifact: IMevArtifact): boolean {
    return !!artifact.value?.miner;
  }

  /**
   * Optional `loseReason` filter — case-insensitive substring match against
   * the artifact's compare result (the lose reason/s). No filter when empty.
   */
  private matchesLoseReason(
    artifact: IMevArtifact,
    loseReason?: string,
  ): boolean {
    if (!loseReason) {
      return true;
    }
    return (artifact.compare?.result ?? '')
      .toLowerCase()
      .includes(loseReason.toLowerCase());
  }

  /**
   * Enrich an artifact with derived fields for the API response:
   * `flight` (owning flight id) and `loseReason` (mirror of compare.result).
   */
  private enrich(
    artifact: IMevArtifact,
    flight?: string,
  ): IMevArtifact & { flight?: string; loseReason?: string } {
    return {
      ...artifact,
      flight,
      loseReason: artifact.compare?.result,
    };
  }

  /** Paginate a list; returns the full list when neither page nor limit set. */
  private paginate<T>(all: T[], page?: string, limit?: string) {
    if (!page && !limit) {
      return { data: all, total: all.length };
    }

    const p = Math.max(1, parseInt(page ?? '1'));
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '20')));
    const start = (p - 1) * l;

    return {
      data: all.slice(start, start + l),
      total: all.length,
      page: p,
      limit: l,
    };
  }

  /** Build an artifactId → flightId index from the flights' `made` lists. */
  private async buildFlightIndex(): Promise<Map<string, string>> {
    const flights = await this.flightsService.findAll();
    const index = new Map<string, string>();
    for (const flight of flights) {
      for (const artifactId of flight.made ?? []) {
        index.set(artifactId, flight.id);
      }
    }
    return index;
  }

  @Get('by-flight/:flightId')
  async findByFlight(
    @Param('flightId') flightId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('loseReason') loseReason?: string,
  ) {
    const flight = await this.flightsService.findById(flightId);
    if (!flight) {
      throw new NotFoundException(`Flight ${flightId} not found`);
    }
    const all = this.artifactsService
      .findByIds(flight.made ?? [])
      .filter((a) => this.isMined(a) && this.matchesLoseReason(a, loseReason))
      .map((a) => this.enrich(a, flight.id));

    return this.paginate(all, page, limit);
  }

  /**
   * Filter metadata for the UI: the distinct lose reasons present across
   * servable artifacts, plus the available flight names (ids).
   */
  @Get('filters')
  async findFilters() {
    const loseReasons = [
      ...new Set(
        this.artifactsService
          .findAll()
          .filter((a) => this.isMined(a))
          .map((a) => a.compare?.result)
          .filter((r): r is string => !!r),
      ),
    ].sort();

    const flights = (await this.flightsService.findAll())
      .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))
      .map((f) => f.id);

    return { loseReasons, flights };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('loseReason') loseReason?: string,
  ) {
    const flightIndex = await this.buildFlightIndex();
    const all = this.artifactsService
      .findAll()
      .filter((a) => this.isMined(a) && this.matchesLoseReason(a, loseReason))
      .map((a) => this.enrich(a, flightIndex.get(a.id)));

    return this.paginate(all, page, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const artifact = this.artifactsService.findById(id);
    if (!artifact || !this.isMined(artifact)) {
      throw new NotFoundException(`Artifact ${id} not found`);
    }
    const flights = await this.flightsService.findAll();
    const flight = flights.find((f) => (f.made ?? []).includes(id))?.id;
    return this.enrich(artifact, flight);
  }

  @Put(':id')
  @UseGuards(ArtifactsAccessGuard)
  update(@Param('id') id: string, @Body() updates: Partial<IMevArtifact>) {
    try {
      return this.artifactsService.update(id, updates);
    } catch (e) {
      if (e.message?.includes('not found')) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }

  @Delete(':id')
  @UseGuards(ArtifactsAccessGuard)
  @HttpCode(204)
  remove(@Param('id') id: string) {
    const deleted = this.artifactsService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Artifact ${id} not found`);
    }
  }
}
