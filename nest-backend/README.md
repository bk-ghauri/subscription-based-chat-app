## Description

This is the backend of a subscription-based chat application, built using NestJS, with Multer for file uploads, Stripe subscriptions and and socket.io. The database used is PostGreSQL.

## Stripe setup

1. Create a Stripe account (or use the company one).
2. In test mode, create:

- A product: Premium Plan
- A recurring price (e.g., $5/month)

3. Copy the price ID (price_xxx) into .env.
4. Add your test API keys (refer to .env.example provided).
5. Run the app in dev mode and test subscriptions via the Stripe test checkout.
6. Use Stripe’s test cards (e.g., 4242 4242 4242 4242) for testing payments.

## Project setup

### Setup

1. Copy `.env.example` → `.env`
2. Fill in required values

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
