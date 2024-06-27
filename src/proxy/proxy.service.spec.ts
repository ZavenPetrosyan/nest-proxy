// src/proxy/proxy.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ProxyService } from './proxy.service';
import axios from 'axios';
import * as cheerio from 'cheerio';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ProxyService', () => {
  let service: ProxyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProxyService],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch and modify content', async () => {
    const html = '<html><body><a href="/test">Sample</a></body></html>';
    mockedAxios.get.mockResolvedValue({ data: html });

    const result = await service.fetchAndModifyContent(
      'https://docs.nestjs.com',
    );

    expect(result).toContain('Sample');
    expect(result).toContain('/proxy?url=/test');
  });
});
