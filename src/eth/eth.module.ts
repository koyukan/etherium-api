import { Module } from '@nestjs/common';
import { EthController } from './eth.controller';
import { EthService } from './eth.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  controllers: [EthController],
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    CacheModule.register({
      store: 'memory',
      ttl: 60 * 1000, // milliseconds
      max: 5, // maximum number of items in cache
    }),
  ],
  providers: [EthService],
})
export class EthModule {}
