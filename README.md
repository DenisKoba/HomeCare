# HomeCare

Native-first household cleaning planner for iOS and Android.

## Stack

- Expo 57, React Native and Expo Router native tabs
- `@expo/ui` backed by SwiftUI and Jetpack Compose
- NestJS on Node.js with Fastify
- PostgreSQL, Prisma and Supabase Auth
- pnpm workspace with Turborepo

## Repository layout

- `apps/mobile` — Expo application with native tabs, SwiftUI/Compose controls, calendar and notification adapters
- `apps/api` — NestJS REST API, Supabase JWT verification and Prisma persistence
- `packages/contracts` — shared Zod request contracts
- `packages/planning` — deterministic daily-plan selection algorithm
- `outputs/openapi.yaml` — full REST contract

## Development

```bash
pnpm install
docker compose up -d
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
pnpm --filter @homecare/api prisma:generate
pnpm --filter @homecare/api prisma:migrate --name local
pnpm --filter @homecare/api prisma:seed
pnpm dev:api
pnpm dev:mobile
```

The committed initial migration can also be applied non-interactively with
`pnpm --filter @homecare/api exec prisma migrate deploy`.

`@expo/ui` renders actual SwiftUI and Jetpack Compose controls, so use a development build rather
than Expo Go when testing the complete interface:

```bash
pnpm --filter @homecare/mobile exec expo run:ios
# or
pnpm --filter @homecare/mobile exec expo run:android
```

## Supabase setup

1. Create a Supabase project and enable Google and Apple providers in Authentication.
2. Add `homecare://auth/callback` to the allowed redirect URLs.
3. Copy the project URL and anon key to `apps/mobile/.env`.
4. Copy the project URL to `SUPABASE_URL` in `apps/api/.env`.
5. Point `DATABASE_URL` at Supabase Postgres for hosted environments, or the Docker database locally.

Local API development can use `AUTH_DISABLED=true` and `DEV_USER_ID` from `.env.example`. The bypass
is explicitly disabled when `NODE_ENV=production`.

## Verification

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

Swagger UI is served at `/docs` once the API is running. The product specification and complete
OpenAPI contract are in `outputs/`.
