const db = require('../config/db');

const checkSubscription = async (req, res, next) => {
    const { restaurantId } = req.user; // Lấy từ JWT token
    const [rows] = await db.query(
        'SELECT end_date FROM subscriptions WHERE restaurant_id = ? AND status = "active"', 
        [restaurantId]
    );

    if (rows.length === 0 || new Date(rows[0].end_date) < new Date()) {
        return res.status(403).json({ message: "Gói tài khoản đã hết hạn hoặc chưa đăng ký!" });
    }
    next();
};