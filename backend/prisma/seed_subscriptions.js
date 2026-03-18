/**
 * seed_subscriptions.js
 * Thêm 20 Subscriptions mẫu để test phân trang trên Admin Dashboard.
 * Chạy: node prisma/seed_subscriptions.js
 *
 * ⚠️  Script này chỉ INSERT thêm, KHÔNG xóa dữ liệu hiện có.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Lấy danh sách nhà hàng có sẵn
  const restaurants = await prisma.restaurant.findMany({
    select: { restaurantID: true, name: true },
  });

  if (restaurants.length === 0) {
    console.error("❌ Không tìm thấy nhà hàng nào. Hãy chạy seed chính trước.");
    process.exit(1);
  }

  // 2. Lấy danh sách gói dịch vụ có sẵn
  const packages = await prisma.servicePackage.findMany({
    select: { packageID: true, packageName: true, price: true },
  });

  if (packages.length === 0) {
    console.error("❌ Không tìm thấy gói dịch vụ nào. Hãy chạy seed chính trước.");
    process.exit(1);
  }

  console.log(`✅ Tìm thấy ${restaurants.length} nhà hàng và ${packages.length} gói dịch vụ`);
  console.log(`   Nhà hàng: ${restaurants.map(r => r.name).join(", ")}`);
  console.log(`   Gói: ${packages.map(p => p.packageName).join(", ")}`);

  const now = new Date();
  const monthsAgo = (n) => new Date(now.getFullYear(), now.getMonth() - n, 1);
  const monthsLater = (n) => new Date(now.getFullYear(), now.getMonth() + n, 1);

  // 3. Tạo 20 subscriptions mẫu với ngày đa dạng
  const subscriptionData = [
    // Active subscriptions - các giao dịch gần đây
    { restaurantIdx: 0, packageIdx: 0, startMonthsAgo: 0, durationMonths: 1, status: "Active" },
    { restaurantIdx: 1 % restaurants.length, packageIdx: 1 % packages.length, startMonthsAgo: 0, durationMonths: 3, status: "Active" },
    { restaurantIdx: 2 % restaurants.length, packageIdx: 2 % packages.length, startMonthsAgo: 0, durationMonths: 6, status: "Active" },
    { restaurantIdx: 0, packageIdx: 1 % packages.length, startMonthsAgo: 1, durationMonths: 3, status: "Active" },
    { restaurantIdx: 1 % restaurants.length, packageIdx: 0, startMonthsAgo: 1, durationMonths: 1, status: "Active" },
    { restaurantIdx: 2 % restaurants.length, packageIdx: 0, startMonthsAgo: 1, durationMonths: 1, status: "Active" },
    { restaurantIdx: 0, packageIdx: 2 % packages.length, startMonthsAgo: 2, durationMonths: 12, status: "Active" },
    { restaurantIdx: 1 % restaurants.length, packageIdx: 2 % packages.length, startMonthsAgo: 2, durationMonths: 6, status: "Active" },

    // Expired subscriptions - các giao dịch cũ hơn
    { restaurantIdx: 0, packageIdx: 0, startMonthsAgo: 7, durationMonths: 1, status: "Expired" },
    { restaurantIdx: 1 % restaurants.length, packageIdx: 1 % packages.length, startMonthsAgo: 6, durationMonths: 3, status: "Expired" },
    { restaurantIdx: 2 % restaurants.length, packageIdx: 0, startMonthsAgo: 5, durationMonths: 1, status: "Expired" },
    { restaurantIdx: 0, packageIdx: 1 % packages.length, startMonthsAgo: 4, durationMonths: 1, status: "Expired" },
    { restaurantIdx: 1 % restaurants.length, packageIdx: 0, startMonthsAgo: 10, durationMonths: 1, status: "Expired" },
    { restaurantIdx: 2 % restaurants.length, packageIdx: 1 % packages.length, startMonthsAgo: 9, durationMonths: 3, status: "Expired" },
    { restaurantIdx: 0, packageIdx: 2 % packages.length, startMonthsAgo: 8, durationMonths: 6, status: "Expired" },
    { restaurantIdx: 1 % restaurants.length, packageIdx: 2 % packages.length, startMonthsAgo: 12, durationMonths: 12, status: "Expired" },
    { restaurantIdx: 2 % restaurants.length, packageIdx: 0, startMonthsAgo: 11, durationMonths: 1, status: "Expired" },
    { restaurantIdx: 0, packageIdx: 0, startMonthsAgo: 13, durationMonths: 1, status: "Expired" },
    { restaurantIdx: 1 % restaurants.length, packageIdx: 1 % packages.length, startMonthsAgo: 14, durationMonths: 3, status: "Expired" },
    { restaurantIdx: 2 % restaurants.length, packageIdx: 2 % packages.length, startMonthsAgo: 16, durationMonths: 6, status: "Expired" },
  ];

  let createdCount = 0;
  for (const sub of subscriptionData) {
    const restaurant = restaurants[sub.restaurantIdx];
    const pkg = packages[sub.packageIdx];
    const startDate = monthsAgo(sub.startMonthsAgo);
    const endDate = monthsLater(sub.durationMonths - sub.startMonthsAgo);

    await prisma.subscription.create({
      data: {
        restaurantID: restaurant.restaurantID,
        packageID: pkg.packageID,
        startDate,
        endDate,
        status: sub.status,
        autoRenew: false,
      },
    });
    createdCount++;
    process.stdout.write(`\r   Đã tạo ${createdCount}/${subscriptionData.length} subscriptions...`);
  }

  console.log(`\n\n✅ Tạo thành công ${createdCount} Subscriptions mẫu!`);
  console.log("🎯 Bây giờ Admin Dashboard có đủ dữ liệu để test phân trang lịch sử thanh toán.");

  // 4. Thống kê
  const total = await prisma.subscription.count();
  const byStatus = await prisma.subscription.groupBy({
    by: ["status"],
    _count: { subscriptionID: true },
  });
  console.log(`\n📊 Tổng số Subscriptions trong DB: ${total}`);
  byStatus.forEach(s => {
    console.log(`   ${s.status}: ${s._count.subscriptionID}`);
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
