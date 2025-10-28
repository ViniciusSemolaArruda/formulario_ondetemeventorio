-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'CHECKED_IN', 'REVOKED');

-- AlterTable
ALTER TABLE "GuestInvite" ADD COLUMN     "checkInAt" TIMESTAMP(3),
ADD COLUMN     "checkInToken" VARCHAR(64),
ADD COLUMN     "status" "InviteStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "GuestInvite_status_idx" ON "GuestInvite"("status");
