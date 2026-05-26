import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FlightsService } from './flights.service';
import { ArtifactsAccessGuard } from './artifacts.guard';
import { IFlight } from '@daohost/host';

@Controller('flights')
export class FlightsController {
  constructor(private readonly flightsService: FlightsService) {}

  @Post()
  @UseGuards(ArtifactsAccessGuard)
  @HttpCode(200)
  upsert(@Body() flight: IFlight) {
    return this.flightsService.upsert(flight);
  }

  @Get('successful')
  findSuccessful(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.paginate(this.flightsService.findSuccessful(), page, limit);
  }

  @Get('active')
  findActive(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.paginate(this.flightsService.findActive(), page, limit);
  }

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.paginate(this.flightsService.findAll(), page, limit);
  }

  private paginate(all: IFlight[], page?: string, limit?: string) {
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
    const flight = this.flightsService.findById(id);
    if (!flight) {
      throw new NotFoundException(`Flight ${id} not found`);
    }
    return flight;
  }

  @Delete(':id')
  @UseGuards(ArtifactsAccessGuard)
  @HttpCode(204)
  remove(@Param('id') id: string) {
    const deleted = this.flightsService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Flight ${id} not found`);
    }
  }
}
