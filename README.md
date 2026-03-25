# SeatGoal - Football Tickets Platform

A modern ticket purchasing platform for football games in Israel.

## Project Structure

This is a monorepo managed with Turborepo and pnpm:

- `apps/web` - Next.js 14 frontend with TailwindCSS and i18n (Hebrew/English with RTL support). To add a new stadium seatmap, see `apps/web/src/stadiums/STADIUM_GUIDE.md`.
- `apps/api` - NestJS backend API
- `packages/types` - Shared TypeScript types and Zod schemas

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## Installation

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install dependencies
pnpm install
```

## First-time setup

1. **Database (local):** from the repo root, `docker compose up -d` (see `docker-compose.yml`).
2. **Environment:** copy `apps/api/.env.example` → `apps/api/.env` and `apps/web/.env.example` → `apps/web/.env.local`, then fill in values (Clerk, Redis, Stripe, etc.—comments in those files list where to get each).
3. **Prisma:** `pnpm --filter api exec prisma generate` then `pnpm --filter api exec prisma migrate deploy` (or `migrate dev` while developing).

## Running the Project

```bash
# Run all apps in development mode
pnpm dev

# Build all apps
pnpm build

# Run linting
pnpm lint

# Run tests
pnpm test
```

## Development

### Running individual apps

```bash
# Run only the web app
pnpm --filter web dev

# Run only the API
pnpm --filter api dev
```

## License

MIT

