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
import { MinersService } from './miners.service';
import {
  countArtifactsByLoseReason,
  matchesLoseReason,
  matchesMiner,
  sortArtifactsByValue,
  validateArtifactSort,
} from './artifact-filters';

@Controller('artifacts')
export class ArtifactsController {
  constructor(
    private readonly artifactsService: ArtifactsService,
    private readonly flightsService: FlightsService,
    private readonly minersService: MinersService,
  ) {}

  @Post()
  @UseGuards(ArtifactsAccessGuard)
  @HttpCode(201)
  create(@Body() artifact: IMevArtifact) {
    try {
      return this.artifactsService.create(artifact);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw new ConflictException(error.message);
      }
      throw error;
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
  private paginate<T>(
    all: T[],
    page?: string,
    limit?: string,
    totalsByLoseReason?: Record<string, number>,
  ) {
    if (!page && !limit) {
      return { data: all, total: all.length, totalsByLoseReason };
    }

    const p = Math.max(1, parseInt(page ?? '1'));
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '20')));
    const start = (p - 1) * l;

    return {
      data: all.slice(start, start + l),
      total: all.length,
      totalsByLoseReason,
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
    @Query('miner') miner?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
  ) {
    const validatedSort = validateArtifactSort(sort, order);
    const flight = await this.flightsService.findById(flightId);
    if (!flight) {
      throw new NotFoundException(`Flight ${flightId} not found`);
    }
    const mined = this.artifactsService
      .findByIds(flight.made ?? [])
      .filter((a) => this.isMined(a) && matchesMiner(a, miner));
    const totalsByLoseReason = countArtifactsByLoseReason(mined);
    const all = sortArtifactsByValue(
      mined
        .filter((a) => matchesLoseReason(a, loseReason))
        .map((a) => this.enrich(a, flight.id)),
      validatedSort.sort,
      validatedSort.order,
    );

    return this.paginate(all, page, limit, totalsByLoseReason);
  }

  /**
   * Filter metadata for the UI: the distinct lose reasons present across
   * servable artifacts, plus the available flight names (ids).
   */
  @Get('filters')
  async findFilters() {
    const mined = this.artifactsService
      .findAll()
      .filter((a) => this.isMined(a));
    const totalsByLoseReason = countArtifactsByLoseReason(mined);
    const loseReasons = Object.keys(totalsByLoseReason);
    const miners = this.minersService
      .findAllFromArtifacts(mined)
      .map(({ addr, name }) => ({ addr, name }));

    const flights = (await this.flightsService.findAll())
      .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))
      .map((f) => f.id);

    return { loseReasons, miners, flights, totalsByLoseReason };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('loseReason') loseReason?: string,
    @Query('miner') miner?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
  ) {
    const validatedSort = validateArtifactSort(sort, order);
    const flightIndex = await this.buildFlightIndex();
    const mined = this.artifactsService
      .findAll()
      .filter((a) => this.isMined(a) && matchesMiner(a, miner));
    const totalsByLoseReason = countArtifactsByLoseReason(mined);
    const all = sortArtifactsByValue(
      mined
        .filter((a) => matchesLoseReason(a, loseReason))
        .map((a) => this.enrich(a, flightIndex.get(a.id))),
      validatedSort.sort,
      validatedSort.order,
    );

    return this.paginate(all, page, limit, totalsByLoseReason);
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
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw error;
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
