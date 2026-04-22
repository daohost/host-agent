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
import { BotsService } from './bots.service';
import { ArtifactsAccessGuard } from './artifacts.guard';
import { IBot } from '@daohost/host';

@Controller('bots')
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Post()
  @UseGuards(ArtifactsAccessGuard)
  @HttpCode(200)
  upsert(@Body() bot: IBot) {
    return this.botsService.upsert(bot);
  }

  @Get()
  findAll() {
    return this.botsService.findAll();
  }

  @Get(':software')
  findOne(@Param('software') software: string) {
    const bot = this.botsService.findBySoftware(software);
    if (!bot) {
      throw new NotFoundException(`Bot ${software} not found`);
    }
    return bot;
  }

  @Delete(':software')
  @UseGuards(ArtifactsAccessGuard)
  @HttpCode(204)
  remove(@Param('software') software: string) {
    const deleted = this.botsService.delete(software);
    if (!deleted) {
      throw new NotFoundException(`Bot ${software} not found`);
    }
  }
}
