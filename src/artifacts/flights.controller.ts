import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FlightsService } from './flights.service';
import { ArtifactsAccessGuard } from './artifacts.guard';
import { IFlight } from '@daohost/host/out/daos/mevbots';

@Controller('flights')
@UseGuards(ArtifactsAccessGuard)
export class FlightsController {
  constructor(private readonly flightsService: FlightsService) {}

  @Post()
  @HttpCode(200)
  upsert(@Body() flight: IFlight) {
    return this.flightsService.upsert(flight);
  }

  @Get()
  findAll() {
    return this.flightsService.findAll();
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
  @HttpCode(204)
  remove(@Param('id') id: string) {
    const deleted = this.flightsService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Flight ${id} not found`);
    }
  }
}
