/*
  Warnings:

  - You are about to drop the column `paymentMethod` on the `Donation` table. All the data in the column will be lost.
  - You are about to drop the column `referenceId` on the `Donation` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Donation_referenceId_key";

-- AlterTable
ALTER TABLE "Donation" DROP COLUMN "paymentMethod",
DROP COLUMN "referenceId",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "utrNumber" TEXT,
ALTER COLUMN "donorName" DROP NOT NULL;
