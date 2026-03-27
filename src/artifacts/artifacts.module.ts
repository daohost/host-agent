import { Module } from '@nestjs/common';
import { ArtifactsController } from './artifacts.controller';
import { ArtifactsService } from './artifacts.service';
import { ArtifactsAccessGuard } from './artifacts.guard';

@Module({
  controllers: [ArtifactsController],
  providers: [ArtifactsService, ArtifactsAccessGuard],
  exports: [ArtifactsService],
})
export class ArtifactsModule {}
