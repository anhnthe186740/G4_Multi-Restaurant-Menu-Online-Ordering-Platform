-- AlterTable
ALTER TABLE `orderdetails` ADD COLUMN `TableID` INTEGER NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `Role` ENUM('Admin', 'RestaurantOwner', 'BranchManager', 'Staff', 'Kitchen', 'Customer') NOT NULL;

-- AddForeignKey
ALTER TABLE `OrderDetails` ADD CONSTRAINT `OrderDetails_TableID_fkey` FOREIGN KEY (`TableID`) REFERENCES `Tables`(`TableID`) ON DELETE SET NULL ON UPDATE CASCADE;
