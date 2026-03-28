import prisma from "../config/prismaClient.js";
import bcrypt from "bcrypt";
import { sendRegistrationApprovedEmail } from "../config/emailService.js";
import nodemailer from "nodemailer";

/**
 * API: Tạo yêu cầu đăng ký nhà hàng mới
 * Logic: Nhận thông tin từ form, kiểm tra tính hợp lệ của mã số thuế/giấy phép,
 * và lưu vào bảng RegistrationRequest.
 */
export const createRegistrationRequest = async (req, res) => {
    try {
        const { ownerName, email, phone, restaurantName, note } = req.body;

        // Kiểm tra các trường bắt buộc cơ bản
        if (!ownerName || !restaurantName) {
            return res.status(400).json({ message: "Họ tên chủ sở hữu và Tên nhà hàng là bắt buộc" });
        }

        // Xử lý thông tin bổ sung (nếu có) được gửi kèm trong trường 'note' dưới dạng JSON
        const PREFIX = "__FORM_DATA__:";
        if (note && note.startsWith(PREFIX)) {
            try {
                const extraData = JSON.parse(note.slice(PREFIX.length));
                
                // Regex kiểm tra mã số thuế (10 số cho cty chính hoặc 13 số cho chi nhánh)
                const taxRegex = /^\d{10}(\d{3})?$/;
                const cleanTax = (extraData.taxCode || "").replace(/-/g, "").trim();

                if (!cleanTax) {
                    return res.status(400).json({ message: "Mã số thuế là bắt buộc" });
                }
                if (!taxRegex.test(cleanTax)) {
                    return res.status(400).json({ message: "Mã số thuế không hợp lệ (10 hoặc 13 chữ số)" });
                }
                if (!extraData.businessLicense) {
                    return res.status(400).json({ message: "Giấy phép kinh doanh là bắt buộc" });
                }
            } catch (e) {
                // Nếu lỗi parse JSON, có thể là note thuần tuý, không cần xử lý thêm
            }
        }

        // Chuẩn hoá thông tin liên lạc thành chuỗi để lưu vào DB
        const contactParts = [];
        if (email) contactParts.push(email);
        if (phone) contactParts.push(phone);
        const contactInfo = contactParts.join(" | ");

        // Lấy ID người dùng hiện tại nếu họ đã đăng nhập (để liên kết hồ sơ)
        const submittingUserID = req.user?.userID || req.user?.userId || null;

        const request = await prisma.registrationRequest.create({
            data: {
                ownerName,
                contactInfo: contactInfo || null,
                restaurantName,
                adminNote: note || null,
                approvalStatus: "Pending", // Mặc định là chờ phê duyệt
                // Liên kết với tài khoản hiện tại nếu có
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

/**
 * API: Lấy thông tin đơn đăng ký của người dùng hiện tại
 * Dùng để hiển thị trạng thái (Chờ duyệt/Đã duyệt/Từ chối) trên Dashboard của họ.
 */
export const getMyRegistrationStatus = async (req, res) => {
    try {
        const userID = req.user?.userID ?? req.user?.userId;
        if (userID === undefined || userID === null) {
            return res.status(401).json({ message: "Chưa đăng nhập" });
        }

        // Tìm đơn đăng ký mới nhất (theo thời gian nộp) của user này
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
            status: request.approvalStatus,        
            submissionDate: request.submissionDate,
            approvedDate: request.approvedDate,
            adminNote: request.adminNote,
        });
    } catch (error) {
        console.error("getMyRegistrationStatus error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

/**
 * API dành cho Admin: Lấy danh sách hồ sơ đăng ký kèm theo thống kê
 * Hỗ trợ lọc theo trạng thái, tìm kiếm và phân trang.
 */
export const getRegistrationRequests = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {};
        // Lọc theo trạng thái hồ sơ
        if (status && status !== "All") {
            where.approvalStatus = status;
        }
        // Tìm kiếm theo tên nhà hàng, chủ sở hữu hoặc thông tin liên hệ
        if (search) {
            where.OR = [
                { restaurantName: { contains: search } },
                { ownerName: { contains: search } },
                { contactInfo: { contains: search } },
            ];
        }

        // Chạy song song các query đếm và lấy dữ liệu để tối ưu hiệu năng
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

        // Tính toán tỷ lệ phê duyệt hồ sơ
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

/**
 * API dành cho Admin: Phê duyệt hồ sơ đăng ký nhà hàng
 * 1. Nâng cấp role người dùng (nếu có sẵn) hoặc tạo tài khoản mới (quên mật khẩu được gửi qua mail).
 * 2. Tạo bản ghi Nhà hàng (Restaurant) với thông tin từ form.
 * 3. Chốt trạng thái hồ sơ thành 'Approved'.
 * 4. Gửi email thông báo chứa link truy cập.
 */
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
            return res.status(400).json({ message: "Yêu cầu này đã được xử lý (Đã duyệt hoặc bị từ chối)" });
        }

        // Trích xuất dữ liệu form từ trường adminNote (nếu có tiền tố đặc biệt)
        let formData = {};
        const PREFIX = "__FORM_DATA__:";
        if (request.adminNote?.startsWith(PREFIX)) {
            try {
                formData = JSON.parse(request.adminNote.slice(PREFIX.length));
            } catch { /* parse lỗi thì bỏ qua */ }
        }

        let plainPassword = null;
        
        // SỬ DỤNG TRANSACTION ĐỂ ĐẢM BẢO TẤT CẢ PHẢI THÀNH CÔNG HOẶC THẤT BẠI CÙNG NHAU
        await prisma.$transaction(async (tx) => {
            let ownerUserID;

            if (request.ownerUserID) {
                // ── TRƯỜNG HỢP 1: Người đăng ký đã có tài khoản Customer trước đó ──
                // Chỉ cần nâng cấp quyền (Role) lên RestaurantOwner
                await tx.user.update({
                    where: { userID: request.ownerUserID },
                    data: { role: "RestaurantOwner" },
                });
                ownerUserID = request.ownerUserID;
            } else {
                // ── TRƯỜNG HỢP 2: Đăng ký vãng lai chưa có tài khoản ──
                // Hệ thống tự động kích hoạt tài khoản mới với mật khẩu ngẫu nhiên
                const randomPw = Math.random().toString(36).slice(-8) + "A1!";
                plainPassword = randomPw;
                const passwordHash = await bcrypt.hash(randomPw, 10);

                // Tách email/phone từ chuỗi contactInfo (ví dụ: "email@abc.com | 0912345678")
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

            // Tạo bản ghi dữ liệu nhà hàng lần đầu tiên
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

            // Ghi nhận trạng thái phê duyệt vào hồ sơ
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

        // ── GỬI EMAIL THÔNG BÁO THÀNH CÔNG (Đặt ngoài Transaction để không rollback DB nếu lỗi mạng) ──
        try {
            const updatedRequest = await prisma.registrationRequest.findUnique({
                where: { requestID: parseInt(id) },
                include: { owner: true }
            });

            if (updatedRequest) {
                const targetEmail = updatedRequest.owner?.email || (updatedRequest.contactInfo?.match(/[\w.-]+@[\w.-]+\.\w+/) || [])[0];
                const fullName = updatedRequest.owner?.fullName || updatedRequest.ownerName || "Chủ nhà hàng";
                const restaurantName = updatedRequest.restaurantName || "Nhà hàng của bạn";

                if (targetEmail) {
                    console.log(`📧 [Vận hành] Gửi email phê duyệt tới: ${targetEmail} cho nhà hàng: ${restaurantName}`);
                    const info = await sendRegistrationApprovedEmail(
                        targetEmail,
                        fullName,
                        restaurantName,
                        plainPassword ? { username: updatedRequest.owner.username, password: plainPassword } : null
                    );
                    // Log link xem trước email cho môi trường Dev (Nodemailer test)
                    if (info && nodemailer.getTestMessageUrl(info)) {
                        console.log(`🔗 [Gửi Mail] Xem lại nội dung: ${nodemailer.getTestMessageUrl(info)}`);
                    }
                }
            }
        } catch (emailError) {
            console.error("Lỗi gửi email phê duyệt:", emailError);
            // Không trả về lỗi API ở đây vì DB đã update thành công, hồ sơ thực tế ĐÃ được duyệt.
        }

        res.json({ message: "Đã phê duyệt yêu cầu thành công và cấp quyền truy cập hệ thống" });

    } catch (error) {
        console.error("approveRequest error:", error);
        res.status(500).json({ message: error.message || "Lỗi hệ thống khi phê duyệt" });
    }
};

/**
 * API dành cho Admin: Từ chối hồ sơ đăng ký
 * Yêu cầu phải nhập lý do từ chối (adminNote) để gửi phản hồi cho người dùng.
 */
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
            return res.status(400).json({ message: "Chỉ hồ sơ đang chờ duyệt mới có thể bị từ chối" });
        }

        // Bắt buộc nhập lý do từ chối để đối tác biết cần sửa đổi gì
        if (!adminNote || !adminNote.trim()) {
            return res.status(400).json({ message: "Lý do từ chối là bắt buộc để thông báo cho khách hàng" });
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

        res.json({ message: "Đã từ chối đơn đăng ký thành công" });
    } catch (error) {
        console.error("rejectRequest error:", error);
        res.status(500).json({ message: error.message || "Lỗi hệ thống khi từ chối hồ sơ" });
    }
};

