import prisma from "../config/prismaClient.js";

const checkSubscription = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.userID;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: "Không tìm thấy thông tin xác thực." });
    }

    // Admin skip check
    if (role === "Admin") return next();

    let restaurantID = null;

    if (role === "RestaurantOwner") {
      const restaurant = await prisma.restaurant.findFirst({
        where: { ownerUserID: userId },
      });
      if (restaurant) restaurantID = restaurant.restaurantID;
    } else if (role === "BranchManager") {
      // Tìm chi nhánh mà user này quản lý
      const branch = await prisma.branch.findFirst({
        where: { managerUserID: userId },
      });
      if (branch) restaurantID = branch.restaurantID;
    } else if (role === "Staff" || role === "Kitchen") {
      // Tìm chi nhánh mà nhân viên này thuộc về
      const user = await prisma.user.findUnique({
        where: { userID: userId },
        include: { branch: true },
      });
      if (user?.branch) restaurantID = user.branch.restaurantID;
      if (!restaurantID && user?.restaurantID) restaurantID = user.restaurantID;
    }

    if (!restaurantID) {
      return res.status(403).json({
        message: "Tài khoản của bạn chưa được liên kết với nhà hàng nào hoặc không có quyền truy cập.",
        subscriptionRequired: true,
      });
    }

    const activeSub = await prisma.subscription.findFirst({
      where: {
        restaurantID: restaurantID,
        status: "Active",
        endDate: { gt: new Date() },
      },
    });

    if (!activeSub) {
      return res.status(403).json({
        message: "Nhà hàng cần mua hoặc gia hạn gói dịch vụ để sử dụng tính năng này.",
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