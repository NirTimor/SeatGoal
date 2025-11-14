-- CreateEnum
CREATE TYPE "PriceZone" AS ENUM ('VIP', 'PREMIUM', 'STANDARD', 'ECONOMY');

-- AlterTable
ALTER TABLE "seats" ADD COLUMN     "amenities" JSONB,
ADD COLUMN     "is_accessible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "price_zone" "PriceZone" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "view_rating" INTEGER;

-- AlterTable
ALTER TABLE "stadiums" ADD COLUMN     "seat_view_images" JSONB;

-- CreateIndex
CREATE INDEX "seats_price_zone_idx" ON "seats"("price_zone");

-- CreateIndex
CREATE INDEX "seats_is_accessible_idx" ON "seats"("is_accessible");
