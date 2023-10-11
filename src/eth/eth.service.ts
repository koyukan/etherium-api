import { ForbiddenException, Injectable, Inject } from '@nestjs/common';
import HttpProvider from 'web3-providers-http';
import Eth from 'web3-eth';
import { fromWei, Web3DeferredPromise } from 'web3-utils';
import { isAddress } from 'web3-validator';
import { HttpService } from '@nestjs/axios';
import { map, catchError, lastValueFrom } from 'rxjs';
import { JsonRpcOptionalRequest } from 'web3-types';
import { Contract } from 'web3-eth-contract';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class EthService {
  private eth: Eth;
  private usdtContract: any;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    // Initialize Eth instance; here it's connected to the Ethereum mainnet via Infura
    const provider = new HttpProvider(configService.get<string>('INFURA_URL'));
    this.eth = new Eth(provider);
    const balanceOfABI = [
      {
        constant: true,
        inputs: [
          {
            name: '_owner',
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
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
    ];
    const tokenContract = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
    this.usdtContract = new Contract(balanceOfABI, tokenContract);
    this.usdtContract.setProvider(provider);
  }

  // Fetches the current ETH/USD price from CoinGecko
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
      } else {
        invalidAddresses.push(address);
      }
    });

    // Execute the batch request
    await batch.execute();

    const results = await Promise.all(balancePromises);

    const balanceRes = results
      .map((balance, index) => {
        // Convert the balance from wei to ether
        const balanceEther = parseFloat(fromWei(balance.toString(), 'ether'));
        return {
          address: validAddresses[index].toString(),
          eth_balance: balanceEther,
          // Convert the balance from ether to USD
          usd_balance: balanceEther * ethToUsdPrice,
        };
      })
      // Sort the results by USD balance in descending order
      .sort((a, b) => b.usd_balance - a.usd_balance);

    // USDT balance payload
    const batch2 = new this.eth.BatchRequest();
    const balancePromises2: Web3DeferredPromise<unknown>[] = [];
    usdtPayload: JsonRpcOptionalRequest = {
      method: 'eth_call',
      params: [address, 'latest'],
    };
    const resul = await this.usdtContract.methods
      .balanceOf(addresses[0])
      .call();
    console.log(resul);
    balancePromises.push(batch.add(resul));

    return {
      wrong_addresses: invalidAddresses,
      sorted_addresses: balanceRes,
    };
  }
}
