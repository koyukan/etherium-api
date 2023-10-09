import { Test, TestingModule } from '@nestjs/testing';
import { EthController } from './eth.controller';
import { EthService } from './eth.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

describe('EthController', () => {
  let controller: EthController;
  let service: EthService;

  // Set up the testing environment for the controller
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EthController],
      imports: [HttpModule, ConfigModule.forRoot()],
      providers: [EthService],
    }).compile();

    // Retrieve the instances of the controller and service to be tested
    controller = module.get<EthController>(EthController);
    service = module.get<EthService>(EthService);
  });

  // Basic test to ensure the controller is defined
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Test suite for the POST method: validateAndSortBalances
  describe('validateAndSortBalances POST method', () => {
    it('should validate and sort ETH balances and return the result', async () => {
      // Mock payload to simulate the data that would be passed to the method
      const testPayload = ['0x12345', 'WrongAddress'];

      // Expected result for this test
      const expectedResult = {
        wrong_addresses: ['WrongAddress'],
        sorted_addresses: [
          { address: '0x12345', eth_balance: 10, usd_balance: 20 },
        ],
      };

      // Mocking the service's method. This ensures that when the controller
      // calls this service method, it returns our expectedResult rather
      // than executing the actual service logic.
      jest
        .spyOn(service, 'validateAndSortBalances')
        .mockImplementation(async () => {
          return expectedResult;
        });

      // Call the controller's method with the test payload
      const result = await controller.validateAndSortBalances(testPayload);

      // Assertion: Ensure that the controller's return value matches our expected result
      expect(result).toEqual(expectedResult);
    });
  });
});
