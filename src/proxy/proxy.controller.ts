import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ProxyService } from './proxy.service';
import * as path from 'path';

@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get()
  async getProxy(
    @Query('url') url: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (this.isStaticFile(url)) {
        const staticFileResponse = await this.proxyService.fetchStaticFile(url);
        res.setHeader(
          'Content-Type',
          staticFileResponse.headers['content-type'],
        );
        res.send(staticFileResponse.data);
      } else {
        await this.proxyService.fetchAndModify(url);
        const filePath = path.join(__dirname, '..', 'public', 'modified.html');
        res.sendFile(filePath);
      }
    } catch (error) {
      console.error('Request URL:', url);
      console.error('Error:', error.message);
      res
        .status(HttpStatus.BAD_REQUEST)
        .send('Failed to fetch or modify content');
    }
  }

  private isStaticFile(url: string): boolean {
    return (
      url.endsWith('.js') ||
      url.endsWith('.css') ||
      url.endsWith('.png') ||
      url.endsWith('.woff') ||
      url.endsWith('.woff2')
    );
  }
}
