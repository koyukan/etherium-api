import { Module } from '@nestjs/common';
import { EthController } from './eth.controller';
import { EthService } from './eth.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [EthController],
  imports: [HttpModule, ConfigModule.forRoot()],
  providers: [EthService],
})
export class EthModule {}
