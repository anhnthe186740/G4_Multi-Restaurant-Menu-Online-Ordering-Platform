/**
 * Script: add-more-requests.js
 * Thêm thêm dữ liệu mẫu phong phú hơn cho Registration Requests
 * Chạy: node scripts/add-more-requests.js
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const existingCount = await prisma.registrationRequest.count();
    console.log(`📊 Hiện có ${existingCount} registration requests\n`);

    const newRequests = [
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
            ownerName: "Bùi Thanh Hải",
            contactInfo: "haisantuoi@gmail.com | 0945678901",
            restaurantName: "Hải Sản Tươi Sống",
            approvalStatus: "Rejected",
            adminNote: "Thiếu giấy phép kinh doanh. Vui lòng bổ sung và gửi lại.",
            submissionDate: new Date("2023-10-03"),
            approvedDate: new Date("2023-10-05"),
        },
    ];

    for (const req of newRequests) {
        await prisma.registrationRequest.create({ data: req });
        console.log(`  ✅ Thêm: "${req.restaurantName}" (${req.approvalStatus})`);
    }

    const totalAfter = await prisma.registrationRequest.count();
    const pendingCount = await prisma.registrationRequest.count({ where: { approvalStatus: "Pending" } });
    const approvedCount = await prisma.registrationRequest.count({ where: { approvalStatus: "Approved" } });
    const rejectedCount = await prisma.registrationRequest.count({ where: { approvalStatus: "Rejected" } });

    console.log(`\n🎉 Hoàn tất! DB hiện có ${totalAfter} requests:`);
    console.log(`   ⏳ Pending:  ${pendingCount}`);
    console.log(`   ✅ Approved: ${approvedCount}`);
    console.log(`   ❌ Rejected: ${rejectedCount}`);
    console.log(`\n👉 Vào http://localhost:5173/admin/requests để kiểm tra`);
}

main()
    .catch(e => { console.error("❌ Lỗi:", e.message); process.exit(1); })
    .finally(() => prisma.$disconnect());
