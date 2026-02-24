/**
 * Script: add-registration-requests.js
 * Thêm dữ liệu mẫu cho bảng RegistrationRequests nếu chưa có
 * Chạy: node scripts/add-registration-requests.js
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Kiểm tra dữ liệu hiện tại
    const existingCount = await prisma.registrationRequest.count();
    console.log(`📊 Hiện có ${existingCount} registration requests trong DB\n`);

    if (existingCount >= 3) {
        console.log("✅ Đã có đủ dữ liệu. Không cần thêm.\n");
        const all = await prisma.registrationRequest.findMany({
            orderBy: { submissionDate: "desc" },
            take: 5,
            select: { requestID: true, restaurantName: true, ownerName: true, approvalStatus: true },
        });
        console.log("📋 Danh sách hiện tại:");
        all.forEach(r => console.log(`   #${r.requestID} | ${r.restaurantName} | ${r.ownerName} | ${r.approvalStatus}`));
        return;
    }

    console.log("🌱 Thêm dữ liệu mẫu cho RegistrationRequests...\n");

    const sampleRequests = [
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
        {
            ownerName: "Hồ Ngọc Dimsum",
            contactInfo: "dimsum@yumcha.vn | 0988888888",
            restaurantName: "Dimsum Yum Cha Palace",
            approvalStatus: "Approved",
            submissionDate: new Date("2023-10-01"),
            approvedDate: new Date("2023-10-05"),
        },
        {
            ownerName: "Bùi Thanh Hải",
            contactInfo: "haisushi@gmail.com | 0945678901",
            restaurantName: "Hải Sản Tươi Sống",
            approvalStatus: "Rejected",
            adminNote: "Thiếu giấy phép kinh doanh. Vui lòng bổ sung và gửi lại.",
            submissionDate: new Date("2023-10-03"),
            approvedDate: new Date("2023-10-05"),
        },
    ];

    for (const req of sampleRequests) {
        await prisma.registrationRequest.create({ data: req });
        console.log(`  ✅ Thêm: ${req.restaurantName} (${req.approvalStatus})`);
    }

    const newCount = await prisma.registrationRequest.count();
    console.log(`\n🎉 Hoàn tất! Tổng cộng ${newCount} registration requests trong DB.`);
    console.log(`   Pending:  ${sampleRequests.filter(r => r.approvalStatus === "Pending").length}`);
    console.log(`   Approved: ${sampleRequests.filter(r => r.approvalStatus === "Approved").length}`);
    console.log(`   Rejected: ${sampleRequests.filter(r => r.approvalStatus === "Rejected").length}`);
}

main()
    .catch(e => {
        console.error("❌ Lỗi:", e.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
