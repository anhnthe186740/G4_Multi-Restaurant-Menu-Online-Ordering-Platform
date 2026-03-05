/**
 * seed_tickets.js
 * Thêm 25 Support Tickets mẫu để test phân trang trên Admin Reports.
 * Chạy: node prisma/seed_tickets.js
 *
 * ⚠️  Script này chỉ INSERT thêm, KHÔNG xóa dữ liệu hiện có.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Lấy danh sách owner users có sẵn
  const owners = await prisma.user.findMany({
    where: { role: "RestaurantOwner" },
    select: { userID: true, fullName: true },
  });

  if (owners.length === 0) {
    console.error("❌ Không tìm thấy user nào có role RestaurantOwner. Hãy chạy seed chính trước.");
    process.exit(1);
  }

  console.log(`✅ Tìm thấy ${owners.length} owner(s): ${owners.map(o => o.fullName).join(", ")}`);

  const now = new Date();
  const daysAgo = (n) => new Date(now - n * 24 * 60 * 60 * 1000);

  // 2. Dữ liệu 25 tickets mẫu đa dạng
  const ticketData = [
    // ── HIGH priority ──────────────────────────────░
    { subject: "Không đăng nhập được vào hệ thống", description: "Hệ thống báo lỗi Invalid Token mỗi lần đăng nhập sau 10 phút. Khó chịu lắm.", priority: "High", status: "Open", daysAgo: 1 },
    { subject: "Thanh toán VNPay bị lỗi timeout", description: "Khách thanh toán xong nhưng tiền bị trừ mà đơn vẫn để là Unpaid.", priority: "High", status: "InProgress", daysAgo: 2 },
    { subject: "Mất toàn bộ menu sau khi update", description: "Sau khi tôi ấn lưu cài đặt menu hôm qua thì toàn bộ danh sách món biến mất.", priority: "High", status: "Open", daysAgo: 3 },
    { subject: "Báo cáo doanh thu sai số liệu", description: "Tháng 2/2025 hệ thống báo cáo 15 triệu nhưng thực tế đơn hàng tổng lên đến 22 triệu.", priority: "High", status: "InProgress", daysAgo: 4 },
    { subject: "Không xuất được file Excel báo cáo", description: "Ấn nút Export nhiều lần nhưng không thấy tải về. Trình duyệt Chrome 120.", priority: "High", status: "Open", daysAgo: 5 },
    { subject: "Hệ thống tự động logout sau 5 phút", description: "Session bị hết hạn quá nhanh trong khi đang thao tác gây mất dữ liệu đang nhập.", priority: "High", status: "Resolved", daysAgo: 6 },

    // ── MEDIUM priority ────────────────────────────░
    { subject: "Muốn gia hạn gói dịch vụ 3 tháng", description: "Gói hiện tại hết hạn vào 15/04. Tôi muốn gia hạn thêm 3 tháng với ưu đãi nếu có.", priority: "Medium", status: "Open", daysAgo: 7 },
    { subject: "Không gửi được email xác nhận đơn cho khách", description: "Tính năng gửi email xác nhận sau khi đặt hàng thành công không hoạt động từ tuần trước.", priority: "Medium", status: "InProgress", daysAgo: 8 },
    { subject: "Hình ảnh upload bị nén quá mờ", description: "Ảnh món ăn upload lên hiển thị trên web bị mờ, không sắc nét. Ảnh gốc đẹp nhưng sau khi lưu thì mờ.", priority: "Medium", status: "Open", daysAgo: 9 },
    { subject: "Tính năng QR Order chưa hoạt động ổn", description: "Khi quét QR bàn 05 thì bị redirect sang trang not found. Các bàn khác bình thường.", priority: "Medium", status: "Resolved", daysAgo: 10 },
    { subject: "Thêm tùy chọn thanh toán tiền mặt", description: "Hiện tại chỉ có VNPay và MoMo. Khách thường xuyên muốn trả tiền mặt.", priority: "Medium", status: "Open", daysAgo: 11 },
    { subject: "Lỗi hiển thị giờ mở cửa sai múi giờ", description: "Giờ mở cửa hiển thị trên website sai lệch 7 tiếng vì không đúng múi giờ Việt Nam.", priority: "Medium", status: "InProgress", daysAgo: 12 },
    { subject: "Không thêm được chi nhánh thứ 3", description: "Gói Pro của tôi cho phép 5 chi nhánh nhưng khi tạo chi nhánh thứ 3 thì bị báo vượt giới hạn.", priority: "Medium", status: "Open", daysAgo: 13 },
    { subject: "Đề xuất tính năng thống kê theo nhân viên", description: "Muốn xem từng nhân viên phục vụ bao nhiêu bàn và doanh thu theo ca làm việc.", priority: "Medium", status: "Closed", daysAgo: 14 },
    { subject: "App mobile hiển thị menu bị lỗi font", description: "Trên điện thoại iOS font chữ tiếng Việt bị vỡ, hiển thị ký tự lạ thay vì dấu.", priority: "Medium", status: "Open", daysAgo: 15 },

    // ── LOW priority ───────────────────────────────░
    { subject: "Đề xuất thêm chủ đề Dark Mode", description: "Trang quản lý dùng ban đêm rất chói mắt. Mong hệ thống có thể thêm tùy chọn dark mode.", priority: "Low", status: "Open", daysAgo: 16 },
    { subject: "Muốn đổi mật khẩu nhưng không nhận được email OTP", description: "Ấn quên mật khẩu nhưng email OTP không về hộp thư, đã kiểm tra cả spam.", priority: "Low", status: "Resolved", daysAgo: 17 },
    { subject: "Yêu cầu thêm cột ghi chú trong báo cáo đơn hàng", description: "Khi in báo cáo đơn hàng thiếu cột ghi chú của khách. Thông tin này quan trọng.", priority: "Low", status: "Open", daysAgo: 18 },
    { subject: "Tốc độ tải trang dashboard chậm vào giờ cao điểm", description: "Từ 11h-13h hàng ngày trang quản lý load rất chậm, đôi khi timeout. Internet bình thường.", priority: "Low", status: "InProgress", daysAgo: 19 },
    { subject: "Hỗ trợ in bill nhiều ngôn ngữ", description: "Nhà hàng có nhiều khách nước ngoài, muốn in bill bằng tiếng Anh hoặc tiếng Nhật.", priority: "Low", status: "Open", daysAgo: 20 },
    { subject: "Thêm tính năng lịch sử chỉnh sửa menu", description: "Muốn biết ai và khi nào đã chỉnh sửa giá hoặc tên món để kiểm soát tốt hơn.", priority: "Low", status: "Closed", daysAgo: 21 },
    { subject: "Không tìm thấy phần cài đặt thông báo email", description: "Muốn bật thông báo qua email khi có đơn mới nhưng không biết cài ở đâu.", priority: "Low", status: "Resolved", daysAgo: 22 },
    { subject: "Lỗi font tiếng Việt khi in hóa đơn PDF", description: "Xuất hóa đơn PDF thì tên món bị lỗi encoding, hiện thị chữ hỏi (?) thay vì tiếng Việt.", priority: "Low", status: "Open", daysAgo: 25 },
    { subject: "Đề xuất thêm biểu đồ so sánh tháng này với tháng trước", description: "Dashboard hiện tại chỉ có số tổng, muốn thêm biểu đồ so sánh trend tháng trước.", priority: "Low", status: "Open", daysAgo: 28 },
    { subject: "Hỏi về chính sách hoàn tiền gói dịch vụ", description: "Tôi mới mua gói nhưng muốn nâng cấp lên gói cao hơn, liệu có được hoàn lại phần chênh lệch không?", priority: "Low", status: "Closed", daysAgo: 30 },
  ];

  // 3. Phân phối ticket theo vòng lặp qua owners
  let createdCount = 0;
  for (let i = 0; i < ticketData.length; i++) {
    const t = ticketData[i];
    const owner = owners[i % owners.length];
    const createdAt = daysAgo(t.daysAgo);

    // Tạo message đầu tiên dạng JSON string (giống logic createOwnerTicket)
    const firstMsg = JSON.stringify({ role: "owner", text: t.description, time: createdAt.toISOString() });

    // Nếu đã Resolved hoặc InProgress, thêm reply của Admin
    let resolution = firstMsg;
    if (t.status === "Resolved" || t.status === "InProgress" || t.status === "Closed") {
      const adminReplyTime = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000); // 2h sau
      const adminMsg = JSON.stringify({
        role: "admin",
        text: t.status === "Resolved"
          ? "Chúng tôi đã xử lý xong vấn đề của bạn. Vui lòng kiểm tra lại và phản hồi nếu còn vấn đề."
          : t.status === "Closed"
          ? "Ticket đã được đóng. Cảm ơn bạn đã sử dụng dịch vụ."
          : "Chúng tôi đã ghi nhận vấn đề và đang xem xét. Sẽ phản hồi sớm nhất có thể.",
        time: adminReplyTime.toISOString(),
      });
      resolution = `${resolution}\n${adminMsg}`;
    }

    await prisma.supportTicket.create({
      data: {
        userID: owner.userID,
        subject: t.subject,
        description: t.description,
        priority: t.priority,
        status: t.status,
        resolution,
        createdAt,
      },
    });
    createdCount++;
    process.stdout.write(`\r   Đã tạo ${createdCount}/${ticketData.length} tickets...`);
  }

  console.log(`\n\n✅ Tạo thành công ${createdCount} Support Tickets mẫu!`);
  console.log("🎯 Bây giờ Admin Reports đã có đủ dữ liệu để test phân trang.");

  // 4. Hiển thị thống kê
  const stats = await prisma.supportTicket.groupBy({
    by: ["status"],
    _count: { ticketID: true },
  });
  const total = await prisma.supportTicket.count();
  console.log(`\n📊 Tổng số Tickets trong DB: ${total}`);
  stats.forEach(s => {
    console.log(`   ${s.status}: ${s._count.ticketID}`);
  });
}

main()
  .catch((e) => {
    console.error("❌ Lỗi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
