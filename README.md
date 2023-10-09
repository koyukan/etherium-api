# NestJS Ethereum Balance API
## Description

This NestJS server integrates with the Web3 library to provide an endpoint that validates Ethereum wallet addresses and fetches their balances in Eth and Usd. The server uses the Infura node for batch requests to efficiently retrieve the balances of valid wallets, optimizing HTTP traffic.

For each POST request with an array of wallet addresses, the server will categorize the addresses into valid and invalid groups. For valid addresses, it fetches the current ETH and USD balances.

## Installation

```bash
$ npm install
```

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

### POST /balance

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
  "sorted_addresses":[{"address":"0x742d35Cc6634C0532925a3b844Bc454e4438f44e","eth_balance":84922.77269879742,"usd_balance":13834938745906484}]
}

```


## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - Koyukan
- Website - [https://koyukan.com]
- email - kkoyukan@uottawa.ca