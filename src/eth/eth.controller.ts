import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { EthService } from './eth.service';

@Controller('eth')
export class EthController {
  constructor(private readonly ethService: EthService) {}

  @Post('validate-and-sort-balances')
  @HttpCode(200)
  async validateAndSortBalances(
    @Body('addresses') addresses: string[],
  ): Promise<{
    wrong_addresses: string[];
    sorted_addresses: { address: string; eth_balance: number }[];
  }> {
    // Call the service method to validate and sort the balances
    const result = await this.ethService.validateAndSortBalances(addresses);

    // The result is already in the desired format, just return it.
    return result;
  }
}
