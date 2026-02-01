import { db } from '../config/db.js';

const checkSubscription = async (req, res, next) => {
    try {
        const { restaurantId } = req.user; // Lấy từ JWT token
        const [rows] = await db.query(
            'SELECT EndDate, Status FROM Subscriptions WHERE RestaurantID = ? AND Status = "Active"',
            [restaurantId]
        );

        if (rows.length === 0 || new Date(rows[0].EndDate) < new Date()) {
            return res.status(403).json({ message: "Gói tài khoản đã hết hạn hoặc chưa đăng ký!" });
        }
        next();
    } catch (err) {
        console.error("checkSubscription error:", err);
        return res.status(500).json({ message: "Lỗi server kiểm tra subscription" });
    }
};

export default checkSubscription;