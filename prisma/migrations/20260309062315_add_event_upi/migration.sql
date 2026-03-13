/*
  Warnings:

  - A unique constraint covering the columns `[referenceId]` on the table `Donation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "donationUpiId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Donation_referenceId_key" ON "Donation"("referenceId");
