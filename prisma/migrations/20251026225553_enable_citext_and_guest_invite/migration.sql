/*
  Warnings:

  - You are about to drop the `Appointment` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum


CREATE TYPE "DocumentType" AS ENUM ('CPF', 'RG');

-- DropTable
DROP TABLE "public"."Appointment";

-- DropEnum
DROP TYPE "public"."PaymentMethod";

CREATE EXTENSION IF NOT EXISTS citext;

-- CreateTable
CREATE TABLE "GuestInvite" (
    "id" TEXT NOT NULL,
    "fullName" VARCHAR(120) NOT NULL,
    "email" CITEXT NOT NULL,
    "phone" VARCHAR(14) NOT NULL,
    "documentType" "DocumentType",
    "documentNumber" VARCHAR(14),
    "company" VARCHAR(120),
    "jobTitle" VARCHAR(120),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuestInvite_email_idx" ON "GuestInvite"("email");

-- CreateIndex
CREATE INDEX "GuestInvite_phone_idx" ON "GuestInvite"("phone");

-- CreateIndex
CREATE INDEX "GuestInvite_createdAt_idx" ON "GuestInvite"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GuestInvite_email_phone_key" ON "GuestInvite"("email", "phone");
