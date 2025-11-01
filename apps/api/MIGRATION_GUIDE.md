# Database Migration Guide

## Prerequisites

Before running the migration, ensure:
1. Your database is backed up
2. Your `.env` file contains the correct `DATABASE_URL`
3. You're in the `apps/api` directory

## Step-by-Step Migration Process

### 1. Review the Schema Changes

The following changes will be applied to your database:

**New Tables:**
- `user_profiles`
- `season_subscriptions`
- `loyalty_points`
- `ticket_transfers`
- `payment_methods`

**Updated Tables:**
- `order_items` (added `attended`, `attended_at` columns)

**New Enums:**
- `Gender`
- `SubscriptionStatus`
- `LoyaltyPointType`
- `TransferStatus`
- `PaymentMethodType`

### 2. Generate the Migration

```bash
cd apps/api
npx prisma migrate dev --name add_user_profile_system
```

This command will:
- Create a new migration file in `prisma/migrations/`
- Apply the migration to your development database
- Regenerate the Prisma Client

**Expected Output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "..."

Applying migration `20241101XXXXXX_add_user_profile_system`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20241101XXXXXX_add_user_profile_system/
    └─ migration.sql

Your database is now in sync with your schema.
✔ Generated Prisma Client
```

### 3. Verify the Migration

Check that all tables were created:

```bash
npx prisma studio
```

This opens a GUI where you can verify:
- All new tables exist
- Columns and types are correct
- Indexes are in place
- Relations are established

### 4. Create Initial User Profiles (Optional)

If you have existing users in the `orders` table, you may want to create user profiles for them:

```sql
-- This is an example SQL script to create profiles for existing users
-- Run this in your database client if needed

INSERT INTO user_profiles (id, clerk_user_id, first_name, last_name, email, country, created_at, updated_at)
SELECT
  gen_random_uuid(),
  user_id,
  first_name,
  last_name,
  email,
  'IL',
  NOW(),
  NOW()
FROM orders
WHERE user_id IS NOT NULL
GROUP BY user_id, first_name, last_name, email
ON CONFLICT (clerk_user_id) DO NOTHING;
```

### 5. Deploy to Production

When ready to deploy to production:

```bash
# Set production DATABASE_URL in .env or pass it directly
npx prisma migrate deploy
```

**For Neon/Vercel deployment:**
```bash
# Ensure your DATABASE_URL points to production
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### 6. Verify Production Deployment

```bash
# Check migration status
npx prisma migrate status

# Expected output:
# Database schema is up to date!
```

---

## Rollback Procedure (If Needed)

If you need to rollback the migration:

### Option 1: Migrate Down (Development Only)

Prisma doesn't have built-in rollback, but you can:

1. Delete the migration folder:
```bash
rm -rf prisma/migrations/20241101XXXXXX_add_user_profile_system
```

2. Reset the database:
```bash
npx prisma migrate reset
```

**Warning:** This deletes all data!

### Option 2: Manual SQL Rollback

Execute this SQL to remove all new tables:

```sql
-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS ticket_transfers CASCADE;
DROP TABLE IF EXISTS loyalty_points CASCADE;
DROP TABLE IF EXISTS season_subscriptions CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop enums
DROP TYPE IF EXISTS "Gender";
DROP TYPE IF EXISTS "SubscriptionStatus";
DROP TYPE IF EXISTS "LoyaltyPointType";
DROP TYPE IF EXISTS "TransferStatus";
DROP TYPE IF EXISTS "PaymentMethodType";

-- Rollback order_items changes
ALTER TABLE order_items
DROP COLUMN IF EXISTS attended,
DROP COLUMN IF EXISTS attended_at;
```

---

## Common Issues and Solutions

### Issue 1: Migration Fails - Constraint Error

**Error:**
```
Foreign key constraint failed on the field: `user_profile_id`
```

**Solution:**
This happens if there's orphaned data. Clean it up before migrating:
```sql
DELETE FROM table_name WHERE user_profile_id NOT IN (SELECT id FROM user_profiles);
```

### Issue 2: Enum Already Exists

**Error:**
```
Type "Gender" already exists
```

**Solution:**
Drop the existing enum first:
```sql
DROP TYPE IF EXISTS "Gender";
```

### Issue 3: Column Already Exists

**Error:**
```
Column "attended" already exists in table "order_items"
```

**Solution:**
The column was added manually before. Either:
1. Drop it: `ALTER TABLE order_items DROP COLUMN attended;`
2. Or skip this part of the migration

### Issue 4: Connection Pool Exhausted

**Error:**
```
Too many connections
```

**Solution:**
For Neon, add connection pooling to your DATABASE_URL:
```
postgresql://user:pass@host/db?pgbouncer=true&connection_limit=1
```

---

## Post-Migration Checklist

- [ ] All new tables created successfully
- [ ] Indexes are in place
- [ ] Foreign key constraints are working
- [ ] Prisma Client regenerated
- [ ] Application starts without errors
- [ ] Can create a user profile via API
- [ ] Can create a subscription via API
- [ ] Can create loyalty points via API
- [ ] Can create a transfer via API
- [ ] Can create a payment method via API
- [ ] Existing orders still work
- [ ] No data loss in existing tables

---

## Migration SQL Preview

Here's what the migration will look like (generated by Prisma):

```sql
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED');
CREATE TYPE "LoyaltyPointType" AS ENUM ('AWAY_GAME_PURCHASE', 'HOME_GAME_ATTENDANCE', 'SUBSCRIPTION_BONUS', 'REFERRAL', 'REDEEMED', 'EXPIRED', 'ADMIN_ADJUSTMENT');
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "PaymentMethodType" AS ENUM ('CARD', 'PAYPAL', 'BANK_ACCOUNT', 'DIGITAL_WALLET');

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "id_number" TEXT,
    "birth_date" TIMESTAMP(3),
    "gender" "Gender",
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "country" TEXT NOT NULL DEFAULT 'IL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_subscriptions" (
    "id" TEXT NOT NULL,
    "user_profile_id" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "team_he" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "price" DECIMAL(10,2) NOT NULL,
    "seat_info" JSONB,
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "season_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_points" (
    "id" TEXT NOT NULL,
    "user_profile_id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "type" "LoyaltyPointType" NOT NULL,
    "reason" TEXT NOT NULL,
    "order_id" TEXT,
    "order_item_id" TEXT,
    "event_id" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_transfers" (
    "id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "sender_profile_id" TEXT NOT NULL,
    "receiver_email" TEXT NOT NULL,
    "receiver_profile_id" TEXT,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "user_profile_id" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "last4" TEXT NOT NULL,
    "brand" TEXT,
    "expiry_month" INTEGER,
    "expiry_year" INTEGER,
    "holder_name" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "provider_method_id" TEXT NOT NULL,
    "billing_address" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "order_items"
ADD COLUMN "attended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "attended_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_clerk_user_id_key" ON "user_profiles"("clerk_user_id");
CREATE UNIQUE INDEX "user_profiles_email_key" ON "user_profiles"("email");
CREATE UNIQUE INDEX "user_profiles_id_number_key" ON "user_profiles"("id_number");
CREATE INDEX "user_profiles_clerk_user_id_idx" ON "user_profiles"("clerk_user_id");
CREATE INDEX "user_profiles_email_idx" ON "user_profiles"("email");

CREATE INDEX "season_subscriptions_user_profile_id_idx" ON "season_subscriptions"("user_profile_id");
CREATE INDEX "season_subscriptions_status_idx" ON "season_subscriptions"("status");
CREATE INDEX "season_subscriptions_end_date_idx" ON "season_subscriptions"("end_date");

CREATE INDEX "loyalty_points_user_profile_id_idx" ON "loyalty_points"("user_profile_id");
CREATE INDEX "loyalty_points_created_at_idx" ON "loyalty_points"("created_at");
CREATE INDEX "loyalty_points_expires_at_idx" ON "loyalty_points"("expires_at");

CREATE UNIQUE INDEX "ticket_transfers_order_item_id_key" ON "ticket_transfers"("order_item_id");
CREATE INDEX "ticket_transfers_sender_profile_id_idx" ON "ticket_transfers"("sender_profile_id");
CREATE INDEX "ticket_transfers_receiver_profile_id_idx" ON "ticket_transfers"("receiver_profile_id");
CREATE INDEX "ticket_transfers_receiver_email_idx" ON "ticket_transfers"("receiver_email");
CREATE INDEX "ticket_transfers_status_idx" ON "ticket_transfers"("status");
CREATE INDEX "ticket_transfers_expires_at_idx" ON "ticket_transfers"("expires_at");

CREATE INDEX "payment_methods_user_profile_id_idx" ON "payment_methods"("user_profile_id");
CREATE INDEX "payment_methods_is_default_idx" ON "payment_methods"("is_default");

-- AddForeignKey
ALTER TABLE "season_subscriptions" ADD CONSTRAINT "season_subscriptions_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "loyalty_points" ADD CONSTRAINT "loyalty_points_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ticket_transfers" ADD CONSTRAINT "ticket_transfers_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_transfers" ADD CONSTRAINT "ticket_transfers_sender_profile_id_fkey" FOREIGN KEY ("sender_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_transfers" ADD CONSTRAINT "ticket_transfers_receiver_profile_id_fkey" FOREIGN KEY ("receiver_profile_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## Database Backup Recommendation

Before migrating production, create a backup:

### For Neon:
```bash
# Neon provides automatic backups, but you can also:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### For other PostgreSQL:
```bash
pg_dump -h localhost -U username -d database_name > backup_$(date +%Y%m%d).sql
```

### Restore from backup (if needed):
```bash
psql $DATABASE_URL < backup_20241101.sql
```

---

## Performance Considerations

After migration, you may want to:

1. **Analyze tables** (PostgreSQL):
```sql
ANALYZE user_profiles;
ANALYZE season_subscriptions;
ANALYZE loyalty_points;
ANALYZE ticket_transfers;
ANALYZE payment_methods;
```

2. **Monitor query performance**:
   - Use Prisma's query logging
   - Check slow query logs
   - Add indexes if needed

3. **Connection pooling**:
   - Ensure your connection pool is sized appropriately
   - For serverless (Vercel), use Prisma Data Proxy or Neon serverless driver

---

## Next Steps After Migration

1. **Test all endpoints** - Use the USER_PROFILE_API.md for testing
2. **Set up background jobs** - For expiring points and transfers
3. **Configure webhooks** - To automatically create profiles and award points
4. **Add monitoring** - Track API usage and performance
5. **Deploy frontend** - Start integrating with the new endpoints

---

## Support

If you encounter any issues during migration:
1. Check the error message carefully
2. Review the Common Issues section above
3. Check Prisma documentation: https://www.prisma.io/docs/
4. Check the migration file in `prisma/migrations/`
