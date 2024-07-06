import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ProxyService } from './proxy.service';
import { of, throwError } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';

jest.mock('fs');
jest.mock('path');

describe('ProxyService', () => {
  let service: ProxyService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchAndModify', () => {
    it('should fetch and modify content', async () => {
      const url = 'https://docs.nestjs.com';
      const mockResponse = {
        status: 200,
        headers: { 'content-type': 'text/html' },
        data: '<html><body><a href="/test">Test</a></body></html>',
      };
      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse));
      const loadMock = jest.spyOn(cheerio, 'load').mockReturnValue({
        html: jest
          .fn()
          .mockReturnValue(
            '<html><body><a href="http://localhost:3000/proxy?url=https://docs.nestjs.com/test">Test™</a></body></html>',
          ),
        each: jest.fn(),
        text: jest.fn(),
        attr: jest.fn(),
        map: jest.fn(),
      } as any);

      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
      (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

      const result = await service.fetchAndModify(url);

      expect(httpService.get).toHaveBeenCalledWith(url);
      expect(loadMock).toHaveBeenCalledWith(mockResponse.data);
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(result).toBe(
        '<html><body><a href="http://localhost:3000/proxy?url=https://docs.nestjs.com/test">Test™</a></body></html>',
      );
    });

    it('should handle errors', async () => {
      const url = 'https://invalid.url';
      (httpService.get as jest.Mock).mockReturnValue(
        throwError(() => ({
          response: {
            data: 'Not Found',
            status: 404,
            headers: { 'content-type': 'text/html' },
          },
        })),
      );

      await expect(service.fetchAndModify(url)).rejects.toThrow(
        'Failed to fetch or modify content',
      );
    });
  });

  describe('fetchStaticFile', () => {
    it('should fetch a static file', async () => {
      const url = 'https://example.com/test.js';
      const mockResponse = {
        headers: { 'content-type': 'application/javascript' },
        data: 'file content',
      };
      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse));

      const result = await service.fetchStaticFile(url);

      expect(httpService.get).toHaveBeenCalledWith(url, {
        responseType: 'arraybuffer',
      });
      expect(result).toBe(mockResponse);
    });

    it('should handle errors', async () => {
      const url = 'https://invalid.url';
      (httpService.get as jest.Mock).mockReturnValue(
        throwError(() => ({
          response: {
            data: 'Not Found',
            status: 404,
            headers: { 'content-type': 'text/html' },
          },
        })),
      );

      await expect(service.fetchStaticFile(url)).rejects.toThrow(
        'Failed to fetch static file',
      );
    });
  });
});
