-- CreateTable
CREATE TABLE `BranchMenu` (
    `BranchMenuID` INTEGER NOT NULL AUTO_INCREMENT,
    `BranchID` INTEGER NOT NULL,
    `ProductID` INTEGER NOT NULL,
    `IsAvailable` BOOLEAN NOT NULL DEFAULT true,
    `Quantity` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `BranchMenu_BranchID_ProductID_key`(`BranchID`, `ProductID`),
    PRIMARY KEY (`BranchMenuID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BranchMenu` ADD CONSTRAINT `BranchMenu_BranchID_fkey` FOREIGN KEY (`BranchID`) REFERENCES `Branches`(`BranchID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BranchMenu` ADD CONSTRAINT `BranchMenu_ProductID_fkey` FOREIGN KEY (`ProductID`) REFERENCES `Products`(`ProductID`) ON DELETE CASCADE ON UPDATE CASCADE;
