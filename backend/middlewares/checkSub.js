import prisma from "../config/prismaClient.js";

const checkSubscription = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerUserID: userId },
    });

    if (!restaurant) {
      return res.status(403).json({
        message: "Không tìm thấy nhà hàng.",
        subscriptionRequired: true,
      });
    }

    const activeSub = await prisma.subscription.findFirst({
      where: {
        restaurantID: restaurant.restaurantID,
        status: "Active",
        endDate: { gt: new Date() },
      },
    });

    if (!activeSub) {
      return res.status(403).json({
        message: "Bạn cần mua hoặc gia hạn gói dịch vụ để sử dụng tính năng này.",
        subscriptionRequired: true,
      });
    }

    next();
  } catch (err) {
    console.error("checkSubscription error:", err);
    return res.status(500).json({ message: "Lỗi server kiểm tra subscription" });
  }
};

export default checkSubscription;