import { Test, TestingModule } from '@nestjs/testing';
import { EthService } from './eth.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

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
      //Add a wrong address and and a correct address with non-zero ETH and USDT balances
      const addresses = [
        '0x00000000219ab540356cBB839Cbe05303d7705Fa',
        'WrongAddress',
      ];

      const response = await ethService.validateAndSortBalances(addresses);
      console.log('Response', response);

      expect(response.sorted_addresses[0].address).toBe(
        '0x00000000219ab540356cBB839Cbe05303d7705Fa',
      );
      expect(response.wrong_addresses.length).toBe(1);
      expect(response.wrong_addresses[0]).toBe('WrongAddress');

      expect(response.sorted_addresses[0].eth_balance).toBeGreaterThan(0);
      expect(response.sorted_addresses[0].usd_balance).toBeGreaterThan(0);
      expect(response.sorted_addresses[0].usdt_balance).toBeGreaterThan(0);
    });
  });
});
