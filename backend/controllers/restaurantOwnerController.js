import prisma from "../config/prismaClient.js";

/* =================== HELPER =================== */
// Lấy restaurantID của owner đang login
async function getOwnerRestaurant(userID) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerUserID: userID },
  });
  return restaurant;
}

/* =================== GET DASHBOARD STATS =================== */
export const getDashboardStats = async (req, res) => {
  try {
    const userID = req.user.userID;
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) {
      return res.status(404).json({ message: "Không tìm thấy nhà hàng" });
    }

    const restaurantID = restaurant.restaurantID;

    // Lấy tất cả branches của restaurant
    const branches = await prisma.branch.findMany({
      where: { restaurantID },
      select: { branchID: true, name: true },
    });
    const branchIDs = branches.map((b) => b.branchID);

    // Tháng hiện tại
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Tổng doanh thu tháng này
    const currentMonthOrders = await prisma.order.aggregate({
      where: {
        branchID: { in: branchIDs },
        orderTime: { gte: startOfMonth },
        paymentStatus: "Paid",
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    // Tổng doanh thu tháng trước (để tính growth)
    const lastMonthOrders = await prisma.order.aggregate({
      where: {
        branchID: { in: branchIDs },
        orderTime: { gte: startOfLastMonth, lte: endOfLastMonth },
        paymentStatus: "Paid",
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    const currentRevenue = parseFloat(currentMonthOrders._sum.totalAmount || 0);
    const lastRevenue = parseFloat(lastMonthOrders._sum.totalAmount || 0);
    const revenueGrowth = lastRevenue > 0
      ? (((currentRevenue - lastRevenue) / lastRevenue) * 100).toFixed(1)
      : 0;

    const currentOrderCount = currentMonthOrders._count || 0;
    const lastOrderCount = lastMonthOrders._count || 0;
    const orderGrowth = lastOrderCount > 0
      ? (((currentOrderCount - lastOrderCount) / lastOrderCount) * 100).toFixed(1)
      : 0;

    // Giá trị trung bình đơn tháng này
    const avgOrderValue = currentOrderCount > 0
      ? Math.round(currentRevenue / currentOrderCount)
      : 0;

    const lastAvgOrderValue = lastOrderCount > 0
      ? Math.round(lastRevenue / lastOrderCount)
      : 0;
    const avgGrowth = lastAvgOrderValue > 0
      ? (((avgOrderValue - lastAvgOrderValue) / lastAvgOrderValue) * 100).toFixed(1)
      : 0;

    // Chi nhánh xuất sắc (doanh thu cao nhất tháng này)
    const branchRevenues = await Promise.all(
      branches.map(async (b) => {
        const agg = await prisma.order.aggregate({
          where: {
            branchID: b.branchID,
            orderTime: { gte: startOfMonth },
            paymentStatus: "Paid",
          },
          _sum: { totalAmount: true },
        });
        const lastAgg = await prisma.order.aggregate({
          where: {
            branchID: b.branchID,
            orderTime: { gte: startOfLastMonth, lte: endOfLastMonth },
            paymentStatus: "Paid",
          },
          _sum: { totalAmount: true },
        });
        const rev = parseFloat(agg._sum.totalAmount || 0);
        const lastRev = parseFloat(lastAgg._sum.totalAmount || 0);
        return {
          branchID: b.branchID,
          name: b.name,
          revenue: rev,
          growth: lastRev > 0 ? (((rev - lastRev) / lastRev) * 100).toFixed(1) : 0,
        };
      })
    );

    const topBranch = branchRevenues.sort((a, b) => b.revenue - a.revenue)[0] || null;

    res.json({
      totalRevenue: currentRevenue,
      revenueGrowth: parseFloat(revenueGrowth),
      totalOrders: currentOrderCount,
      orderGrowth: parseFloat(orderGrowth),
      avgOrderValue,
      avgGrowth: parseFloat(avgGrowth),
      topBranch: topBranch
        ? { name: topBranch.name, growth: parseFloat(topBranch.growth) }
        : null,
      totalBranches: branches.length,
      restaurantName: restaurant.name,
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== GET BRANCH REVENUE COMPARISON =================== */
export const getBranchRevenue = async (req, res) => {
  try {
    const userID = req.user.userID;
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const branches = await prisma.branch.findMany({
      where: { restaurantID: restaurant.restaurantID },
      select: { branchID: true, name: true },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const data = await Promise.all(
      branches.map(async (b) => {
        const agg = await prisma.order.aggregate({
          where: {
            branchID: b.branchID,
            orderTime: { gte: startOfMonth },
            paymentStatus: "Paid",
          },
          _sum: { totalAmount: true },
          _count: true,
        });
        return {
          name: b.name,
          revenue: parseFloat(agg._sum.totalAmount || 0),
          orders: agg._count,
        };
      })
    );

    res.json(data.sort((a, b) => b.revenue - a.revenue));
  } catch (error) {
    console.error("getBranchRevenue error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== GET TOP PRODUCTS =================== */
export const getTopProducts = async (req, res) => {
  try {
    const userID = req.user.userID;
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Lấy tất cả branch IDs
    const branches = await prisma.branch.findMany({
      where: { restaurantID: restaurant.restaurantID },
      select: { branchID: true },
    });
    const branchIDs = branches.map((b) => b.branchID);

    // Group order details by product
    const orderDetails = await prisma.orderDetail.groupBy({
      by: ["productID"],
      where: {
        order: {
          branchID: { in: branchIDs },
          orderTime: { gte: startOfMonth },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    const productsWithNames = await Promise.all(
      orderDetails.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { productID: item.productID },
          select: { name: true },
        });
        return {
          name: product?.name || "Sản phẩm không xác định",
          quantity: item._sum.quantity || 0,
        };
      })
    );

    // Tính phần trăm
    const totalQty = productsWithNames.reduce((s, p) => s + p.quantity, 0);
    const result = productsWithNames.map((p) => ({
      ...p,
      percentage: totalQty > 0 ? Math.round((p.quantity / totalQty) * 100) : 0,
    }));

    res.json(result);
  } catch (error) {
    console.error("getTopProducts error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== GET ORDERS BY HOUR =================== */
export const getOrdersByHour = async (req, res) => {
  try {
    const userID = req.user.userID;
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const branches = await prisma.branch.findMany({
      where: { restaurantID: restaurant.restaurantID },
      select: { branchID: true },
    });
    const branchIDs = branches.map((b) => b.branchID);

    // Lấy đơn hàng 30 ngày gần đây
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const orders = await prisma.order.findMany({
      where: {
        branchID: { in: branchIDs },
        orderTime: { gte: thirtyDaysAgo },
      },
      select: { orderTime: true },
    });

    // Đếm theo giờ
    const hourCounts = Array(24).fill(0);
    orders.forEach((o) => {
      const hour = new Date(o.orderTime).getHours();
      hourCounts[hour]++;
    });

    const result = hourCounts.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, "0")}:00`,
      orders: count,
    }));

    res.json(result);
  } catch (error) {
    console.error("getOrdersByHour error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== GET BRANCH PERFORMANCE TABLE =================== */
export const getBranchPerformance = async (req, res) => {
  try {
    const userID = req.user.userID;
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const branches = await prisma.branch.findMany({
      where: { restaurantID: restaurant.restaurantID },
      select: { branchID: true, name: true, address: true },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const data = await Promise.all(
      branches.map(async (b) => {
        const [current, last] = await Promise.all([
          prisma.order.aggregate({
            where: { branchID: b.branchID, orderTime: { gte: startOfMonth }, paymentStatus: "Paid" },
            _sum: { totalAmount: true },
            _count: true,
          }),
          prisma.order.aggregate({
            where: { branchID: b.branchID, orderTime: { gte: startOfLastMonth, lte: endOfLastMonth }, paymentStatus: "Paid" },
            _sum: { totalAmount: true },
          }),
        ]);

        const revenue = parseFloat(current._sum.totalAmount || 0);
        const lastRevenue = parseFloat(last._sum.totalAmount || 0);
        const growth = lastRevenue > 0
          ? (((revenue - lastRevenue) / lastRevenue) * 100).toFixed(1)
          : 0;

        return {
          branchID: b.branchID,
          name: b.name,
          address: b.address,
          orders: current._count,
          revenue,
          growth: parseFloat(growth),
        };
      })
    );

    res.json(data.sort((a, b) => b.revenue - a.revenue));
  } catch (error) {
    console.error("getBranchPerformance error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};
