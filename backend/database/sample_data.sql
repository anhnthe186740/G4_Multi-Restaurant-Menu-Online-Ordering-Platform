-- Sample data for testing Platform Admin Dashboard

-- 1. Insert sample service packages (Simplified Model)
-- Duration is in Months
INSERT INTO ServicePackages (PackageName, Price, Duration, Description, IsActive) VALUES
('Gói 1 Tháng', 199000, 1, 'Gói trải nghiệm ngắn hạn', TRUE),
('Gói 3 Tháng', 499000, 3, 'Tiết kiệm 15%', TRUE),
('Gói 6 Tháng', 899000, 6, 'Tiết kiệm 25%', TRUE),
('Gói 1 Năm', 1599000, 12, 'Gói phổ biến nhất - Tiết kiệm 33%', TRUE);

-- 2. Insert sample admin user
INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone, Role, Status) VALUES
('admin', '$2b$10$xyz...', 'Platform Administrator', 'admin@rms.com', '0901234567', 'Admin', 'Active');

-- 3. Insert sample restaurant owners
INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone, Role, Status) VALUES
('owner1', '$2b$10$xyz...', 'Nguyen Van A', 'owner1@example.com', '0912345678', 'RestaurantOwner', 'Active'),
('owner2', '$2b$10$xyz...', 'Tran Thi B', 'owner2@example.com', '0923456789', 'RestaurantOwner', 'Active'),
('owner3', '$2b$10$xyz...', 'Le Van C', 'owner3@example.com', '0934567890', 'RestaurantOwner', 'Inactive');

-- 4. Insert sample restaurants
INSERT INTO Restaurants (OwnerUserID, Name, Logo, Description, TaxCode) VALUES
(2, 'Phở Hà Nội', '/logos/pho-hanoi.png', 'Phở truyền thống Hà Nội', '0123456789'),
(3, 'Sushi Tokyo', '/logos/sushi-tokyo.png', 'Nhà hàng Nhật Bản cao cấp', '0123456790'),
(4, 'Pizza Italia', '/logos/pizza-italia.png', 'Pizza Ý chính gốc', '0123456791');

-- 5. Insert sample subscriptions
-- PackageID now refers to the new IDs (1: 1 Month, 2: 3 Months, 3: 6 Months, 4: 1 Year)
INSERT INTO Subscriptions (RestaurantID, PackageID, StartDate, EndDate, Status, AutoRenew) VALUES
(1, 2, '2026-01-01', '2026-03-31', 'Active', TRUE),
(2, 4, '2025-02-15', '2026-02-15', 'Active', FALSE),
(3, 1, '2026-01-20', '2026-02-20', 'Active', TRUE);

-- More subscriptions for revenue chart (past months)
INSERT INTO Subscriptions (RestaurantID, PackageID, StartDate, EndDate, Status, AutoRenew) VALUES
(1, 1, '2025-09-01', '2025-10-01', 'Expired', FALSE),
(2, 1, '2025-10-01', '2025-11-01', 'Expired', FALSE),
(1, 1, '2025-11-01', '2025-12-01', 'Expired', FALSE),
(3, 1, '2025-12-01', '2026-01-01', 'Expired', FALSE);

-- 6. Insert pending registration requests
INSERT INTO RegistrationRequests (OwnerName, ContactInfo, RestaurantName, ApprovalStatus, AdminNote) VALUES
('Pham Van D', 'phamvand@gmail.com / 0945678901', 'Bún Bò Huế Chính Gốc', 'Pending', NULL),
('Hoang Thi E', 'hoangthi@gmail.com / 0956789012', 'Cafe Saigon', 'Pending', NULL),
('Nguyen Van F', 'nguyenvanf@gmail.com / 0967890123', 'Bánh Mì Sài Gòn', 'Pending', NULL);

-- 7. Insert sample support tickets
INSERT INTO SupportTickets (UserID, Subject, Description, Priority, Status) VALUES
(2, 'Lỗi thanh toán gói dịch vụ', 'Không thể thanh toán qua VNPay', 'High', 'Open'),
(3, 'Yêu cầu nâng cấp gói', 'Muốn nâng cấp lên gói 1 Năm', 'Medium', 'InProgress'),
(4, 'Câu hỏi về tính năng QR code', 'Cách tạo QR code cho bàn ăn', 'Low', 'Open');

-- 8. Insert more subscriptions expiring soon for testing
INSERT INTO Subscriptions (RestaurantID, PackageID, StartDate, EndDate, Status, AutoRenew) VALUES
(1, 1, DATE_SUB(CURRENT_DATE(), INTERVAL 25 DAY), DATE_ADD(CURRENT_DATE(), INTERVAL 5 DAY), 'Active', FALSE),
(2, 2, DATE_SUB(CURRENT_DATE(), INTERVAL 80 DAY), DATE_ADD(CURRENT_DATE(), INTERVAL 10 DAY), 'Active', TRUE);
