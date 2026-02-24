import prisma from "../config/prismaClient.js";
import bcrypt from "bcrypt";

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

        await prisma.$transaction(async (tx) => {
            // Tạo tài khoản RestaurantOwner mới
            const randomPw = Math.random().toString(36).slice(-8) + "A1!";
            const passwordHash = await bcrypt.hash(randomPw, 10);

            // Tách email và phone từ contactInfo nếu có
            const emailMatch = request.contactInfo?.match(/[\w.-]+@[\w.-]+\.\w+/);
            const phoneMatch = request.contactInfo?.match(/0\d{9}/);

            const newUser = await tx.user.create({
                data: {
                    username: `owner_${Date.now()}`,
                    passwordHash,
                    fullName: request.ownerName || "Chủ nhà hàng",
                    email: emailMatch ? emailMatch[0] : null,
                    phone: phoneMatch ? phoneMatch[0] : null,
                    role: "RestaurantOwner",
                    status: "Active",
                },
            });

            // Tạo Restaurant mới
            const newRestaurant = await tx.restaurant.create({
                data: {
                    ownerUserID: newUser.userID,
                    name: request.restaurantName || "Nhà hàng mới",
                },
            });

            // Cập nhật request
            await tx.registrationRequest.update({
                where: { requestID: parseInt(id) },
                data: {
                    approvalStatus: "Approved",
                    approvedBy: adminID,
                    approvedDate: new Date(),
                    ownerUserID: newUser.userID,
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
