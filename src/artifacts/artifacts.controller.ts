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
  UseGuards,
  ConflictException,
} from '@nestjs/common';
import { ArtifactsService } from './artifacts.service';
import { ArtifactsAccessGuard } from './artifacts.guard';
import { IMevArtifact } from '@daohost/host/out/daos/mevbots';

@Controller('artifacts')
@UseGuards(ArtifactsAccessGuard)
export class ArtifactsController {
  constructor(private readonly artifactsService: ArtifactsService) {}

  @Post()
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

  @Get()
  findAll() {
    return this.artifactsService.findAll();
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
  @HttpCode(204)
  remove(@Param('id') id: string) {
    const deleted = this.artifactsService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Artifact ${id} not found`);
    }
  }
}
