import { Module } from '@nestjs/common';
import { ArtifactsController } from './artifacts.controller';
import { ArtifactsService } from './artifacts.service';
import { ArtifactsAccessGuard } from './artifacts.guard';
import { FlightsController } from './flights.controller';
import { FlightsService } from './flights.service';
import { FlightsGateway } from './flights.gateway';
import { BotsController } from './bots.controller';
import { BotsService } from './bots.service';
import { MinersController } from './miners.controller';
import { MinersService } from './miners.service';

@Module({
  controllers: [
    ArtifactsController,
    FlightsController,
    BotsController,
    MinersController,
  ],
  providers: [
    ArtifactsService,
    FlightsService,
    ArtifactsAccessGuard,
    FlightsGateway,
    BotsService,
    MinersService,
  ],
  exports: [ArtifactsService, FlightsService, BotsService, MinersService],
})
export class ArtifactsModule {}
