-- AlterTable
ALTER TABLE "GuestInvite" ADD COLUMN     "city" VARCHAR(120),
ADD COLUMN     "state" VARCHAR(2);

-- CreateIndex
CREATE INDEX "GuestInvite_state_city_idx" ON "GuestInvite"("state", "city");
