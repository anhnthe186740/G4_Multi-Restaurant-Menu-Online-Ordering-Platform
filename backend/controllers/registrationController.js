import prisma from "../config/prismaClient.js";
import bcrypt from "bcrypt";

/* ================= CREATE REGISTRATION REQUEST (PUBLIC) ================= */
export const createRegistrationRequest = async (req, res) => {
    try {
        const { ownerName, email, phone, restaurantName, note } = req.body;

        if (!ownerName || !restaurantName) {
            return res.status(400).json({ message: "Họ tên chủ sở hữu và Tên nhà hàng là bắt buộc" });
        }

        // Gộp email + phone vào contactInfo
        const contactParts = [];
        if (email) contactParts.push(email);
        if (phone) contactParts.push(phone);
        const contactInfo = contactParts.join(" | ");

        // Nếu user đã đăng nhập (token hợp lệ được gửi kèm), lưu userID của họ
        // req.user được set bởi verifyToken optional middleware ở route
        const submittingUserID = req.user?.userID || req.user?.userId || null;

        const request = await prisma.registrationRequest.create({
            data: {
                ownerName,
                contactInfo: contactInfo || null,
                restaurantName,
                adminNote: note || null,
                approvalStatus: "Pending",
                // Liên kết với tài khoản hiện tại nếu đã đăng nhập
                ...(submittingUserID && { ownerUserID: submittingUserID }),
            },
        });

        res.status(201).json({
            message: "Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn trong 1-2 ngày làm việc.",
            requestID: request.requestID,
        });
    } catch (error) {
        console.error("createRegistrationRequest error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

/* ================= GET MY REGISTRATION STATUS (USER) ================= */
export const getMyRegistrationStatus = async (req, res) => {
    try {
        // JWT payload dùng "userId", dùng ?? để tránh falsy với 0
        const userID = req.user?.userID ?? req.user?.userId;
        if (userID === undefined || userID === null) {
            return res.status(401).json({ message: "Chưa đăng nhập" });
        }

        // Tìm đơn đăng ký mới nhất của user này
        const request = await prisma.registrationRequest.findFirst({
            where: { ownerUserID: userID },
            orderBy: { submissionDate: "desc" },
            select: {
                requestID: true,
                restaurantName: true,
                approvalStatus: true,
                submissionDate: true,
                approvedDate: true,
                adminNote: true,
            },
        });

        if (!request) {
            return res.json({ hasRequest: false });
        }

        res.json({
            hasRequest: true,
            requestID: request.requestID,
            restaurantName: request.restaurantName,
            status: request.approvalStatus,        // "Pending" | "Approved" | "Rejected"
            submissionDate: request.submissionDate,
            approvedDate: request.approvedDate,
            adminNote: request.adminNote,
        });
    } catch (error) {
        console.error("getMyRegistrationStatus error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};





/* ================= GET ALL REGISTRATION REQUESTS ================= */
export const getRegistrationRequests = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {};
        if (status && status !== "All") {
            where.approvalStatus = status;
        }
        if (search) {
            where.OR = [
                { restaurantName: { contains: search } },
                { ownerName: { contains: search } },
                { contactInfo: { contains: search } },
            ];
        }

        const [total, requests, pendingCount, approvedToday] = await Promise.all([
            prisma.registrationRequest.count({ where }),
            prisma.registrationRequest.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { submissionDate: "desc" },
                include: {
                    owner: { select: { userID: true, fullName: true, email: true, phone: true } },
                    approver: { select: { fullName: true } },
                },
            }),
            prisma.registrationRequest.count({ where: { approvalStatus: "Pending" } }),
            prisma.registrationRequest.count({
                where: {
                    approvalStatus: "Approved",
                    approvedDate: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lte: new Date(new Date().setHours(23, 59, 59, 999)),
                    },
                },
            }),
        ]);

        const totalAll = await prisma.registrationRequest.count();
        const approvedAll = await prisma.registrationRequest.count({ where: { approvalStatus: "Approved" } });
        const approvalRate = totalAll > 0 ? Math.round((approvedAll / totalAll) * 100) : 0;

        const result = requests.map((r) => ({
            requestID: r.requestID,
            ownerName: r.ownerName,
            restaurantName: r.restaurantName,
            contactInfo: r.contactInfo,
            submissionDate: r.submissionDate,
            approvalStatus: r.approvalStatus,
            adminNote: r.adminNote,
            approvedDate: r.approvedDate,
            approverName: r.approver?.fullName || null,
            ownerInfo: r.owner
                ? {
                    userID: r.owner.userID,
                    fullName: r.owner.fullName,
                    email: r.owner.email,
                    phone: r.owner.phone,
                }
                : null,
        }));

        res.json({
            requests: result,
            stats: {
                pendingCount,
                approvedToday,
                approvalRate,
            },
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error("getRegistrationRequests error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

/* ================= APPROVE REGISTRATION REQUEST ================= */
export const approveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const adminID = req.user?.userID;

        const request = await prisma.registrationRequest.findUnique({
            where: { requestID: parseInt(id) },
        });

        if (!request) {
            return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
        }
        if (request.approvalStatus !== "Pending") {
            return res.status(400).json({ message: "Yêu cầu này đã được xử lý" });
        }

        // Parse extra form data từ adminNote (nếu được gửi từ form mới)
        let formData = {};
        const PREFIX = "__FORM_DATA__:";
        if (request.adminNote?.startsWith(PREFIX)) {
            try {
                formData = JSON.parse(request.adminNote.slice(PREFIX.length));
            } catch { /* bỏ qua nếu parse lỗi */ }
        }

        await prisma.$transaction(async (tx) => {
            let ownerUserID;

            if (request.ownerUserID) {
                // ── Trường hợp 1: User đã đăng nhập khi gửi form ──────────────────
                // Nâng cấp role từ Staff/Customer → RestaurantOwner
                await tx.user.update({
                    where: { userID: request.ownerUserID },
                    data: { role: "RestaurantOwner" },
                });
                ownerUserID = request.ownerUserID;
            } else {
                // ── Trường hợp 2: Gửi form không đăng nhập → tạo tài khoản mới ──
                const randomPw = Math.random().toString(36).slice(-8) + "A1!";
                const passwordHash = await bcrypt.hash(randomPw, 10);

                const emailMatch = request.contactInfo?.match(/[\w.-]+@[\w.-]+\.\w+/);
                const phoneMatch = request.contactInfo?.match(/0\d{9}/);

                let safeEmail = null;
                if (emailMatch) {
                    const existing = await tx.user.findFirst({ where: { email: emailMatch[0] } });
                    safeEmail = existing ? null : emailMatch[0];
                }
                let safePhone = null;
                if (phoneMatch) {
                    const existing = await tx.user.findFirst({ where: { phone: phoneMatch[0] } });
                    safePhone = existing ? null : phoneMatch[0];
                }

                const newUser = await tx.user.create({
                    data: {
                        username: `owner_${Date.now()}`,
                        passwordHash,
                        fullName: request.ownerName || "Chủ nhà hàng",
                        email: safeEmail,
                        phone: safePhone,
                        role: "RestaurantOwner",
                        status: "Active",
                    },
                });
                ownerUserID = newUser.userID;
            }

            // Tạo Restaurant với đầy đủ các trường từ form data
            const newRestaurant = await tx.restaurant.create({
                data: {
                    ownerUserID,
                    name: request.restaurantName || "Nhà hàng mới",
                    ...(formData.taxCode && { taxCode: formData.taxCode }),
                    ...(formData.website && { website: formData.website }),
                    ...(formData.description && { description: formData.description }),
                    ...(formData.coverImage && { coverImage: formData.coverImage }),
                    ...(formData.logo && { logo: formData.logo }),
                    ...(formData.businessLicense && { businessLicense: formData.businessLicense }),
                },
            });

            // Cập nhật request
            await tx.registrationRequest.update({
                where: { requestID: parseInt(id) },
                data: {
                    approvalStatus: "Approved",
                    approvedBy: adminID,
                    approvedDate: new Date(),
                    ownerUserID,
                    restaurantID: newRestaurant.restaurantID,
                },
            });
        });

        res.json({ message: "Đã phê duyệt yêu cầu thành công" });


    } catch (error) {
        console.error("approveRequest error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

/* ================= REJECT REGISTRATION REQUEST ================= */
export const rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNote } = req.body;
        const adminID = req.user?.userID;

        const request = await prisma.registrationRequest.findUnique({
            where: { requestID: parseInt(id) },
        });

        if (!request) {
            return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
        }
        if (request.approvalStatus !== "Pending") {
            return res.status(400).json({ message: "Yêu cầu này đã được xử lý" });
        }

        await prisma.registrationRequest.update({
            where: { requestID: parseInt(id) },
            data: {
                approvalStatus: "Rejected",
                adminNote: adminNote || null,
                approvedBy: adminID,
                approvedDate: new Date(),
            },
        });

        res.json({ message: "Đã từ chối yêu cầu" });
    } catch (error) {
        console.error("rejectRequest error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};
