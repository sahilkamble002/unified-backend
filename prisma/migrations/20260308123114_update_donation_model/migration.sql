/*
  Warnings:

  - You are about to drop the column `paymentId` on the `Donation` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Donation` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `method` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Expense` table. All the data in the column will be lost.
  - Added the required column `paymentMethod` to the `Donation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Donation" DROP CONSTRAINT "Donation_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "Donation" DROP CONSTRAINT "Donation_userId_fkey";

-- AlterTable
ALTER TABLE "Donation" DROP COLUMN "paymentId",
DROP COLUMN "userId",
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL,
ADD COLUMN     "referenceId" TEXT;

-- AlterTable
ALTER TABLE "Expense" DROP COLUMN "category",
DROP COLUMN "method",
DROP COLUMN "notes";

-- CreateTable
CREATE TABLE "_DonationToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DonationToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DonationToUser_B_index" ON "_DonationToUser"("B");

-- AddForeignKey
ALTER TABLE "_DonationToUser" ADD CONSTRAINT "_DonationToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DonationToUser" ADD CONSTRAINT "_DonationToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
