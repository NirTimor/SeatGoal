# 🚀 Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- pnpm installed globally (already done!)

## Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run Development Servers
```bash
# Start all services
pnpm dev
```

This will start:
- **Frontend** (Next.js): http://localhost:3000
- **API** (NestJS): http://localhost:3001

### 3. Test the Application

#### Frontend:
- Visit http://localhost:3000
- You'll be redirected to http://localhost:3000/he (Hebrew - default)
- Click the language switcher to switch to English
- See the homepage with RTL support for Hebrew

#### API:
- Visit http://localhost:3001/health
- Should return: `{"status":"ok","timestamp":"...","service":"SeatGoal API"}`

#### Available API endpoints:
- GET /health
- GET /events
- GET /seats
- POST /cart/hold
- POST /checkout/session
- POST /webhooks/payment

(Note: Endpoints return placeholder responses until Step 1 is complete)

## Building for Production

```bash
pnpm build
```

This will:
1. Build the types package
2. Build the API
3. Build the Next.js frontend (static pages)

## Running Individual Apps

```bash
# Frontend only
pnpm --filter web dev

# API only
pnpm --filter api dev

# Types only (watch mode)
pnpm --filter types dev
```

## Project Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all apps |
| `pnpm test` | Run tests (when implemented) |
| `pnpm clean` | Clean build artifacts |

## Language Support

The app supports:
- **Hebrew (עברית)** - Default, with RTL support
- **English** - LTR layout

Switch languages using the language switcher in the top navigation.

## What's Working

✅ Monorepo structure with Turborepo
✅ Next.js frontend with i18n
✅ NestJS backend with module structure
✅ Shared types with Zod validation
✅ Development workflow
✅ Build process
✅ CI/CD configuration

## What's Next (Step 1)

- Database setup (PostgreSQL + Prisma)
- Redis for seat holds
- Authentication
- Real API endpoints with data

## Troubleshooting

### Port already in use
If ports 3000 or 3001 are in use, you'll need to stop those services or change the ports in the configuration.

### Build errors
Make sure all dependencies are installed:
```bash
pnpm install
```

### Types not found
Build the types package first:
```bash
pnpm --filter types build
```

---

**Ready to move to Step 1!** 🎉

