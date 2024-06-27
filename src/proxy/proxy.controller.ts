import { Controller, Get, Query, Res } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { Response } from 'express';

@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get()
  async proxy(@Query('url') url: string, @Res() res: Response) {
    if (!url) {
      return res.status(400).send('URL is required');
    }
    const targetUrl = `https://docs.nestjs.com${url}`;
    try {
      const modifiedContent = await this.proxyService.fetchAndModifyContent(
        targetUrl,
      );
      res.send(modifiedContent);
    } catch (error) {
      res.status(500).send('Failed to fetch or modify content');
    }
  }
}
