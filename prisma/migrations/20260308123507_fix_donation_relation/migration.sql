/*
  Warnings:

  - You are about to drop the `_DonationToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_DonationToUser" DROP CONSTRAINT "_DonationToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_DonationToUser" DROP CONSTRAINT "_DonationToUser_B_fkey";

-- DropTable
DROP TABLE "_DonationToUser";
