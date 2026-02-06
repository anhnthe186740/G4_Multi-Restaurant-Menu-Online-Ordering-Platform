-- Sample data for SupportTickets table
-- Run this after you have Users and Restaurants in your database

USE RMS_System;

-- Insert sample support tickets
INSERT INTO SupportTickets (UserID, Subject, Description, Priority, Status, Resolution, CreatedAt) VALUES
-- Recent tickets from this month
(2, 'Không thể thêm món ăn mới', 'Khi tôi cố gắng thêm món ăn mới vào menu, hệ thống báo lỗi "Cannot save item". Tôi đã thử nhiều lần nhưng vẫn không được.', 'High', 'Open', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),

(3, 'Yêu cầu nâng cấp gói Premium', 'Nhà hàng của tôi muốn nâng cấp từ gói Basic lên Premium để sử dụng thêm tính năng phân tích doanh thu. Vui lòng hỗ trợ.', 'Medium', 'InProgress', '[2026-02-05T10:30:00] Admin: Cảm ơn bạn đã liên hệ. Chúng tôi đang xử lý yêu cầu nâng cấp của bạn. Team sales sẽ liên hệ trong vòng 24h.', DATE_SUB(NOW(), INTERVAL 1 DAY)),

(2, 'Báo cáo thanh toán bị sai số liệu', 'Số liệu trong báo cáo doanh thu ngày 03/02 không khớp với thực tế. Tổng đơn hàng hiển thị 45 nhưng thực tế chỉ có 42 đơn.', 'High', 'InProgress', '[2026-02-05T14:20:00] Admin: Chúng tôi đã ghi nhận vấn đề. Team kỹ thuật đang kiểm tra database và logs. Sẽ cập nhật kết quả sớm nhất.', DATE_SUB(NOW(), INTERVAL 1 DAY)),

(4, 'Hỏi về tính năng đặt bàn online', 'Tôi muốn hỏi gói dịch vụ nào có hỗ trợ tính năng đặt bàn online? Nhà hàng tôi đang dùng gói Standard.', 'Low', 'Resolved', '[2026-02-04T09:15:00] Admin: Tính năng đặt bàn online có sẵn trong gói Premium và Enterprise. Bạn có thể nâng cấp hoặc xem demo tại đây.\n\n[2026-02-04T16:30:00] Admin: Đã gửi email chi tiết về các gói dịch vụ. Vui lòng kiểm tra.', DATE_SUB(NOW(), INTERVAL 3 DAY)),

(3, 'Mã QR của bàn số 5 không hoạt động', 'Khách hàng báo rằng khi quét mã QR tại bàn số 5 thì không vào được menu. Các bàn khác vẫn hoạt động bình thường.', 'Medium', 'Resolved', '[2026-02-03T11:00:00] Admin: Đã kiểm tra và tạo lại mã QR cho bàn số 5. Vui lòng in lại mã QR mới từ trang quản lý bàn.\n\n[2026-02-03T14:00:00] Admin: Confirmed issue resolved.', DATE_SUB(NOW(), INTERVAL 4 DAY)),

-- Older tickets
(2, 'Yêu cầu xuất hóa đơn VAT', 'Nhà hàng tôi cần xuất hóa đơn VAT cho các giao dịch trong tháng 01/2026. Hiện tại tôi chỉ thấy có hóa đơn thường.', 'Medium', 'Resolved', '[2026-02-01T10:00:00] Admin: Tính năng xuất hóa đơn VAT yêu cầu gói Enterprise hoặc add-on riêng. Đã gửi thông tin pricing qua email.\n\n[2026-02-01T15:30:00] Admin: Khách hàng đồng ý thêm add-on. Đã kích hoạt tính năng.', DATE_SUB(NOW(), INTERVAL 6 DAY)),

(4, 'Không nhận được email thông báo đơn hàng', 'Hệ thống không gửi email thông báo khi có đơn hàng mới. Tôi đã kiểm tra cài đặt và email đã đúng.', 'High', 'Open', NULL, DATE_SUB(NOW(), INTERVAL 7 DAY)),

(3, 'Hỏi về báo cáo phân tích khách hàng', 'Tôi muốn biết làm sao để xem báo cáo về thói quen đặt món của khách hàng. Tính năng này có trong gói nào?', 'Low', 'Resolved', '[2026-01-28T14:00:00] Admin: Tính năng Customer Analytics có trong gói Premium và Enterprise. Đã gửi video hướng dẫn sử dụng.', DATE_SUB(NOW(), INTERVAL 10 DAY)),

-- Very old tickets (last month)
(2, 'Yêu cầu tích hợp với POS', 'Nhà hàng tôi đang dùng hệ thống POS riêng. Có thể tích hợp với platform này không?', 'Medium', 'InProgress', '[2026-01-25T10:00:00] Admin: Chúng tôi hỗ trợ API integration cho Enterprise customers. Team technical sẽ liên hệ để thảo luận chi tiết.', DATE_SUB(NOW(), INTERVAL 12 DAY)),

(4, 'Lỗi hiển thị hình ảnh món ăn', 'Một số hình ảnh món ăn không hiển thị đúng trên mobile app. Trên web thì bình thường.', 'Medium', 'Resolved', '[2026-01-22T09:00:00] Admin: Đã xác định lỗi do format ảnh không tối ưu. Đã tự động convert và fix.\n\n[2026-01-22T16:00:00] Admin: Issue resolved. Cleared cache.', DATE_SUB(NOW(), INTERVAL 15 DAY)),

(3, 'Đề xuất thêm tính năng loyalty program', 'Tôi muốn đề xuất thêm tính năng chương trình khách hàng thân thiết (tích điểm, voucher) vào hệ thống.', 'Low', 'Open', NULL, DATE_SUB(NOW(), INTERVAL 18 DAY)),

(2, 'Báo cáo lỗi thanh toán VNPay', 'Khách hàng không thể thanh toán qua VNPay. Mã lỗi 99. Các phương thức khác hoạt động bình thường.', 'High', 'Resolved', '[2026-01-18T08:30:00] Admin: Đã liên hệ với VNPay và xác nhận đây là lỗi tạm thời từ phía gateway.\n\n[2026-01-18T14:00:00] Admin: VNPay đã fix. Đã test và hoạt động bình thường.', DATE_SUB(NOW(), INTERVAL 20 DAY));

-- Verify the data
SELECT 
    TicketID,
    Subject,
    Priority,
    Status,
    CreatedAt
FROM SupportTickets
ORDER BY CreatedAt DESC;

-- Count by status
SELECT Status, COUNT(*) as Count
FROM SupportTickets
GROUP BY Status;

-- Count this month
SELECT COUNT(*) as TotalThisMonth
FROM SupportTickets
WHERE MONTH(CreatedAt) = MONTH(CURRENT_DATE())
  AND YEAR(CreatedAt) = YEAR(CURRENT_DATE());
