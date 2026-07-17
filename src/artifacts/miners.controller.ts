import { Controller, Get, Query } from '@nestjs/common';
import {
  MinerPeriod,
  MinerSortField,
  MinerSortOrder,
  MinersService,
} from './miners.service';

@Controller('miners')
export class MinersController {
  constructor(private readonly minersService: MinersService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Query('period') period?: string,
  ) {
    const sortField: MinerSortField = sort === 'profit' ? 'profit' : 'mevMined';
    const sortOrder: MinerSortOrder = order === 'asc' ? 'asc' : 'desc';
    const periodFilter: MinerPeriod =
      period === '24h' || period === 'week' || period === 'month'
        ? period
        : 'all';
    const all = this.minersService.findAll(sortField, sortOrder, periodFilter);
    if (!page && !limit) {
      return { data: all, total: all.length };
    }

    const parsedPage = parseInt(page ?? '1');
    const parsedLimit = parseInt(limit ?? '20');
    const p = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
    const l = Number.isFinite(parsedLimit)
      ? Math.min(100, Math.max(1, parsedLimit))
      : 20;
    const start = (p - 1) * l;

    return {
      data: all.slice(start, start + l),
      total: all.length,
      page: p,
      limit: l,
    };
  }
}
