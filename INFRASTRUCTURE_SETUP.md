# Infrastructure Setup Guide

This guide will walk you through setting up the required infrastructure for SeatGoal.

---

## Prerequisites

- Node.js >= 18.0.0 installed
- pnpm >= 8.0.0 installed
- Git installed

---

## Step 1: Database Setup (PostgreSQL)

You have two recommended options:

### Option A: Neon (Recommended for Development)

1. Go to https://console.neon.tech/
2. Sign up or log in
3. Click "Create Project"
4. Enter project name: `seatgoal`
5. Select region closest to you
6. Copy the connection string that looks like:
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

### Option B: Supabase

1. Go to https://app.supabase.com/
2. Sign up or log in
3. Click "New Project"
4. Enter project name: `seatgoal`
5. Set a database password
6. Select region
7. Wait for project to be created
8. Go to Project Settings -> Database
9. Find "Connection string" -> "URI" and copy it

### Configure Database

1. Navigate to `apps/api/`
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and update `DATABASE_URL` with your connection string
4. Save the file

---

## Step 2: Redis Setup

You have two recommended options:

### Option A: Upstash (Recommended for Development)

1. Go to https://console.upstash.com/
2. Sign up or log in
3. Click "Create Database"
4. Enter database name: `seatgoal`
5. Select region closest to you
6. Click "Create"
7. In the database details, find:
   - Endpoint (this is your REDIS_HOST, without the port)
   - Port (usually 6379 for non-TLS)
   - Password

Update your `apps/api/.env`:
```env
REDIS_HOST="your-endpoint.upstash.io"
REDIS_PORT="6379"
REDIS_PASSWORD="your-password-here"
REDIS_DB="0"
```

### Option B: Local Docker

1. Make sure Docker is installed and running
2. Run Redis container:
   ```bash
   docker run -d --name seatgoal-redis -p 6379:6379 redis:alpine
   ```

Update your `apps/api/.env`:
```env
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
REDIS_DB="0"
```

---

## Step 3: Authentication Setup (Clerk)

1. Go to https://dashboard.clerk.com/
2. Sign up or log in
3. Click "Add Application"
4. Enter application name: `SeatGoal`
5. Select authentication methods you want to enable (Email, Google, etc.)
6. Click "Create Application"

### Get API Keys

1. In Clerk Dashboard, go to "API Keys"
2. You'll see:
   - **Publishable Key** (starts with `pk_test_`)
   - **Secret Key** (starts with `sk_test_`)

### Configure Backend

Update `apps/api/.env`:
```env
CLERK_SECRET_KEY="sk_test_your_actual_secret_key_here"
```

### Configure Frontend

1. Navigate to `apps/web/`
2. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
3. Update the values:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_actual_publishable_key_here"
   CLERK_SECRET_KEY="sk_test_your_actual_secret_key_here"
   NEXT_PUBLIC_API_URL="http://localhost:3001"
   ```

---

## Step 4: Run Database Migrations

**IMPORTANT:** Before running migrations, make sure you have:
- Created your database instance (Neon/Supabase)
- Copied `.env.example` to `.env`
- Added your `DATABASE_URL` to the `.env` file

1. Navigate to the API directory:
   ```bash
   cd apps/api
   ```

2. **If you haven't installed dependencies yet**, run:
   ```bash
   pnpm install
   ```

3. Generate Prisma Client:
   ```bash
   pnpm prisma generate
   ```

4. Run the initial migration:
   ```bash
   pnpm prisma migrate dev --name init
   ```

5. You should see output confirming tables were created

**Note:** On Windows, if you get "prisma is not recognized" error, use `pnpm prisma` instead of just `prisma`. The commands above already include `pnpm`.

---

## Step 5: Verify Setup

### Test Database Connection

```bash
cd apps/api
pnpm prisma studio
```

This should open Prisma Studio in your browser at http://localhost:5555

### Test Backend Server

```bash
cd apps/api
pnpm dev
```

Visit http://localhost:3001/health - you should see:
```json
{
  "status": "ok",
  "timestamp": "2025-10-21T...",
  "service": "SeatGoal API"
}
```

### Test Frontend

In a new terminal:
```bash
cd apps/web
pnpm dev
```

Visit http://localhost:3000 - you should see the homepage with language switcher

---

## Step 6: Seed Sample Data

After migrations are complete, you can seed the database with sample data for testing.

```bash
cd apps/api
pnpm prisma db seed
```

(Note: We'll create the seed script in the next step)

---

## Troubleshooting

### Database Connection Issues

- **Error: Can't reach database server**
  - Check your DATABASE_URL is correct
  - Verify your IP is whitelisted (for Neon/Supabase)
  - Check if database is running

- **SSL/TLS errors**
  - Add `?sslmode=require` to connection string
  - For local DB, use `?sslmode=disable`

### Redis Connection Issues

- **Error: ECONNREFUSED**
  - Check Redis is running (Docker: `docker ps`)
  - Verify REDIS_HOST and REDIS_PORT are correct
  - Check firewall settings

### Clerk Authentication Issues

- **Error: Clerk publishable key not found**
  - Make sure you copied `.env.example` to `.env.local` (frontend)
  - Verify the keys start with `pk_test_` and `sk_test_`
  - Restart the dev server after changing env files

### Migration Errors

- **Error: Migration already applied**
  - Reset database: `pnpm prisma migrate reset`
  - This will delete all data and rerun migrations

- **Error: Schema is out of sync**
  - Run: `pnpm prisma generate`
  - Then: `pnpm prisma migrate dev`

---

## Environment Variables Checklist

### Backend (apps/api/.env)
- [ ] DATABASE_URL - PostgreSQL connection string
- [ ] REDIS_HOST - Redis hostname
- [ ] REDIS_PORT - Redis port (usually 6379)
- [ ] REDIS_PASSWORD - Redis password (if any)
- [ ] REDIS_DB - Redis database number (usually 0)
- [ ] CLERK_SECRET_KEY - Clerk secret key (sk_test_...)
- [ ] PORT - API port (default: 3001)
- [ ] FRONTEND_URL - Frontend URL for CORS

### Frontend (apps/web/.env.local)
- [ ] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY - Clerk publishable key (pk_test_...)
- [ ] CLERK_SECRET_KEY - Clerk secret key (sk_test_...)
- [ ] NEXT_PUBLIC_API_URL - Backend API URL

---

## Next Steps

Once all infrastructure is set up:

1. ✅ Database connected and migrated
2. ✅ Redis connected
3. ✅ Clerk authentication configured
4. ➡️ Create seed data for testing
5. ➡️ Build frontend pages
6. ➡️ Test complete flow

See `TASK_MANAGER.md` for detailed task tracking.
