# SeatGoal - Football Tickets Platform

A modern ticket purchasing platform for football games in Israel.

## Project Structure

This is a monorepo managed with Turborepo and pnpm:

- `apps/web` - Next.js 14 frontend with TailwindCSS and i18n (Hebrew/English with RTL support)
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

