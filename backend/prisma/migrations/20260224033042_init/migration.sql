-- CreateTable
CREATE TABLE `Users` (
    `UserID` INTEGER NOT NULL AUTO_INCREMENT,
    `Username` VARCHAR(50) NOT NULL,
    `PasswordHash` VARCHAR(255) NOT NULL,
    `FullName` VARCHAR(100) NULL,
    `Email` VARCHAR(100) NULL,
    `Phone` VARCHAR(20) NULL,
    `Role` ENUM('Admin', 'RestaurantOwner', 'BranchManager', 'Staff') NOT NULL,
    `Status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Users_Username_key`(`Username`),
    UNIQUE INDEX `Users_Email_key`(`Email`),
    PRIMARY KEY (`UserID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServicePackages` (
    `PackageID` INTEGER NOT NULL AUTO_INCREMENT,
    `PackageName` VARCHAR(100) NOT NULL,
    `Price` DECIMAL(15, 2) NOT NULL,
    `Duration` INTEGER NULL,
    `FeaturesDescription` TEXT NULL,
    `IsActive` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`PackageID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Restaurants` (
    `RestaurantID` INTEGER NOT NULL AUTO_INCREMENT,
    `OwnerUserID` INTEGER NULL,
    `Name` VARCHAR(255) NOT NULL,
    `Logo` VARCHAR(255) NULL,
    `Description` TEXT NULL,
    `TaxCode` VARCHAR(50) NULL,
    `Website` VARCHAR(255) NULL,

    PRIMARY KEY (`RestaurantID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RegistrationRequests` (
    `RequestID` INTEGER NOT NULL AUTO_INCREMENT,
    `OwnerName` VARCHAR(100) NULL,
    `ContactInfo` VARCHAR(255) NULL,
    `RestaurantName` VARCHAR(255) NULL,
    `SubmissionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ApprovalStatus` ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    `AdminNote` TEXT NULL,
    `OwnerUserID` INTEGER NULL,
    `RestaurantID` INTEGER NULL,
    `ApprovedBy` INTEGER NULL,
    `ApprovedDate` DATETIME(3) NULL,

    PRIMARY KEY (`RequestID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscriptions` (
    `SubscriptionID` INTEGER NOT NULL AUTO_INCREMENT,
    `RestaurantID` INTEGER NULL,
    `PackageID` INTEGER NULL,
    `StartDate` DATETIME(3) NULL,
    `EndDate` DATETIME(3) NULL,
    `Status` ENUM('Active', 'Expired') NOT NULL DEFAULT 'Active',
    `AutoRenew` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`SubscriptionID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Branches` (
    `BranchID` INTEGER NOT NULL AUTO_INCREMENT,
    `RestaurantID` INTEGER NOT NULL,
    `ManagerUserID` INTEGER NULL,
    `Name` VARCHAR(255) NOT NULL,
    `Address` VARCHAR(255) NULL,
    `Phone` VARCHAR(20) NULL,
    `OpeningHours` VARCHAR(100) NULL,
    `IsActive` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`BranchID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tables` (
    `TableID` INTEGER NOT NULL AUTO_INCREMENT,
    `BranchID` INTEGER NOT NULL,
    `TableName` VARCHAR(50) NULL,
    `Capacity` INTEGER NULL,
    `Status` ENUM('Available', 'Occupied', 'Reserved') NOT NULL DEFAULT 'Available',
    `QRCode` TEXT NULL,

    PRIMARY KEY (`TableID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Categories` (
    `CategoryID` INTEGER NOT NULL AUTO_INCREMENT,
    `RestaurantID` INTEGER NOT NULL,
    `Name` VARCHAR(100) NOT NULL,
    `Description` TEXT NULL,
    `DisplayOrder` INTEGER NULL,

    PRIMARY KEY (`CategoryID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Products` (
    `ProductID` INTEGER NOT NULL AUTO_INCREMENT,
    `CategoryID` INTEGER NOT NULL,
    `Name` VARCHAR(255) NOT NULL,
    `Description` TEXT NULL,
    `Price` DECIMAL(15, 2) NOT NULL,
    `ImageURL` VARCHAR(255) NULL,
    `Status` ENUM('Available', 'OutOfStock') NOT NULL DEFAULT 'Available',

    PRIMARY KEY (`ProductID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Orders` (
    `OrderID` INTEGER NOT NULL AUTO_INCREMENT,
    `BranchID` INTEGER NOT NULL,
    `CreatedBy` INTEGER NULL,
    `OrderTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `TotalAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `OrderStatus` ENUM('Open', 'Serving', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Open',
    `PaymentStatus` ENUM('Unpaid', 'Paid') NOT NULL DEFAULT 'Unpaid',
    `CustomerNote` TEXT NULL,

    PRIMARY KEY (`OrderID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderTables` (
    `OrderID` INTEGER NOT NULL,
    `TableID` INTEGER NOT NULL,

    PRIMARY KEY (`OrderID`, `TableID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderDetails` (
    `OrderDetailID` INTEGER NOT NULL AUTO_INCREMENT,
    `OrderID` INTEGER NULL,
    `ProductID` INTEGER NULL,
    `Quantity` INTEGER NOT NULL,
    `UnitPrice` DECIMAL(15, 2) NOT NULL,
    `Note` TEXT NULL,
    `ItemStatus` ENUM('Pending', 'Cooking', 'Ready', 'Served', 'Cancelled') NOT NULL DEFAULT 'Pending',

    PRIMARY KEY (`OrderDetailID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Discounts` (
    `DiscountID` INTEGER NOT NULL AUTO_INCREMENT,
    `RestaurantID` INTEGER NULL,
    `Code` VARCHAR(50) NOT NULL,
    `DiscountType` ENUM('Percentage', 'FixedAmount') NOT NULL,
    `Value` DECIMAL(15, 2) NOT NULL,
    `MinOrderValue` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `StartDate` DATETIME(3) NULL,
    `EndDate` DATETIME(3) NULL,

    UNIQUE INDEX `Discounts_Code_key`(`Code`),
    PRIMARY KEY (`DiscountID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoices` (
    `InvoiceID` INTEGER NOT NULL AUTO_INCREMENT,
    `OrderID` INTEGER NULL,
    `DiscountID` INTEGER NULL,
    `IssuedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `Status` ENUM('Open', 'Closed', 'Issued') NOT NULL DEFAULT 'Open',
    `SubTotal` DECIMAL(15, 2) NOT NULL,
    `DiscountAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `TotalAmount` DECIMAL(15, 2) NOT NULL,
    `CustomerTaxName` VARCHAR(255) NULL,
    `CustomerTaxCode` VARCHAR(50) NULL,
    `InvoiceFileURL` VARCHAR(255) NULL,

    UNIQUE INDEX `Invoices_OrderID_key`(`OrderID`),
    PRIMARY KEY (`InvoiceID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvoiceDetails` (
    `InvoiceDetailID` INTEGER NOT NULL AUTO_INCREMENT,
    `InvoiceID` INTEGER NULL,
    `OrderDetailID` INTEGER NULL,
    `ProductID` INTEGER NULL,
    `Quantity` INTEGER NULL,
    `UnitPrice` DECIMAL(15, 2) NULL,
    `TotalPrice` DECIMAL(15, 2) NULL,
    `Status` ENUM('Open', 'Finalized') NOT NULL DEFAULT 'Open',

    PRIMARY KEY (`InvoiceDetailID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transactions` (
    `TransactionID` INTEGER NOT NULL AUTO_INCREMENT,
    `InvoiceID` INTEGER NULL,
    `PaymentGatewayRef` VARCHAR(255) NULL,
    `Amount` DECIMAL(15, 2) NOT NULL,
    `PaymentMethod` ENUM('Cash', 'BankTransfer', 'E-Wallet') NOT NULL,
    `Status` ENUM('Success', 'Failed') NOT NULL DEFAULT 'Success',
    `TransactionTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`TransactionID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceRequests` (
    `RequestID` INTEGER NOT NULL AUTO_INCREMENT,
    `BranchID` INTEGER NULL,
    `TableID` INTEGER NULL,
    `RequestType` ENUM('Gọi món', 'Gọi nước', 'Thanh toán', 'Khác') NOT NULL,
    `Status` VARCHAR(50) NULL,
    `CreatedTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`RequestID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupportTickets` (
    `TicketID` INTEGER NOT NULL AUTO_INCREMENT,
    `UserID` INTEGER NULL,
    `Subject` VARCHAR(255) NULL,
    `Description` TEXT NULL,
    `Priority` ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
    `Status` VARCHAR(50) NULL,
    `Resolution` TEXT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`TicketID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Restaurants` ADD CONSTRAINT `Restaurants_OwnerUserID_fkey` FOREIGN KEY (`OwnerUserID`) REFERENCES `Users`(`UserID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RegistrationRequests` ADD CONSTRAINT `RegistrationRequests_OwnerUserID_fkey` FOREIGN KEY (`OwnerUserID`) REFERENCES `Users`(`UserID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RegistrationRequests` ADD CONSTRAINT `RegistrationRequests_RestaurantID_fkey` FOREIGN KEY (`RestaurantID`) REFERENCES `Restaurants`(`RestaurantID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RegistrationRequests` ADD CONSTRAINT `RegistrationRequests_ApprovedBy_fkey` FOREIGN KEY (`ApprovedBy`) REFERENCES `Users`(`UserID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscriptions` ADD CONSTRAINT `Subscriptions_RestaurantID_fkey` FOREIGN KEY (`RestaurantID`) REFERENCES `Restaurants`(`RestaurantID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscriptions` ADD CONSTRAINT `Subscriptions_PackageID_fkey` FOREIGN KEY (`PackageID`) REFERENCES `ServicePackages`(`PackageID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Branches` ADD CONSTRAINT `Branches_RestaurantID_fkey` FOREIGN KEY (`RestaurantID`) REFERENCES `Restaurants`(`RestaurantID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Branches` ADD CONSTRAINT `Branches_ManagerUserID_fkey` FOREIGN KEY (`ManagerUserID`) REFERENCES `Users`(`UserID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tables` ADD CONSTRAINT `Tables_BranchID_fkey` FOREIGN KEY (`BranchID`) REFERENCES `Branches`(`BranchID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Categories` ADD CONSTRAINT `Categories_RestaurantID_fkey` FOREIGN KEY (`RestaurantID`) REFERENCES `Restaurants`(`RestaurantID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Products` ADD CONSTRAINT `Products_CategoryID_fkey` FOREIGN KEY (`CategoryID`) REFERENCES `Categories`(`CategoryID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Orders` ADD CONSTRAINT `Orders_BranchID_fkey` FOREIGN KEY (`BranchID`) REFERENCES `Branches`(`BranchID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Orders` ADD CONSTRAINT `Orders_CreatedBy_fkey` FOREIGN KEY (`CreatedBy`) REFERENCES `Users`(`UserID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderTables` ADD CONSTRAINT `OrderTables_OrderID_fkey` FOREIGN KEY (`OrderID`) REFERENCES `Orders`(`OrderID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderTables` ADD CONSTRAINT `OrderTables_TableID_fkey` FOREIGN KEY (`TableID`) REFERENCES `Tables`(`TableID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderDetails` ADD CONSTRAINT `OrderDetails_OrderID_fkey` FOREIGN KEY (`OrderID`) REFERENCES `Orders`(`OrderID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderDetails` ADD CONSTRAINT `OrderDetails_ProductID_fkey` FOREIGN KEY (`ProductID`) REFERENCES `Products`(`ProductID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Discounts` ADD CONSTRAINT `Discounts_RestaurantID_fkey` FOREIGN KEY (`RestaurantID`) REFERENCES `Restaurants`(`RestaurantID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoices` ADD CONSTRAINT `Invoices_OrderID_fkey` FOREIGN KEY (`OrderID`) REFERENCES `Orders`(`OrderID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoices` ADD CONSTRAINT `Invoices_DiscountID_fkey` FOREIGN KEY (`DiscountID`) REFERENCES `Discounts`(`DiscountID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceDetails` ADD CONSTRAINT `InvoiceDetails_InvoiceID_fkey` FOREIGN KEY (`InvoiceID`) REFERENCES `Invoices`(`InvoiceID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceDetails` ADD CONSTRAINT `InvoiceDetails_OrderDetailID_fkey` FOREIGN KEY (`OrderDetailID`) REFERENCES `OrderDetails`(`OrderDetailID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceDetails` ADD CONSTRAINT `InvoiceDetails_ProductID_fkey` FOREIGN KEY (`ProductID`) REFERENCES `Products`(`ProductID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transactions` ADD CONSTRAINT `Transactions_InvoiceID_fkey` FOREIGN KEY (`InvoiceID`) REFERENCES `Invoices`(`InvoiceID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceRequests` ADD CONSTRAINT `ServiceRequests_BranchID_fkey` FOREIGN KEY (`BranchID`) REFERENCES `Branches`(`BranchID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceRequests` ADD CONSTRAINT `ServiceRequests_TableID_fkey` FOREIGN KEY (`TableID`) REFERENCES `Tables`(`TableID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportTickets` ADD CONSTRAINT `SupportTickets_UserID_fkey` FOREIGN KEY (`UserID`) REFERENCES `Users`(`UserID`) ON DELETE SET NULL ON UPDATE CASCADE;
