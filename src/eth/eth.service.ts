import { ForbiddenException, Injectable, Inject } from '@nestjs/common';
import HttpProvider from 'web3-providers-http';
import Eth from 'web3-eth';
import { encodeFunctionCall } from 'web3-eth-abi';
import { fromWei, hexToNumberString, Web3DeferredPromise } from 'web3-utils';
import { isAddress } from 'web3-validator';
import { HttpService } from '@nestjs/axios';
import { map, catchError, lastValueFrom } from 'rxjs';
import { JsonRpcOptionalRequest } from 'web3-types';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class EthService {
  private eth: Eth;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    // Initialize Eth instance; here it's connected to the Ethereum mainnet via Infura
    const provider = new HttpProvider(configService.get<string>('INFURA_URL'));
    this.eth = new Eth(provider);
  }

  // Fetches the current ETH/USD price from CoinGecko and caches it for 5 minutes
  private async fetchEthToUsdPrice(): Promise<number> {
    const cacheKey = 'ethToUsdPrice';
    const cachedPrice: number = await this.cacheManager.get(cacheKey);

    if (cachedPrice) {
      return cachedPrice;
    }

    console.log('Fetching ETH/USD price');
    const url = this.configService.get<string>('COINGECKO_URL');
    const request = this.httpService.get(url).pipe(
      map((response) => response.data.ethereum.usd),
      catchError(() => {
        throw new ForbiddenException(
          'Conversion API not available: Possibly exceeded rate limit',
        );
      }),
    );

    const price = await lastValueFrom(request);
    await this.cacheManager.set(cacheKey, price);

    return price;
  }
  // Validate the addresses and fetch the balances
  async validateAndSortBalances(addresses: string[]): Promise<{
    wrong_addresses: string[];
    sorted_addresses: {
      address: string;
      eth_balance: number;
      usd_balance: number;
    }[];
  }> {
    // USDT balance ABI
    const abiBalance = {
      inputs: [
        {
          name: 'account',
          type: 'address',
        },
      ],
      name: 'balanceOf',
      outputs: [
        {
          name: 'balance',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    };
    const tokenContract = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
    const validAddresses: string[] = [];
    const invalidAddresses: string[] = [];

    // Fetch Current ETH/USD price
    const ethToUsdPrice = await this.fetchEthToUsdPrice();

    //Create a batch request to the ETH Node to fetch the balances of all the valid addresses
    const batch = new this.eth.BatchRequest();
    const balancePromises: Web3DeferredPromise<unknown>[] = [];

    addresses.forEach((address) => {
      if (isAddress(address, true)) {
        validAddresses.push(address);

        // ETH balance payload
        const ethPayload: JsonRpcOptionalRequest = {
          method: 'eth_getBalance',
          params: [address, 'latest'],
        };
        balancePromises.push(batch.add(ethPayload));

        // USDT balance payload
        const usdtData = encodeFunctionCall(abiBalance, [address]);
        const usdtPayload: JsonRpcOptionalRequest = {
          method: 'eth_call',
          params: [
            {
              to: tokenContract,
              data: usdtData,
            },
            'latest',
          ],
        };
        balancePromises.push(batch.add(usdtPayload));
      } else {
        invalidAddresses.push(address);
      }
    });

    // Execute the batch request
    await batch.execute();

    const results = await Promise.all(balancePromises);
    console.log('results', results);
    const processedResults = [];

    for (let i = 0; i < results.length; i += 2) {
      const ethBalanceWei = results[i].toString(); // ETH balance in Wei
      const ethBalance = parseFloat(fromWei(ethBalanceWei, 'ether')); // Convert Wei to Ether
      const ethBalanceUsd = ethBalance * ethToUsdPrice; // Convert ETH balance to USD

      const usdtBalance =
        parseFloat(hexToNumberString(results[i + 1].toString())) / 10 ** 6; // USDT balance in HEX, convert to number and divide by 10^6 for 6 decimals
      console.log('usdtBalance', usdtBalance);

      const totalUsdBalance = ethBalanceUsd + usdtBalance; // Sum of ETH balance in USD and USDT balance

      processedResults.push({
        address: validAddresses[i / 2],
        eth_balance: ethBalance,
        usdt_balance: usdtBalance,
        usd_balance: totalUsdBalance,
      });
    }

    // Sort the results by USD balance in descending order
    processedResults.sort((a, b) => b.usd_balance - a.usd_balance);

    return {
      wrong_addresses: invalidAddresses,
      sorted_addresses: processedResults,
    };
  }
}
