import prisma from "../config/prismaClient.js";

/* ─── helper: lấy branchID mà user này quản lý ─── */
const getManagerBranchId = async (userId) => {
  const branch = await prisma.branch.findFirst({
    where: { managerUserID: userId },
    select: { branchID: true },
  });
  return branch?.branchID ?? null;
};

/* ─── helper: date range theo period ─── */
const getPeriodRange = (period = "today") => {
  const now = new Date();
  let start, end;

  if (period === "7days") {
    start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0);
    end = new Date(now); end.setHours(23, 59, 59, 999);
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else {
    // today (default)
    start = new Date(now); start.setHours(0, 0, 0, 0);
    end = new Date(now); end.setHours(23, 59, 59, 999);
  }
  return { start, end };
};

/* ─── helper: date range kỳ trước (để tính % tăng trưởng) ─── */
const getPrevPeriodRange = (period = "today") => {
  const now = new Date();
  let start, end;

  if (period === "7days") {
    end = new Date(now); end.setDate(now.getDate() - 7); end.setHours(23, 59, 59, 999);
    start = new Date(end); start.setDate(end.getDate() - 6); start.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else {
    // yesterday
    start = new Date(now); start.setDate(now.getDate() - 1); start.setHours(0, 0, 0, 0);
    end = new Date(now); end.setDate(now.getDate() - 1); end.setHours(23, 59, 59, 999);
  }
  return { start, end };
};

const calcGrowth = (curr, prev) => {
  if (!prev || prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 100 * 10) / 10;
};

/* ===============================================================
   1. DASHBOARD STATS  (có filter theo period)
   GET /api/manager/dashboard/stats?period=today|7days|month
=============================================================== */
export const getManagerDashboardStats = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user.userId);
    if (!branchID)
      return res.status(404).json({ message: "Không tìm thấy chi nhánh được gán cho tài khoản này." });

    const period = req.query.period || "today";
    const { start, end } = getPeriodRange(period);
    const { start: prevStart, end: prevEnd } = getPrevPeriodRange(period);

    const [
      branch, tables,
      currRevAgg, prevRevAgg,
      currOrders,  prevOrders,
      openOrders, pendingServiceReqs,
    ] = await Promise.all([
      // Thông tin chi nhánh
      prisma.branch.findUnique({
        where: { branchID },
        select: { branchID: true, name: true, address: true, phone: true, openingHours: true, isActive: true },
      }),
      // Trạng thái bàn
      prisma.table.findMany({ where: { branchID }, select: { status: true } }),
      // Doanh thu kỳ này
      prisma.order.aggregate({
        where: { branchID, orderTime: { gte: start, lte: end }, orderStatus: "Completed" },
        _sum: { totalAmount: true },
      }),
      // Doanh thu kỳ trước
      prisma.order.aggregate({
        where: { branchID, orderTime: { gte: prevStart, lte: prevEnd }, orderStatus: "Completed" },
        _sum: { totalAmount: true },
      }),
      // Tổng đơn kỳ này
      prisma.order.count({ where: { branchID, orderTime: { gte: start, lte: end } } }),
      // Tổng đơn kỳ trước
      prisma.order.count({ where: { branchID, orderTime: { gte: prevStart, lte: prevEnd } } }),
      // Đơn Open + Serving hiện tại (realtime, không lọc period)
      prisma.order.count({ where: { branchID, orderStatus: { in: ["Open", "Serving"] } } }),
      // Service requests chưa xử lý
      prisma.serviceRequest.count({
        where: { branchID, OR: [{ status: null }, { status: "Pending" }] },
      }),
    ]);

    const currRev = parseFloat(currRevAgg._sum?.totalAmount ?? 0);
    const prevRev = parseFloat(prevRevAgg._sum?.totalAmount ?? 0);
    const avgOrderValue = currOrders > 0 ? Math.round(currRev / currOrders) : 0;
    const prevAvg = prevOrders > 0 ? Math.round(prevRev / prevOrders) : 0;

    res.json({
      branch,
      totalTables:    tables.length,
      occupiedTables: tables.filter(t => t.status === "Occupied").length,
      openOrders,
      pendingServiceRequests: pendingServiceReqs,
      // Stat cards
      totalRevenue:   currRev,
      totalOrders:    currOrders,
      avgOrderValue,
      revenueGrowth:  calcGrowth(currRev, prevRev),
      ordersGrowth:   calcGrowth(currOrders, prevOrders),
      avgGrowth:      calcGrowth(avgOrderValue, prevAvg),
    });
  } catch (err) {
    console.error("getManagerDashboardStats error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ===============================================================
   2. REVENUE TREND — bar chart by month (6 tháng gần nhất)
   GET /api/manager/dashboard/revenue-trend
=============================================================== */
export const getManagerRevenueTrend = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user.userId);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const results = await prisma.$queryRaw`
      SELECT
        DATE_FORMAT(orderTime, '%Y-%m') AS month,
        SUM(totalAmount)                AS revenue,
        COUNT(*)                        AS orders
      FROM Orders
      WHERE branchID = ${branchID}
        AND orderStatus = 'Completed'
        AND orderTime >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 MONTH)
      GROUP BY DATE_FORMAT(orderTime, '%Y-%m')
      ORDER BY month ASC
    `;

    const data = results.map(r => ({
      month:   r.month,
      revenue: parseFloat(r.revenue),
      orders:  Number(r.orders),
    }));

    res.json(data);
  } catch (err) {
    console.error("getManagerRevenueTrend error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ===============================================================
   3. ORDER STATUS DISTRIBUTION (kỳ được chọn)
   GET /api/manager/dashboard/order-status?period=today|7days|month
=============================================================== */
export const getManagerOrderStatus = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user.userId);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const period = req.query.period || "today";
    const { start, end } = getPeriodRange(period);

    const orders = await prisma.order.groupBy({
      by: ["orderStatus"],
      where: { branchID, orderTime: { gte: start, lte: end } },
      _count: { orderStatus: true },
    });

    const statusMap = { Open: 0, Serving: 0, Completed: 0, Cancelled: 0 };
    orders.forEach(o => { statusMap[o.orderStatus] = o._count.orderStatus; });
    const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

    res.json({ total, ...statusMap });
  } catch (err) {
    console.error("getManagerOrderStatus error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ===============================================================
   4. TOP PRODUCTS (30 ngày gần nhất)
   GET /api/manager/dashboard/top-products
=============================================================== */
export const getManagerTopProducts = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user.userId);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const rows = await prisma.orderDetail.groupBy({
      by: ["productID"],
      where: {
        order: {
          branchID,
          orderTime: { gte: since },
          orderStatus: { in: ["Completed", "Serving"] },
        },
        productID: { not: null },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    if (!rows.length) return res.json([]);

    const productIDs = rows.map(r => r.productID);
    const products = await prisma.product.findMany({
      where: { productID: { in: productIDs } },
      select: { productID: true, name: true },
    });

    const productMap = Object.fromEntries(products.map(p => [p.productID, p.name]));
    const maxQty = rows[0]?._sum?.quantity || 1;

    const result = rows.map(r => ({
      productID:  r.productID,
      name:       productMap[r.productID] ?? "Sản phẩm không xác định",
      quantity:   r._sum.quantity || 0,
      percentage: Math.round(((r._sum.quantity || 0) / maxQty) * 100),
    }));

    res.json(result);
  } catch (err) {
    console.error("getManagerTopProducts error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ===============================================================
   5. ORDERS HEATMAP — đơn hàng theo giờ (7 ngày gần nhất)
   GET /api/manager/dashboard/orders-heatmap
=============================================================== */
export const getManagerOrdersHeatmap = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user.userId);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const results = await prisma.$queryRaw`
      SELECT
        WEEKDAY(orderTime)                 AS dayOfWeek,
        HOUR(orderTime)                    AS hour,
        COUNT(*)                           AS count
      FROM Orders
      WHERE branchID = ${branchID}
        AND orderTime >= ${since}
      GROUP BY WEEKDAY(orderTime), HOUR(orderTime)
      ORDER BY dayOfWeek, hour
    `;

    // Build 7×24 grid  [day][hour]
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
    results.forEach(r => {
      grid[Number(r.dayOfWeek)][Number(r.hour)] = Number(r.count);
    });

    const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
    const heatmap = grid.map((hours, d) => ({ day: days[d], hours }));

    res.json(heatmap);
  } catch (err) {
    console.error("getManagerOrdersHeatmap error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};
