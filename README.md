# NestJS Ethereum Balance API
## Description

This NestJS server integrates with the Web3 library to offer an endpoint that validates wallet addresses and fetches their balances in ETH, USDT, and USD. It utilizes the Infura node to conduct batch requests, enabling efficient retrieval of balances for valid wallets while minimizing HTTP traffic.

Upon receiving a POST request containing an array of wallet addresses, the server sorts these addresses into valid and invalid categories. For the valid addresses, it retrieves the current balances in ETH and USDT, calculates the total value in USD, and includes these balances along with the total value in the response. Conversely, for the invalid addresses, it simply returns a list of these addresses in the response.

## Version

### 0.0.2
- Added support for USDT balance
- Conversion Rate is now cached for 1 minute (Based on CoinGecko's update frequency of 1-3 minutes) in order to reduce the number of HTTP requests to CoinGecko
- Added new test cases for USDT balance
- Tested the server performance with 3 addresses, sent with 0.01 second intervals. The server was able to process all requests, average response time was 165 ms.
- Updated README.md to include new endpoint and response format
## Installation

```bash
$ npm install
```

## Configuration

### Environment variables

The server uses the following environment variables:

INFURA_URL=https://mainnet.infura.io/v3/2bd74917127f4cd79ca1c04c55e4ea12
COINGECKO_URL=https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd

Be sure to create .env file in the root directory and set these variables before running the server.
## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Endpoints

### POST /eth/validate-and-sort-balances

#### Request

```bash
curl --location --request POST 'http://localhost:3000/eth/validate-and-sort-balances' \
-H 'Content-Type: application/json' \
-d '{
    "addresses": [
        "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "WrongAddress"
    ]
}'

```
#### Response

```bash
{
  "wrong_addresses":["WrongAddress"],
  "sorted_addresses":
  [{
    "address":"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "eth_balance":95834.79738153741,
    "usdt_balance":33760144.750051,
    "usd_balance":183008466.45218828
  }]
}

```


## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - Koyukan
- Website - [https://koyukan.com]
- email - kkoyukan@uottawa.ca