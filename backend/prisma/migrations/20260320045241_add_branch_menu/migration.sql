-- CreateTable
CREATE TABLE `PaymentOrders` (
    `OrderID` INTEGER NOT NULL AUTO_INCREMENT,
    `OrderCode` BIGINT NOT NULL,
    `RestaurantID` INTEGER NOT NULL,
    `PackageID` INTEGER NOT NULL,
    `Amount` INTEGER NOT NULL,
    `Status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    `PayOSPaymentLinkId` VARCHAR(255) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `PaidAt` DATETIME(3) NULL,

    UNIQUE INDEX `PaymentOrders_OrderCode_key`(`OrderCode`),
    PRIMARY KEY (`OrderID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BranchMenus` (
    `BranchMenuID` INTEGER NOT NULL AUTO_INCREMENT,
    `BranchID` INTEGER NOT NULL,
    `ProductID` INTEGER NOT NULL,
    `IsAvailable` BOOLEAN NOT NULL DEFAULT true,
    `Quantity` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `BranchMenus_BranchID_ProductID_key`(`BranchID`, `ProductID`),
    PRIMARY KEY (`BranchMenuID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PaymentOrders` ADD CONSTRAINT `PaymentOrders_RestaurantID_fkey` FOREIGN KEY (`RestaurantID`) REFERENCES `Restaurants`(`RestaurantID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentOrders` ADD CONSTRAINT `PaymentOrders_PackageID_fkey` FOREIGN KEY (`PackageID`) REFERENCES `ServicePackages`(`PackageID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BranchMenus` ADD CONSTRAINT `BranchMenus_BranchID_fkey` FOREIGN KEY (`BranchID`) REFERENCES `Branches`(`BranchID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BranchMenus` ADD CONSTRAINT `BranchMenus_ProductID_fkey` FOREIGN KEY (`ProductID`) REFERENCES `Products`(`ProductID`) ON DELETE CASCADE ON UPDATE CASCADE;
