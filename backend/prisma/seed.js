/**
 * Prisma Seed Script
 * Run: node prisma/seed.js
 *
 * Tạo dữ liệu mẫu cho toàn bộ hệ thống:
 * - 1 Admin
 * - 3 RestaurantOwner + 3 Restaurants
 * - 3 Service Packages + Subscriptions
 * - Branches, Tables, Categories, Products
 * - RegistrationRequests, SupportTickets
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu seed dữ liệu...\n");

  // =============================================
  // 0. CLEAN UP (xóa theo thứ tự FK)
  // =============================================
  await prisma.transaction.deleteMany();
  await prisma.invoiceDetail.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.orderDetail.deleteMany();
  await prisma.orderTable.deleteMany();
  await prisma.order.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.registrationRequest.deleteMany();
  await prisma.table.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.servicePackage.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Đã xóa dữ liệu cũ\n");

  // =============================================
  // 1. SERVICE PACKAGES
  // =============================================
  const [pkgBasic, pkgPro, pkgEnterprise] = await Promise.all([
    prisma.servicePackage.create({
      data: {
        packageName: "Gói Cơ Bản",
        price: 299000,
        duration: 1,
        featuresDescription: "1 chi nhánh, 50 món, báo cáo cơ bản",
        isActive: true,
      },
    }),
    prisma.servicePackage.create({
      data: {
        packageName: "Gói Chuyên Nghiệp",
        price: 699000,
        duration: 1,
        featuresDescription: "5 chi nhánh, không giới hạn món, báo cáo nâng cao, QR Order",
        isActive: true,
      },
    }),
    prisma.servicePackage.create({
      data: {
        packageName: "Gói Doanh Nghiệp",
        price: 1499000,
        duration: 1,
        featuresDescription: "Không giới hạn chi nhánh, API tích hợp, hỗ trợ 24/7, xuất hóa đơn VAT",
        isActive: true,
      },
    }),
  ]);
  console.log("✅ Tạo 3 Service Packages");

  // =============================================
  // 2. USERS
  // =============================================
  const hashPw = (pw) => bcrypt.hash(pw, 10);

  const [admin, owner1, owner2, owner3, manager1, staff1] = await Promise.all([
    prisma.user.create({
      data: {
        username: "admin",
        passwordHash: await hashPw("Admin@123"),
        fullName: "Quản trị viên",
        email: "admin@rms.vn",
        phone: "0900000001",
        role: "Admin",
        status: "Active",
      },
    }),
    prisma.user.create({
      data: {
        username: "owner_phogamenu",
        passwordHash: await hashPw("Owner@123"),
        fullName: "Nguyễn Văn Phở",
        email: "owner1@phogamenu.vn",
        phone: "0911111111",
        role: "RestaurantOwner",
        status: "Active",
      },
    }),
    prisma.user.create({
      data: {
        username: "owner_banhmi",
        passwordHash: await hashPw("Owner@123"),
        fullName: "Trần Thị Bánh Mì",
        email: "owner2@banhmi.vn",
        phone: "0922222222",
        role: "RestaurantOwner",
        status: "Active",
      },
    }),
    prisma.user.create({
      data: {
        username: "owner_bbq",
        passwordHash: await hashPw("Owner@123"),
        fullName: "Lê Văn BBQ",
        email: "owner3@bbqhouse.vn",
        phone: "0933333333",
        role: "RestaurantOwner",
        status: "Active",
      },
    }),
    prisma.user.create({
      data: {
        username: "manager_q1",
        passwordHash: await hashPw("Manager@123"),
        fullName: "Phạm Thị Quản Lý",
        email: "manager1@rms.vn",
        phone: "0944444444",
        role: "BranchManager",
        status: "Active",
      },
    }),
    prisma.user.create({
      data: {
        username: "staff_cashier",
        passwordHash: await hashPw("Staff@123"),
        fullName: "Hoàng Văn Thu Ngân",
        email: "staff1@rms.vn",
        phone: "0955555555",
        role: "Staff",
        status: "Active",
      },
    }),
  ]);
  console.log("✅ Tạo 6 Users (1 Admin, 3 Owner, 1 Manager, 1 Staff)");

  // =============================================
  // 3. RESTAURANTS
  // =============================================
  const [rest1, rest2, rest3] = await Promise.all([
    prisma.restaurant.create({
      data: {
        ownerUserID: owner1.userID,
        name: "Phở Gà Menu",
        description: "Chuỗi phở gà nổi tiếng Hà Nội, phục vụ từ 1990",
        taxCode: "0123456789",
        website: "https://phogamenu.vn",
      },
    }),
    prisma.restaurant.create({
      data: {
        ownerUserID: owner2.userID,
        name: "Bánh Mì Sài Gòn",
        description: "Bánh mì truyền thống Sài Gòn, 30 loại nhân",
        taxCode: "0987654321",
        website: "https://banhmi.vn",
      },
    }),
    prisma.restaurant.create({
      data: {
        ownerUserID: owner3.userID,
        name: "BBQ House Hà Nội",
        description: "Nhà hàng nướng Hàn Quốc phong cách hiện đại",
        taxCode: "1122334455",
        website: "https://bbqhouse.vn",
      },
    }),
  ]);
  console.log("✅ Tạo 3 Restaurants");

  // =============================================
  // 4. SUBSCRIPTIONS
  // =============================================
  const now = new Date();
  const nextMonth = new Date(now); nextMonth.setMonth(nextMonth.getMonth() + 1);
  const next3Month = new Date(now); next3Month.setMonth(next3Month.getMonth() + 3);

  await Promise.all([
    prisma.subscription.create({
      data: {
        restaurantID: rest1.restaurantID,
        packageID: pkgEnterprise.packageID,
        startDate: now,
        endDate: next3Month,
        status: "Active",
        autoRenew: true,
      },
    }),
    prisma.subscription.create({
      data: {
        restaurantID: rest2.restaurantID,
        packageID: pkgPro.packageID,
        startDate: now,
        endDate: nextMonth,
        status: "Active",
        autoRenew: false,
      },
    }),
    prisma.subscription.create({
      data: {
        restaurantID: rest3.restaurantID,
        packageID: pkgBasic.packageID,
        startDate: now,
        endDate: nextMonth,
        status: "Active",
        autoRenew: false,
      },
    }),
  ]);
  console.log("✅ Tạo 3 Subscriptions");

  // =============================================
  // 5. BRANCHES & TABLES
  // =============================================

  // Helper: tạo chuỗi JSON openingHours
  const mkHours = (email, mon_fri, sat, sun) =>
    JSON.stringify({ email, mon_fri, sat, sun });

  const branch1 = await prisma.branch.create({
    data: {
      restaurantID: rest1.restaurantID,
      managerUserID: manager1.userID,
      name: "Phở Gà Menu - Chi nhánh Hoàn Kiếm",
      address: "15 Hàng Bạc, Hoàn Kiếm, Hà Nội",
      phone: "024 1111 1111",
      openingHours: mkHours("hoankiemq1@phogamenu.vn", "06:00-22:00", "06:00-22:30", "07:00-21:00"),
      isActive: true,
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      restaurantID: rest1.restaurantID,
      name: "Phở Gà Menu - Chi nhánh Đống Đa",
      address: "88 Tây Sơn, Đống Đa, Hà Nội",
      phone: "024 2222 2222",
      openingHours: mkHours("dongda@phogamenu.vn", "06:00-22:00", "06:00-23:00", "07:00-22:00"),
      isActive: true,
    },
  });

  const branch4 = await prisma.branch.create({
    data: {
      restaurantID: rest1.restaurantID,
      name: "Phở Gà Menu - Chi nhánh Cầu Giấy",
      address: "201 Xuân Thủy, Cầu Giấy, Hà Nội",
      phone: "024 3333 4444",
      openingHours: mkHours("caugiay@phogamenu.vn", "06:30-22:00", "06:30-22:30", "07:00-21:30"),
      isActive: true,
    },
  });

  const branch5 = await prisma.branch.create({
    data: {
      restaurantID: rest1.restaurantID,
      name: "Phở Gà Menu - Chi nhánh Bắc Từ Liêm",
      address: "45 Phạm Văn Đồng, Bắc Từ Liêm, Hà Nội",
      phone: "024 5566 7788",
      openingHours: mkHours("bactuliem@phogamenu.vn", "07:00-21:30", "07:00-22:00", "07:30-21:00"),
      isActive: false,
    },
  });

  const branch3 = await prisma.branch.create({
    data: {
      restaurantID: rest2.restaurantID,
      name: "Bánh Mì Sài Gòn - Quận 1",
      address: "123 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
      phone: "028 1234 5678",
      openingHours: mkHours("quan1@banhmi.vn", "07:00-21:00", "07:00-21:30", "08:00-20:00"),
      isActive: true,
    },
  });

  const branch6 = await prisma.branch.create({
    data: {
      restaurantID: rest3.restaurantID,
      name: "BBQ House - Chi nhánh Hoàng Mai",
      address: "99 Trần Điền, Hoàng Mai, Hà Nội",
      phone: "024 9988 7766",
      openingHours: mkHours("hoangmai@bbqhouse.vn", "10:00-22:30", "10:00-23:00", "10:00-22:00"),
      isActive: true,
    },
  });

  // Tạo bàn cho các chi nhánh
  await prisma.table.createMany({
    data: [
      // branch1 – Hoàn Kiếm (5 bàn)
      { branchID: branch1.branchID, tableName: "Bàn 01", capacity: 2, status: "Available" },
      { branchID: branch1.branchID, tableName: "Bàn 02", capacity: 4, status: "Available" },
      { branchID: branch1.branchID, tableName: "Bàn 03", capacity: 4, status: "Occupied" },
      { branchID: branch1.branchID, tableName: "Bàn 04", capacity: 6, status: "Available" },
      { branchID: branch1.branchID, tableName: "Bàn 05", capacity: 8, status: "Available" },
      // branch2 – Đống Đa (4 bàn)
      { branchID: branch2.branchID, tableName: "Bàn 01", capacity: 4, status: "Available" },
      { branchID: branch2.branchID, tableName: "Bàn 02", capacity: 4, status: "Available" },
      { branchID: branch2.branchID, tableName: "Bàn 03", capacity: 6, status: "Available" },
      { branchID: branch2.branchID, tableName: "Bàn VIP 01", capacity: 10, status: "Available" },
      // branch4 – Cầu Giấy (3 bàn)
      { branchID: branch4.branchID, tableName: "Bàn 01", capacity: 2, status: "Available" },
      { branchID: branch4.branchID, tableName: "Bàn 02", capacity: 4, status: "Occupied" },
      { branchID: branch4.branchID, tableName: "Bàn 03", capacity: 4, status: "Available" },
      // branch5 – Bắc Từ Liêm (2 bàn, tạm dừng)
      { branchID: branch5.branchID, tableName: "Bàn 01", capacity: 4, status: "Available" },
      { branchID: branch5.branchID, tableName: "Bàn 02", capacity: 4, status: "Available" },
      // branch3 – Bánh Mì Q1 (3 bàn)
      { branchID: branch3.branchID, tableName: "Bàn 01", capacity: 2, status: "Available" },
      { branchID: branch3.branchID, tableName: "Bàn 02", capacity: 2, status: "Available" },
      { branchID: branch3.branchID, tableName: "Bàn 03", capacity: 6, status: "Available" },
      // branch6 – BBQ Hoàng Mai (4 bàn)
      { branchID: branch6.branchID, tableName: "Bàn A1", capacity: 4, status: "Available" },
      { branchID: branch6.branchID, tableName: "Bàn A2", capacity: 4, status: "Occupied" },
      { branchID: branch6.branchID, tableName: "Bàn B1", capacity: 6, status: "Available" },
      { branchID: branch6.branchID, tableName: "Bàn VIP", capacity: 10, status: "Available" },
    ],
  });
  console.log("✅ Tạo 6 Branches + 21 Tables");


  // =============================================
  // 6. CATEGORIES & PRODUCTS
  // =============================================
  const [catPho, catDrink, catSide] = await Promise.all([
    prisma.category.create({ data: { restaurantID: rest1.restaurantID, name: "Phở", displayOrder: 1 } }),
    prisma.category.create({ data: { restaurantID: rest1.restaurantID, name: "Đồ uống", displayOrder: 2 } }),
    prisma.category.create({ data: { restaurantID: rest1.restaurantID, name: "Ăn kèm", displayOrder: 3 } }),
  ]);

  await prisma.product.createMany({
    data: [
      { categoryID: catPho.categoryID, name: "Phở tái", price: 65000, status: "Available", description: "Phở bò tái truyền thống" },
      { categoryID: catPho.categoryID, name: "Phở chín", price: 65000, status: "Available", description: "Phở bò chín mềm" },
      { categoryID: catPho.categoryID, name: "Phở gà", price: 60000, status: "Available", description: "Phở gà ta nước trong" },
      { categoryID: catPho.categoryID, name: "Phở đặc biệt", price: 85000, status: "Available", description: "Tổng hợp tái, nạm, gầu, gân" },
      { categoryID: catDrink.categoryID, name: "Trà đá", price: 10000, status: "Available" },
      { categoryID: catDrink.categoryID, name: "Nước ngọt Pepsi", price: 20000, status: "Available" },
      { categoryID: catDrink.categoryID, name: "Bia Hà Nội", price: 30000, status: "Available" },
      { categoryID: catSide.categoryID, name: "Quẩy", price: 10000, status: "Available" },
      { categoryID: catSide.categoryID, name: "Trứng luộc", price: 15000, status: "Available" },
      { categoryID: catSide.categoryID, name: "Giò lụa", price: 25000, status: "Available" },
    ],
  });

  // Categories & Products cho rest2
  const catBanhMi = await prisma.category.create({
    data: { restaurantID: rest2.restaurantID, name: "Bánh mì", displayOrder: 1 },
  });
  await prisma.product.createMany({
    data: [
      { categoryID: catBanhMi.categoryID, name: "Bánh mì thịt nguội", price: 35000, status: "Available" },
      { categoryID: catBanhMi.categoryID, name: "Bánh mì pate", price: 30000, status: "Available" },
      { categoryID: catBanhMi.categoryID, name: "Bánh mì xíu mại", price: 40000, status: "Available" },
      { categoryID: catBanhMi.categoryID, name: "Bánh mì bơ sữa", price: 25000, status: "Available" },
    ],
  });
  console.log("✅ Tạo Categories + 14 Products");

  // =============================================
  // 7. DISCOUNTS
  // =============================================
  await prisma.discount.createMany({
    data: [
      {
        restaurantID: rest1.restaurantID,
        name: "Giảm 10% Khách mới",
        discountType: "Percentage",
        value: 10,
        minOrderValue: 100000,
        startDate: now,
        endDate: next3Month,
        status: "Active",
        priority: 1
      },
      {
        restaurantID: rest1.restaurantID,
        name: "Giảm thẳng 50k",
        discountType: "FixedAmount",
        value: 50000,
        minOrderValue: 200000,
        startDate: now,
        endDate: next3Month,
        status: "Active",
        priority: 1
      },
    ],
  });
  console.log("✅ Tạo 2 Discounts");

  // =============================================
  // 8. REGISTRATION REQUESTS
  // =============================================
  await prisma.registrationRequest.createMany({
    data: [
      // ── Pending ──────────────────────────────────────────────────
      {
        ownerName: "Nguyễn Văn A",
        contactInfo: "nguyenvana@gmail.com | 0901234567",
        restaurantName: "The Burger Joint",
        approvalStatus: "Pending",
        submissionDate: new Date("2023-10-10"),
      },
      {
        ownerName: "Trần Thị B",
        contactInfo: "tranthib@gmail.com | 0912345678",
        restaurantName: "Phở Gia Truyền",
        approvalStatus: "Pending",
        submissionDate: new Date("2023-10-10"),
      },
      {
        ownerName: "Lê Văn C",
        contactInfo: "levanc@gmail.com | 0923456789",
        restaurantName: "Pizza Home",
        approvalStatus: "Pending",
        submissionDate: new Date("2023-10-09"),
      },
      {
        ownerName: "Phạm Minh D",
        contactInfo: "phaminh@hotmail.com | 0934567890",
        restaurantName: "Sushi World",
        approvalStatus: "Pending",
        submissionDate: new Date("2023-10-08"),
      },
      {
        ownerName: "Đinh Văn Lẩu",
        contactInfo: "lau@hotpot.vn | 0966666666",
        restaurantName: "Lẩu Thái Sài Gòn",
        approvalStatus: "Pending",
        submissionDate: new Date("2023-10-07"),
      },
      {
        ownerName: "Vũ Thị Cơm Tấm",
        contactInfo: "comtam@saigon.vn | 0977777777",
        restaurantName: "Cơm Tấm Bà Bảy",
        approvalStatus: "Pending",
        submissionDate: new Date("2023-10-06"),
      },
      // ── Approved ─────────────────────────────────────────────────
      {
        ownerName: "Bùi Văn Dimsum",
        contactInfo: "dimsum@yumcha.vn | 0988888888",
        restaurantName: "Dimsum Yum Cha Palace",
        approvalStatus: "Approved",
        ownerUserID: owner1.userID,
        restaurantID: rest1.restaurantID,
        approvedBy: admin.userID,
        approvedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        submissionDate: new Date("2023-10-01"),
      },
      {
        ownerName: "Ngô Thị Loan",
        contactInfo: "ntloan@bbqvn.vn | 0965432100",
        restaurantName: "BBQ Garden Ha Noi",
        approvalStatus: "Approved",
        approvedBy: admin.userID,
        approvedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        submissionDate: new Date("2023-09-25"),
      },
      // ── Rejected ─────────────────────────────────────────────────
      {
        ownerName: "Bùi Thanh Hải",
        contactInfo: "haisantuoi@gmail.com | 0945678901",
        restaurantName: "Hải Sản Tươi Sống",
        approvalStatus: "Rejected",
        adminNote: "Thiếu giấy phép kinh doanh. Vui lòng bổ sung và gửi lại.",
        approvedBy: admin.userID,
        approvedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        submissionDate: new Date("2023-10-03"),
      },
    ],
  });
  console.log("✅ Tạo 9 Registration Requests (6 Pending, 2 Approved, 1 Rejected)");


  // =============================================
  // 9. SUPPORT TICKETS
  // =============================================
  await prisma.supportTicket.createMany({
    data: [
      {
        userID: owner1.userID,
        subject: "Không in được hóa đơn VAT",
        description: "Tôi không thể xuất hóa đơn VAT cho khách hàng doanh nghiệp. Hệ thống báo lỗi khi in.",
        priority: "High",
        status: "Open",
      },
      {
        userID: owner2.userID,
        subject: "Muốn nâng cấp gói dịch vụ",
        description: "Tôi muốn nâng từ Gói Chuyên Nghiệp lên Gói Doanh Nghiệp, tư vấn giúp tôi.",
        priority: "Medium",
        status: "InProgress",
        resolution: `[${now.toISOString()}] Admin: Chúng tôi sẽ liên hệ lại trong vòng 24h để tư vấn chi tiết.`,
      },
      {
        userID: owner3.userID,
        subject: "QR Code bàn không hoạt động",
        description: "QR Code của bàn 03 không redirect đúng về trang order. Khách quét vào thì bị lỗi 404.",
        priority: "High",
        status: "Resolved",
        resolution: `[${now.toISOString()}] Admin: Đã reset QR Code. Vui lòng tạo lại QR Code mới trong phần quản lý bàn.`,
      },
      {
        userID: owner1.userID,
        subject: "Thêm tính năng đặt bàn online",
        description: "Đề xuất thêm tính năng cho khách đặt bàn trước qua website.",
        priority: "Low",
        status: "Open",
      },
    ],
  });
  console.log("✅ Tạo 4 Support Tickets");

  // =============================================
  // 10. ORDERS — 90 ngày dữ liệu thực tế
  // =============================================
  const products = await prisma.product.findMany({
    where: { category: { restaurantID: rest1.restaurantID } },
    select: { productID: true, price: true },
  });

  // Tạo date dựa vào số ngày trước + giờ + phút
  const mkDate = (daysAgo, hour, minute = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  // Map sản phẩm theo chỉ số để dễ dùng
  const p = products; // alias ngắn gọn

  // Helper: tạo order mẫu
  const mkOrder = (branchID, daysAgo, hour, items) => ({
    branchID, daysAgo, hour, items,
  });

  // Tạo mảng orderSamples trải rộng 90 ngày
  // Branch 1 (Hoàn Kiếm) — chi nhánh chính, doanh thu cao nhất
  // Branch 2 (Đống Đa) — trung bình
  // Branch 4 (Cầu Giấy) — thấp hơn
  const orderSamples = [];

  // Hàm sinh orders ngẫu nhiên theo ngày
  const addOrdersForDay = (branchID, daysAgo, count, baseItems) => {
    const peakHours = [7, 8, 11, 12, 13, 18, 19, 20];
    for (let i = 0; i < count; i++) {
      const hour = peakHours[i % peakHours.length];
      const itemCount = 1 + (i % 3);
      const items = baseItems.slice(0, itemCount).map((idx, j) => [idx, 1 + (j + i) % 3]);
      orderSamples.push(mkOrder(branchID, daysAgo, hour, items));
    }
  };

  // Branch 1 (Hoàn Kiếm) — 2-5 orders/ngày trong 90 ngày
  for (let day = 0; day <= 89; day++) {
    const ordersPerDay = day < 7 ? 5 : day < 30 ? 4 : 3; // gần = nhiều hơn
    addOrdersForDay(branch1.branchID, day, ordersPerDay, [0, 1, 2, 3, 4, 7]);
  }

  // Branch 2 (Đống Đa) — 2-3 orders/ngày trong 90 ngày
  for (let day = 0; day <= 89; day++) {
    const ordersPerDay = day < 7 ? 3 : day < 30 ? 2 : 2;
    addOrdersForDay(branch2.branchID, day, ordersPerDay, [0, 2, 3, 5, 6, 8]);
  }

  // Branch 4 (Cầu Giấy) — 1-2 orders/ngày trong 60 ngày
  for (let day = 0; day <= 59; day++) {
    const ordersPerDay = day < 7 ? 2 : 1;
    addOrdersForDay(branch4.branchID, day, ordersPerDay, [1, 3, 4, 9]);
  }

  // Tạo orders trong DB
  let createdOrderCount = 0;
  const allCreatedOrders = [];

  for (const o of orderSamples) {
    let total = 0;
    const details = o.items
      .filter(([idx]) => idx < p.length)
      .map(([idx, qty]) => {
        const prod = p[idx];
        const linePrice = parseFloat(prod.price) * qty;
        total += linePrice;
        return { productID: prod.productID, quantity: qty, unitPrice: prod.price };
      });
    if (details.length === 0) continue;

    const orderTime = mkDate(o.daysAgo, o.hour, Math.floor(Math.random() * 50));
    const statuses = ['Completed', 'Completed', 'Completed', 'Completed', 'Cancelled'];
    const orderStatusVal = statuses[createdOrderCount % statuses.length];

    const order = await prisma.order.create({
      data: {
        branchID: o.branchID,
        orderTime,
        totalAmount: total,
        paymentStatus: orderStatusVal === 'Cancelled' ? 'Unpaid' : 'Paid',
        orderStatus: orderStatusVal,
        orderDetails: { create: details },
      },
    });
    allCreatedOrders.push({ orderID: order.orderID, totalAmount: total, orderTime, status: orderStatusVal });
    createdOrderCount++;
  }
  console.log(`✅ Tạo ${createdOrderCount} Orders mẫu (90 ngày, 3 chi nhánh)`);

  // =============================================
  // 11. INVOICES + TRANSACTIONS
  // =============================================
  const paidOrders = allCreatedOrders.filter(o => o.status !== 'Cancelled');
  const paymentMethods = ['Cash', 'BankTransfer', 'E_Wallet'];
  const txStatuses = ['Success', 'Success', 'Success', 'Success', 'Failed'];

  let invoiceCount = 0;
  let txCount = 0;

  for (let i = 0; i < paidOrders.length; i++) {
    const order = paidOrders[i];
    const method = paymentMethods[i % paymentMethods.length];
    const txStatus = txStatuses[i % txStatuses.length];

    const invoice = await prisma.invoice.create({
      data: {
        orderID: order.orderID,
        issuedDate: order.orderTime,
        status: 'Closed',
        subTotal: order.totalAmount,
        discountAmount: 0,
        totalAmount: order.totalAmount,
      },
    });
    invoiceCount++;

    await prisma.transaction.create({
      data: {
        invoiceID: invoice.invoiceID,
        amount: order.totalAmount,
        paymentMethod: method,
        status: txStatus,
        transactionTime: order.orderTime,
      },
    });
    txCount++;

    // Retry transaction (failed before success)
    if (i % 9 === 0 && txStatus === 'Success') {
      const retryTime = new Date(order.orderTime);
      retryTime.setMinutes(retryTime.getMinutes() - 3);
      await prisma.transaction.create({
        data: {
          invoiceID: invoice.invoiceID,
          amount: order.totalAmount,
          paymentMethod: method,
          status: 'Failed',
          transactionTime: retryTime,
        },
      });
      txCount++;
    }
  }
  console.log(`✅ Tạo ${invoiceCount} Invoices + ${txCount} Transactions`);

  console.log('\n🎉 Seed hoàn tất!\n');
  console.log('📋 Tài khoản đăng nhập:');
  console.log('   Admin:   admin@rms.vn        / Admin@123');
  console.log('   Owner 1: owner1@phogamenu.vn  / Owner@123');
  console.log('   Owner 2: owner2@banhmi.vn     / Owner@123');
  console.log('   Owner 3: owner3@bbqhouse.vn   / Owner@123');
  console.log('   Manager: manager1@rms.vn      / Manager@123');
  console.log('   Staff:   staff1@rms.vn        / Staff@123');


}

main()
  .catch((e) => {
    console.error("❌ Seed thất bại:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

