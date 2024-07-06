import { Test, TestingModule } from '@nestjs/testing';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';

describe('ProxyController', () => {
  let controller: ProxyController;
  let service: ProxyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProxyController],
      providers: [
        {
          provide: ProxyService,
          useValue: {
            fetchStaticFile: jest.fn(),
            fetchAndModify: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProxyController>(ProxyController);
    service = module.get<ProxyService>(ProxyService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProxy', () => {
    it('should return a static file', async () => {
      const url = 'https://example.com/test.js';
      const res = {
        setHeader: jest.fn(),
        send: jest.fn(),
        sendFile: jest.fn(),
      } as any as Response;

      (service.fetchStaticFile as jest.Mock).mockResolvedValue({
        headers: { 'content-type': 'application/javascript' },
        data: 'file content',
      });

      await controller.getProxy(url, res);

      expect(service.fetchStaticFile).toHaveBeenCalledWith(url);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/javascript',
      );
      expect(res.send).toHaveBeenCalledWith('file content');
    });

    it('should return modified content', async () => {
      const url = 'https://docs.nestjs.com';
      const res = {
        sendFile: jest.fn(),
      } as any as Response;

      (service.fetchAndModify as jest.Mock).mockResolvedValue(
        'modified content',
      );

      const filePath = path.join(__dirname, '..', 'public', 'modified.html');

      await controller.getProxy(url, res);

      expect(service.fetchAndModify).toHaveBeenCalledWith(url);
      expect(res.sendFile).toHaveBeenCalledWith(filePath);
    });

    it('should handle errors', async () => {
      const url = 'https://invalid.url';
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any as Response;

      (service.fetchAndModify as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch or modify content'),
      );

      await controller.getProxy(url, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith(
        'Failed to fetch or modify content',
      );
    });
  });

  describe('isStaticFile', () => {
    it('should return true for static files', () => {
      expect(controller['isStaticFile']('https://example.com/test.js')).toBe(
        true,
      );
      expect(controller['isStaticFile']('https://example.com/test.css')).toBe(
        true,
      );
      expect(controller['isStaticFile']('https://example.com/test.png')).toBe(
        true,
      );
      expect(controller['isStaticFile']('https://example.com/test.woff')).toBe(
        true,
      );
      expect(controller['isStaticFile']('https://example.com/test.woff2')).toBe(
        true,
      );
    });

    it('should return false for non-static files', () => {
      expect(controller['isStaticFile']('https://example.com/test.html')).toBe(
        false,
      );
    });
  });
});
