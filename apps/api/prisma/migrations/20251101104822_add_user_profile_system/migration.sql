-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "LoyaltyPointType" AS ENUM ('AWAY_GAME_PURCHASE', 'HOME_GAME_ATTENDANCE', 'SUBSCRIPTION_BONUS', 'REFERRAL', 'REDEEMED', 'EXPIRED', 'ADMIN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('CARD', 'PAYPAL', 'BANK_ACCOUNT', 'DIGITAL_WALLET');

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "attended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "attended_at" TIMESTAMP(3);

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

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_clerk_user_id_key" ON "user_profiles"("clerk_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_email_key" ON "user_profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_id_number_key" ON "user_profiles"("id_number");

-- CreateIndex
CREATE INDEX "user_profiles_clerk_user_id_idx" ON "user_profiles"("clerk_user_id");

-- CreateIndex
CREATE INDEX "user_profiles_email_idx" ON "user_profiles"("email");

-- CreateIndex
CREATE INDEX "season_subscriptions_user_profile_id_idx" ON "season_subscriptions"("user_profile_id");

-- CreateIndex
CREATE INDEX "season_subscriptions_status_idx" ON "season_subscriptions"("status");

-- CreateIndex
CREATE INDEX "season_subscriptions_end_date_idx" ON "season_subscriptions"("end_date");

-- CreateIndex
CREATE INDEX "loyalty_points_user_profile_id_idx" ON "loyalty_points"("user_profile_id");

-- CreateIndex
CREATE INDEX "loyalty_points_created_at_idx" ON "loyalty_points"("created_at");

-- CreateIndex
CREATE INDEX "loyalty_points_expires_at_idx" ON "loyalty_points"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_transfers_order_item_id_key" ON "ticket_transfers"("order_item_id");

-- CreateIndex
CREATE INDEX "ticket_transfers_sender_profile_id_idx" ON "ticket_transfers"("sender_profile_id");

-- CreateIndex
CREATE INDEX "ticket_transfers_receiver_profile_id_idx" ON "ticket_transfers"("receiver_profile_id");

-- CreateIndex
CREATE INDEX "ticket_transfers_receiver_email_idx" ON "ticket_transfers"("receiver_email");

-- CreateIndex
CREATE INDEX "ticket_transfers_status_idx" ON "ticket_transfers"("status");

-- CreateIndex
CREATE INDEX "ticket_transfers_expires_at_idx" ON "ticket_transfers"("expires_at");

-- CreateIndex
CREATE INDEX "payment_methods_user_profile_id_idx" ON "payment_methods"("user_profile_id");

-- CreateIndex
CREATE INDEX "payment_methods_is_default_idx" ON "payment_methods"("is_default");

-- AddForeignKey
ALTER TABLE "season_subscriptions" ADD CONSTRAINT "season_subscriptions_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_points" ADD CONSTRAINT "loyalty_points_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_transfers" ADD CONSTRAINT "ticket_transfers_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_transfers" ADD CONSTRAINT "ticket_transfers_sender_profile_id_fkey" FOREIGN KEY ("sender_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_transfers" ADD CONSTRAINT "ticket_transfers_receiver_profile_id_fkey" FOREIGN KEY ("receiver_profile_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
