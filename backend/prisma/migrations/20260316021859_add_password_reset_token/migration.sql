-- CreateTable
CREATE TABLE `PasswordResetTokens` (
    `ID` INTEGER NOT NULL AUTO_INCREMENT,
    `UserID` INTEGER NOT NULL,
    `Token` VARCHAR(255) NOT NULL,
    `ExpiresAt` DATETIME(3) NOT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PasswordResetTokens_Token_key`(`Token`),
    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PasswordResetTokens` ADD CONSTRAINT `PasswordResetTokens_UserID_fkey` FOREIGN KEY (`UserID`) REFERENCES `Users`(`UserID`) ON DELETE CASCADE ON UPDATE CASCADE;
