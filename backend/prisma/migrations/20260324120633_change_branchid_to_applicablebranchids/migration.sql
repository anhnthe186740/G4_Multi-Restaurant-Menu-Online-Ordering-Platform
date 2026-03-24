/*
  Warnings:

  - You are about to drop the column `BranchID` on the `discounts` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `discounts` DROP FOREIGN KEY `Discounts_BranchID_fkey`;

-- AlterTable
ALTER TABLE `discounts` DROP COLUMN `BranchID`,
    ADD COLUMN `ApplicableBranchIDs` VARCHAR(255) NULL;
