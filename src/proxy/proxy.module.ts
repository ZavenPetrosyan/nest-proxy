import { Module } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { ProxyController } from './proxy.controller';

@Module({
  imports: [],
  controllers: [ProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}
