/*
  Warnings:

  - You are about to drop the column `utrNumber` on the `Donation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[referenceId]` on the table `Donation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Donation" DROP COLUMN "utrNumber",
ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "referenceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Donation_referenceId_key" ON "Donation"("referenceId");
