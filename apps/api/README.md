# SeatGoal API

NestJS backend for the SeatGoal football tickets platform.

## Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment Variables
Copy the example file and update with your values:
```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT` - Redis connection
- `CLERK_SECRET_KEY` - Clerk authentication

### 3. Set Up Database

#### Option A: Using Neon (Recommended for development)
1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string to `DATABASE_URL` in `.env`

#### Option B: Using Supabase
1. Go to [supabase.com](https://supabase.com) and create a project
2. Get the connection string from Settings > Database
3. Copy to `DATABASE_URL` in `.env`

#### Option C: Local PostgreSQL
```bash
# Install PostgreSQL locally
# Then set DATABASE_URL to:
DATABASE_URL="postgresql://postgres:password@localhost:5432/seatgoal"
```

### 4. Run Migrations
```bash
# Generate Prisma Client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev --name init

# (Optional) Seed database with sample data
pnpm prisma db seed
```

### 5. Set Up Redis

#### Option A: Using Upstash (Recommended for development)
1. Go to [upstash.com](https://upstash.com) and create a free account
2. Create a new Redis database
3. Copy the connection details to `.env`

#### Option B: Local Redis
```bash
# Install Redis locally
# For Windows: use WSL or Docker
docker run -d -p 6379:6379 redis:alpine

# Update .env
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Development

```bash
# Start development server
pnpm dev

# Build
pnpm build

# Run tests
pnpm test
```

## Database Commands

```bash
# Open Prisma Studio (database GUI)
pnpm prisma studio

# Create a new migration
pnpm prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset

# Generate Prisma Client after schema changes
pnpm prisma generate
```

## API Endpoints

### Health
- `GET /health` - Health check

### Events
- `GET /events` - List all events
- `GET /events/:id` - Get event details
- `GET /events/:id/seats` - Get available seats for an event

### Cart
- `POST /cart/hold` - Hold seats for a user

### Checkout
- `POST /checkout/session` - Create checkout session

### Webhooks
- `POST /webhooks/payment` - Payment provider webhook

## Project Structure

```
apps/api/
├── prisma/
│   └── schema.prisma    # Database schema
├── src/
│   ├── prisma/          # Prisma module
│   ├── events/          # Events module
│   ├── seats/           # Seats module
│   ├── cart/            # Cart module
│   ├── checkout/        # Checkout module
│   └── webhooks/        # Webhooks module
└── .env                 # Environment variables
```

