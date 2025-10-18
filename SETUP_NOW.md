# 🚀 Quick Setup Guide - Do This Now!

## ✅ Already Done:
- Neon PostgreSQL configured
- Environment files created

## 📋 What You Need to Do (10 minutes):

### 1️⃣ Get Clerk Keys (Authentication)

1. Go to **https://clerk.com**
2. Sign up / Log in
3. Click "**+ Create Application**"
4. Name it "SeatGoal" 
5. Select "**Next.js**"
6. Copy your keys:

**Backend key** - Add to `apps/api/.env`:
```bash
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

**Frontend key** - Add to `apps/web/.env.local`:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
```

---

### 2️⃣ Get Upstash Redis (Free)

1. Go to **https://upstash.com**
2. Sign up with GitHub or Email
3. Click "**Create Database**"
4. Choose:
   - Name: `seatgoal-redis`
   - Type: Regional
   - Region: (closest to you)
5. Click "**Create**"
6. Copy connection details and update `apps/api/.env`:

```bash
REDIS_HOST=your-redis-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-password-here
```

**OR** if you prefer local Redis:
- Install Redis locally
- Keep the default values:
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

### 3️⃣ Install Dependencies & Run Migrations

```bash
# Install new packages (Prisma, Clerk, Redis)
pnpm install

# Generate Prisma Client
cd apps/api
pnpm prisma generate

# Create database tables
pnpm prisma migrate dev --name init

# Go back to root
cd ../..
```

---

### 4️⃣ Start Development

```bash
pnpm dev
```

This will start:
- Frontend: http://localhost:3000
- API: http://localhost:3001

---

## ✅ Verify Everything Works

### Check API Health:
Visit: http://localhost:3001/health

Should see:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "SeatGoal API"
}
```

### Check Database:
Your terminal should show:
```
✅ Database connected
✅ Redis connected
```

### Check Authentication:
1. Visit http://localhost:3000
2. Click "**Sign In**" button (top right)
3. Create an account
4. You should see your profile picture

### Check Events API:
Visit: http://localhost:3001/events

Should see:
```json
{
  "data": [],
  "cached": false
}
```

---

## 🎯 Current Status

```
✅ Step 0 — Bootstrapping          [████████████] 100%
✅ Step 1 — DB/Infra               [████████████] 100%
   ✅ 1.1 Postgres + Prisma        ← Neon configured
   ⏳ 1.2 Redis                    ← Need Upstash or local
   ⏳ 1.3 Authentication           ← Need Clerk keys
   ✅ 1.4 Endpoints                ← Code ready
🔲 Step 2 — Basic Frontend         [            ] 0%
```

---

## 🆘 Troubleshooting

### "Cannot connect to database"
- Check your `DATABASE_URL` in `apps/api/.env`
- Make sure you're using the exact string from Neon

### "Redis connection failed"
- Verify your Upstash credentials
- OR use local: `REDIS_HOST=localhost` and `REDIS_PORT=6379`

### "Clerk authentication not working"
- Make sure you have BOTH keys set:
  - Backend: `apps/api/.env`
  - Frontend: `apps/web/.env.local`
- Keys must be from the same Clerk application

### "Prisma migrate fails"
- Delete `apps/api/prisma/migrations` folder
- Run: `pnpm prisma migrate dev --name init` again

---

## 📝 Optional: Add Sample Data

Once everything is running, you can add test data:

```bash
cd apps/api
pnpm prisma studio
```

This opens a database GUI where you can manually add:
- A stadium
- An event
- Some seats

---

**Ready?** Follow steps 1-4 above, then let me know when you're done! 🚀

