-- CreateTable
CREATE TABLE `TablePaymentSessions` (
    `ID` INTEGER NOT NULL AUTO_INCREMENT,
    `TableID` INTEGER NOT NULL,
    `OrderCode` BIGINT NOT NULL,
    `Amount` INTEGER NOT NULL,
    `Status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `PayOSLinkId` VARCHAR(255) NULL,
    `QRCode` TEXT NULL,
    `CheckoutUrl` VARCHAR(500) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `PaidAt` DATETIME(3) NULL,

    UNIQUE INDEX `TablePaymentSessions_OrderCode_key`(`OrderCode`),
    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
