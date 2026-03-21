// seed-service-requests.js
// Dữ liệu mẫu: chỉ Gọi nhân viên & Thanh toán, trạng thái Đang xử lý / Đã xử lý
import prisma from "../config/prismaClient.js";

async function seedServiceRequests() {
  console.log("🌱 Seeding ServiceRequests...");

  const managerUser = await prisma.user.findFirst({
    where: { username: { contains: "manager" } },
  });

  if (!managerUser) {
    console.error("❌ Không tìm thấy manager user.");
    process.exit(1);
  }

  const branch = await prisma.branch.findFirst({
    where: { managerUserID: managerUser.userID },
    include: { tables: { take: 10 } },
  });

  if (!branch || branch.tables.length === 0) {
    console.error("❌ Không tìm thấy branch/table cho manager.");
    process.exit(1);
  }

  const tables = branch.tables;
  console.log(`✅ Manager: ${managerUser.fullName} | Branch: ${branch.name}`);

  await prisma.serviceRequest.deleteMany({ where: { branchID: branch.branchID } });

  const now = new Date();

  // GoiMon = Gọi nhân viên, ThanhToan = Thanh toán
  // status: "Đang xử lý" hoặc "Đã xử lý"
  const samples = [
    { type: "GoiMon",    status: "Đang xử lý", minsAgo: 2  },
    { type: "ThanhToan", status: "Đang xử lý", minsAgo: 5  },
    { type: "GoiMon",    status: "Đang xử lý", minsAgo: 10 },
    { type: "ThanhToan", status: "Đã xử lý",   minsAgo: 12 },
    { type: "GoiMon",    status: "Đang xử lý", minsAgo: 1  },
    { type: "ThanhToan", status: "Đang xử lý", minsAgo: 7  },
    { type: "GoiMon",    status: "Đã xử lý",   minsAgo: 20 },
    { type: "ThanhToan", status: "Đã xử lý",   minsAgo: 35 },
    { type: "GoiMon",    status: "Đang xử lý", minsAgo: 3  },
    { type: "ThanhToan", status: "Đã xử lý",   minsAgo: 45 },
    { type: "GoiMon",    status: "Đang xử lý", minsAgo: 8  },
    { type: "ThanhToan", status: "Đang xử lý", minsAgo: 15 },
  ];

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const table = tables[i % tables.length];
    const createdTime = new Date(now.getTime() - s.minsAgo * 60 * 1000);

    await prisma.serviceRequest.create({
      data: {
        branchID:    branch.branchID,
        tableID:     table.tableID,
        requestType: s.type,
        status:      s.status,
        createdTime,
      },
    });
  }

  console.log(`✅ Tạo ${samples.length} ServiceRequests`);
  console.log("   Đang xử lý:", samples.filter(s => s.status === "Đang xử lý").length);
  console.log("   Đã xử lý:  ", samples.filter(s => s.status === "Đã xử lý").length);
  console.log("\n🔑 http://localhost:5173/manager/service-requests");
  console.log("   manager1@rms.vn / Manager@123");
}

seedServiceRequests()
  .catch((e) => { console.error("❌ Lỗi:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
