// src/proxy/proxy.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ProxyModule } from './proxy.module';

describe('ProxyController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ProxyModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/proxy (GET)', () => {
    return request(app.getHttpServer())
      .get('/proxy?url=/websockets/gateways')
      .expect(200)
  });

  afterAll(async () => {
    await app.close();
  });
});
