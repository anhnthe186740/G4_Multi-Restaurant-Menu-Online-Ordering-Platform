-- AlterTable
ALTER TABLE `users` ADD COLUMN `BranchID` INTEGER NULL,
    MODIFY `Role` ENUM('Admin', 'RestaurantOwner', 'BranchManager', 'Staff', 'Kitchen') NOT NULL;

-- AddForeignKey
ALTER TABLE `Users` ADD CONSTRAINT `Users_BranchID_fkey` FOREIGN KEY (`BranchID`) REFERENCES `Branches`(`BranchID`) ON DELETE SET NULL ON UPDATE CASCADE;
