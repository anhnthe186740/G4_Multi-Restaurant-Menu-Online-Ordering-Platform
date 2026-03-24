/*
  Warnings:

  - You are about to drop the column `Code` on the `discounts` table. All the data in the column will be lost.
  - Added the required column `Name` to the `Discounts` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Discounts_Code_key` ON `discounts`;

-- AlterTable
ALTER TABLE `discounts` DROP COLUMN `Code`,
    ADD COLUMN `BranchID` INTEGER NULL,
    ADD COLUMN `CreatedByUserID` INTEGER NULL,
    ADD COLUMN `HappyHourEnd` VARCHAR(5) NULL,
    ADD COLUMN `HappyHourStart` VARCHAR(5) NULL,
    ADD COLUMN `MaxDiscountAmount` DECIMAL(15, 2) NULL,
    ADD COLUMN `Name` VARCHAR(100) NOT NULL,
    ADD COLUMN `Priority` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `Status` ENUM('Active', 'PendingApproval', 'Inactive') NOT NULL DEFAULT 'Active',
    ADD COLUMN `UsageLimit` INTEGER NULL,
    ADD COLUMN `UsedCount` INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE `Discounts` ADD CONSTRAINT `Discounts_BranchID_fkey` FOREIGN KEY (`BranchID`) REFERENCES `Branches`(`BranchID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Discounts` ADD CONSTRAINT `Discounts_CreatedByUserID_fkey` FOREIGN KEY (`CreatedByUserID`) REFERENCES `Users`(`UserID`) ON DELETE SET NULL ON UPDATE CASCADE;
