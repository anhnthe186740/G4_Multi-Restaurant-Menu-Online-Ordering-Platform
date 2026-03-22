-- AlterTable
ALTER TABLE `users` ADD COLUMN `RestaurantID` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Users` ADD CONSTRAINT `Users_RestaurantID_fkey` FOREIGN KEY (`RestaurantID`) REFERENCES `Restaurants`(`RestaurantID`) ON DELETE SET NULL ON UPDATE CASCADE;
