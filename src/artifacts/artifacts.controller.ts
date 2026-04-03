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
import { IMevArtifact } from '@daohost/host/out/daos/mevbots';

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

  @Get('by-flight/:flightId')
  findByFlight(@Param('flightId') flightId: string) {
    const flight = this.flightsService.findById(flightId);
    if (!flight) {
      throw new NotFoundException(`Flight ${flightId} not found`);
    }
    return this.artifactsService.findByIds(flight.made ?? []);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const all = this.artifactsService.findAll();

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    const artifact = this.artifactsService.findById(id);
    if (!artifact) {
      throw new NotFoundException(`Artifact ${id} not found`);
    }
    return artifact;
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
