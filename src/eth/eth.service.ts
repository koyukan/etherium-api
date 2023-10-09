import { ForbiddenException, Injectable } from '@nestjs/common';
import HttpProvider from 'web3-providers-http';
import Eth from 'web3-eth';
import { fromWei, Web3DeferredPromise } from 'web3-utils';
import { isAddress } from 'web3-validator';
import { HttpService } from '@nestjs/axios';
import { map, catchError, lastValueFrom } from 'rxjs';
import { JsonRpcOptionalRequest } from 'web3-types';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class EthService {
  private eth: Eth;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    // Initialize Eth instance; here it's connected to the Ethereum mainnet via Infura
    const provider = new HttpProvider(configService.get<string>('INFURA_URL'));
    this.eth = new Eth(provider);
  }

  // Fetches the current ETH/USD price from CoinGecko
  private async fetchEthToUsdPrice(): Promise<number> {
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
        const payload: JsonRpcOptionalRequest = {
          method: 'eth_getBalance',
          params: [address, 'latest'],
        };
        const deferredPromise = batch.add(payload);
        balancePromises.push(deferredPromise);
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

    return {
      wrong_addresses: invalidAddresses,
      sorted_addresses: balanceRes,
    };
  }
}
