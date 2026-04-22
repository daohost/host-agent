import { Module } from '@nestjs/common';
import { ArtifactsController } from './artifacts.controller';
import { ArtifactsService } from './artifacts.service';
import { ArtifactsAccessGuard } from './artifacts.guard';
import { FlightsController } from './flights.controller';
import { FlightsService } from './flights.service';
import { FlightsGateway } from './flights.gateway';
import { BotsController } from './bots.controller';
import { BotsService } from './bots.service';

@Module({
  controllers: [ArtifactsController, FlightsController, BotsController],
  providers: [
    ArtifactsService,
    FlightsService,
    ArtifactsAccessGuard,
    FlightsGateway,
    BotsService,
  ],
  exports: [ArtifactsService, FlightsService, BotsService],
})
export class ArtifactsModule {}
