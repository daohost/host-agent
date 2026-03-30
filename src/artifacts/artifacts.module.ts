import { Module } from '@nestjs/common';
import { ArtifactsController } from './artifacts.controller';
import { ArtifactsService } from './artifacts.service';
import { ArtifactsAccessGuard } from './artifacts.guard';
import { FlightsController } from './flights.controller';
import { FlightsService } from './flights.service';

@Module({
  controllers: [ArtifactsController, FlightsController],
  providers: [ArtifactsService, FlightsService, ArtifactsAccessGuard],
  exports: [ArtifactsService, FlightsService],
})
export class ArtifactsModule {}
