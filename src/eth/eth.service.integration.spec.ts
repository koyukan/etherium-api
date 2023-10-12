import { Test, TestingModule } from '@nestjs/testing';
import { EthService } from './eth.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';

describe('EthService', () => {
  let ethService: EthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule.forRoot(),
        CacheModule.register({
          store: 'memory',
          ttl: 60 * 1000, // time to live in milliseconds
          max: 5, // maximum number of items in cache
        }),
      ],
      providers: [EthService],
    }).compile();

    ethService = module.get<EthService>(EthService);
  });

  describe('validateAndSortBalances', () => {
    it('should validate and sort ETH balances', async () => {
      const addresses = [
        '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        'WrongAddress',
      ]; // Replace with actual Ethereum addresses

      const response = await ethService.validateAndSortBalances(addresses);
      console.log('Reso', response);

      expect(response.sorted_addresses[0].address).toBe(
        '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      );
      expect(response.wrong_addresses.length).toBe(1);
      expect(response.wrong_addresses[0]).toBe('WrongAddress');

      expect(response.sorted_addresses[0].eth_balance).toBeGreaterThan(0);
      expect(response.sorted_addresses[0].usd_balance).toBeGreaterThan(0);
    });
  });
});
