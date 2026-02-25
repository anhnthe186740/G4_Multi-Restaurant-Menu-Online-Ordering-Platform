import prisma from "../config/prismaClient.js";
import { Parser } from "json2csv";

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
    const userID = req.user.userId;
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
      ? parseFloat((((currentRevenue - lastRevenue) / lastRevenue) * 100).toFixed(1))
      : null;

    const currentOrderCount = currentMonthOrders._count || 0;
    const lastOrderCount = lastMonthOrders._count || 0;
    const orderGrowth = lastOrderCount > 0
      ? parseFloat((((currentOrderCount - lastOrderCount) / lastOrderCount) * 100).toFixed(1))
      : null;

    // Giá trị trung bình đơn tháng này
    const avgOrderValue = currentOrderCount > 0
      ? Math.round(currentRevenue / currentOrderCount)
      : 0;

    const lastAvgOrderValue = lastOrderCount > 0
      ? Math.round(lastRevenue / lastOrderCount)
      : 0;
    const avgGrowth = lastAvgOrderValue > 0
      ? parseFloat((((avgOrderValue - lastAvgOrderValue) / lastAvgOrderValue) * 100).toFixed(1))
      : null;

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
      revenueGrowth,
      totalOrders: currentOrderCount,
      orderGrowth,
      avgOrderValue,
      avgGrowth,
      topBranch: topBranch
        ? { name: topBranch.name, growth: topBranch.growth !== null ? parseFloat(topBranch.growth) : null }
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
    const userID = req.user.userId;
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
    const userID = req.user.userId;
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
    const userID = req.user.userId;
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
    const userID = req.user.userId;
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

/* =================== GET OWNER BRANCHES LIST =================== */
export const getOwnerBranches = async (req, res) => {
  try {
    const userID = req.user.userId;
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const branches = await prisma.branch.findMany({
      where: { restaurantID: restaurant.restaurantID },
      include: {
        _count: { select: { tables: true, orders: true } },
      },
      orderBy: { branchID: "asc" },
    });

    const result = branches.map((b) => {
      let parsedHours = {};
      try { parsedHours = b.openingHours ? JSON.parse(b.openingHours) : {}; } catch { }
      return {
        branchID: b.branchID,
        name: b.name,
        address: b.address || "",
        phone: b.phone || "",
        email: parsedHours.email || "",
        isActive: b.isActive,
        tableCount: b._count.tables,
        orderCount: b._count.orders,
        openingHours: parsedHours,
      };
    });

    res.json({ restaurantName: restaurant.name, branches: result });
  } catch (error) {
    console.error("getOwnerBranches error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== GET SINGLE BRANCH =================== */
export const getOwnerBranchById = async (req, res) => {
  try {
    const userID = req.user.userId;
    const branchID = parseInt(req.params.id);
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const branch = await prisma.branch.findFirst({
      where: { branchID, restaurantID: restaurant.restaurantID },
      include: { _count: { select: { tables: true, orders: true } } },
    });
    if (!branch) return res.status(404).json({ message: "Chi nhánh không tồn tại" });

    let parsedHours = {};
    try { parsedHours = branch.openingHours ? JSON.parse(branch.openingHours) : {}; } catch { }

    res.json({
      branchID: branch.branchID,
      name: branch.name,
      address: branch.address || "",
      phone: branch.phone || "",
      email: parsedHours.email || "",
      isActive: branch.isActive,
      tableCount: branch._count.tables,
      orderCount: branch._count.orders,
      openingHours: parsedHours,
      restaurantName: restaurant.name,
    });
  } catch (error) {
    console.error("getOwnerBranchById error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== UPDATE BRANCH =================== */
export const updateOwnerBranch = async (req, res) => {
  try {
    const userID = req.user.userId;
    const branchID = parseInt(req.params.id);
    const { name, address, phone, email, openingHours } = req.body;

    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const branch = await prisma.branch.findFirst({
      where: { branchID, restaurantID: restaurant.restaurantID },
    });
    if (!branch) return res.status(404).json({ message: "Chi nhánh không tồn tại" });

    const hoursObj = { ...(openingHours || {}), email: email || "" };
    const updated = await prisma.branch.update({
      where: { branchID },
      data: {
        name: name ?? branch.name,
        address: address ?? branch.address,
        phone: phone ?? branch.phone,
        openingHours: JSON.stringify(hoursObj),
      },
    });

    res.json({ message: "Cập nhật chi nhánh thành công", branch: updated });
  } catch (error) {
    console.error("updateOwnerBranch error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== GET PAYMENT HISTORY =================== */
export const getPaymentHistory = async (req, res) => {
  try {
    const userID = req.user.userId;
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const branches = await prisma.branch.findMany({
      where: { restaurantID: restaurant.restaurantID },
      select: { branchID: true, name: true },
    });
    const branchIDs = branches.map((b) => b.branchID);

    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      paymentMethod,
      status,
      search,
      exportCsv,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Build base filters (always active)
    const baseWhere = {
      invoice: {
        order: {
          branchID: { in: branchIDs },
        },
      },
    };

    // Filter theo thời gian (áp dụng cho cả bảng và summary)
    const timeWhere = {};
    if (startDate || endDate) {
      timeWhere.transactionTime = {};
      if (startDate) timeWhere.transactionTime.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        timeWhere.transactionTime.lte = end;
      }
    }

    // Filter theo phương thức/trạng thái (chỉ áp dụng cho bảng dữ liệu)
    const tableFilters = {};
    const methodMap = { Cash: "Cash", BankTransfer: "BankTransfer", "E-Wallet": "E_Wallet" };
    if (paymentMethod && methodMap[paymentMethod]) tableFilters.paymentMethod = methodMap[paymentMethod];
    if (status) tableFilters.status = status;

    // Search logic nâng cao
    const searchWhere = {};
    if (search) {
      const cleanSearch = search.replace(/#ORD-/i, "").trim();
      const searchNum = parseInt(cleanSearch);
      if (!isNaN(searchNum)) {
        searchWhere.invoice = {
          order: {
            orderID: searchNum,
          },
        };
      }
    }

    // Câu lệnh WHERE cuối cùng cho bảng dữ liệu (Table & Pagination)
    const where = {
      ...baseWhere,
      ...timeWhere,
      ...tableFilters,
      ...(search ? searchWhere : {}),
    };

    // Câu lệnh WHERE cho Summary (Stat Cards) - Chỉ lọc theo thời gian và chi nhánh
    const summaryWhere = {
      ...baseWhere,
      ...timeWhere,
    };

    // Tổng số bản ghi
    const totalCount = await prisma.transaction.count({ where });

    // Nếu là export CSV - lấy tất cả không phân trang
    const skipVal = exportCsv === "true" ? 0 : (pageNum - 1) * limitNum;
    const takeVal = exportCsv === "true" ? undefined : limitNum;

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        invoice: {
          include: {
            order: {
              include: {
                branch: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { transactionTime: "desc" },
      skip: skipVal,
      take: takeVal,
    });

    // Nếu export CSV
    if (exportCsv === "true") {
      try {
        const fields = [
          { label: "Ngày", value: (row) => new Date(row.transactionTime).toLocaleString("vi-VN") },
          { label: "Mã đơn hàng", value: (row) => `#ORD-${row.invoice?.order?.orderID || ""}` },
          { label: "Chi nhánh", value: (row) => row.invoice?.order?.branch?.name || "" },
          { label: "Phương thức", value: "paymentMethod" },
          { label: "Số tiền", value: (row) => parseFloat(row.amount) },
          { label: "Trạng thái", value: "status" },
        ];
        const parser = new Parser({ fields });
        const csv = parser.parse(transactions);
        res.header("Content-Type", "text/csv; charset=utf-8");
        res.header("Content-Disposition", 'attachment; filename="lich-su-thanh-toan.csv"');
        return res.send("\uFEFF" + csv);
      } catch (csvErr) {
        console.error("CSV export error:", csvErr);
        return res.status(500).json({ message: "Lỗi xuất CSV" });
      }
    }

    // Tính tổng hợp (Dùng summaryWhere để Stat Cards không bị ảnh hưởng bởi filter Method/Status)
    const allForSummary = await prisma.transaction.findMany({
      where: summaryWhere,
      select: { amount: true, paymentMethod: true, status: true },
    });

    let totalRevenue = 0, cashRevenue = 0, onlineRevenue = 0;
    for (const t of allForSummary) {
      if (t.status !== "Success") continue;
      const amt = parseFloat(t.amount);
      totalRevenue += amt;
      if (t.paymentMethod === "Cash") cashRevenue += amt;
      else onlineRevenue += amt;
    }

    // Tính growth so với khoảng thời gian tương đương trước đó
    let revenueGrowth = null;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diff = end.getTime() - start.getTime();
      const prevStart = new Date(start.getTime() - diff - 86400000);
      const prevEnd = new Date(start.getTime() - 1);
      const prevSummary = await prisma.transaction.findMany({
        where: {
          invoice: { order: { branchID: { in: branchIDs } } },
          transactionTime: { gte: prevStart, lte: prevEnd },
          status: "Success",
        },
        select: { amount: true },
      });
      const prevRevenue = prevSummary.reduce((s, t) => s + parseFloat(t.amount), 0);
      if (prevRevenue > 0) {
        revenueGrowth = parseFloat((((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1));
      }
    }

    const cashPercent = totalRevenue > 0 ? Math.round((cashRevenue / totalRevenue) * 100) : 0;
    const onlinePercent = totalRevenue > 0 ? Math.round((onlineRevenue / totalRevenue) * 100) : 0;

    const result = transactions.map((t) => ({
      transactionID: t.transactionID,
      orderID: t.invoice?.order?.orderID ?? null,
      branchName: t.invoice?.order?.branch?.name ?? null,
      paymentMethod: t.paymentMethod,
      amount: parseFloat(t.amount),
      status: t.status,
      transactionTime: t.transactionTime,
      paymentGatewayRef: t.paymentGatewayRef,
    }));

    res.json({
      transactions: result,
      totalCount,
      page: pageNum,
      limit: limitNum,
      summary: {
        totalRevenue,
        cashRevenue,
        onlineRevenue,
        cashPercent,
        onlinePercent,
        revenueGrowth,
      },
    });
  } catch (error) {
    console.error("getPaymentHistory error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== TOGGLE BRANCH STATUS =================== */
export const toggleOwnerBranch = async (req, res) => {
  try {
    const userID = req.user.userId;
    const branchID = parseInt(req.params.id);

    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const branch = await prisma.branch.findFirst({
      where: { branchID, restaurantID: restaurant.restaurantID },
    });
    if (!branch) return res.status(404).json({ message: "Chi nhánh không tồn tại" });

    const updated = await prisma.branch.update({
      where: { branchID },
      data: { isActive: !branch.isActive },
    });

    res.json({ message: `Chi nhánh đã được ${updated.isActive ? "kích hoạt" : "tạm dừng"}`, isActive: updated.isActive });
  } catch (error) {
    console.error("toggleOwnerBranch error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== KITCHEN DISPLAY SYSTEM (KDS) =================== */

// 1. Lấy danh sách đơn hàng trong ngày của chi nhánh/bếp (FIFO)
export const getKitchenOrders = async (req, res) => {
  try {
    const userID = req.user.userId;
    const branchID = parseInt(req.params.branchID);
    const categoryID = req.query.categoryID ? parseInt(req.query.categoryID) : null;

    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    // Kiểm tra branch thuộc restaurant của owner
    const branch = await prisma.branch.findFirst({
      where: { branchID, restaurantID: restaurant.restaurantID },
    });
    if (!branch) return res.status(404).json({ message: "Chi nhánh không tồn tại hoặc không thuộc quyền quản lý" });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const orders = await prisma.order.findMany({
      where: {
        branchID,
        orderTime: { gte: startOfDay, lte: endOfDay },
        // Chỉ lấy các đơn chưa hoàn tất hoặc đã sẵn sàng nhưng chưa phục vụ hết
        orderStatus: { not: "Cancelled" },
      },
      include: {
        orderTables: { include: { table: { select: { tableName: true } } } },
        orderDetails: {
          where: categoryID ? { product: { categoryID } } : {},
          include: { product: { select: { name: true, categoryID: true } } },
        },
      },
      orderBy: { orderTime: "asc" }, // FIFO
    });

    // Lọc bỏ những đơn không có món ăn nào thuộc category được chọn (nếu có categoryID)
    const filteredOrders = orders.filter(o => o.orderDetails.length > 0);

    const result = filteredOrders.map(o => ({
      orderID: o.orderID,
      tableName: o.orderTables.map(ot => ot.table.tableName).join(", "),
      orderTime: o.orderTime,
      customerNote: o.customerNote,
      items: o.orderDetails.map(d => ({
        orderDetailID: d.orderDetailID,
        productName: d.product.name,
        quantity: d.quantity,
        note: d.note,
        itemStatus: d.itemStatus,
      })),
    }));

    res.json(result);
  } catch (error) {
    console.error("getKitchenOrders error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// 2. Cập nhật trạng thái món ăn (Bếp/Staff dùng)
export const updateItemStatus = async (req, res) => {
  try {
    const { orderDetailID, status } = req.body;

    // Kiểm tra status hợp lệ
    const validStatuses = ["Pending", "Cooking", "Ready", "Served", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const updated = await prisma.orderDetail.update({
      where: { orderDetailID: parseInt(orderDetailID) },
      data: { itemStatus: status },
      include: { order: true }
    });

    // Nếu món được Served, kiểm tra xem toàn bộ đơn đã xong chưa
    if (status === "Served") {
      const remaining = await prisma.orderDetail.count({
        where: {
          orderID: updated.orderID,
          itemStatus: { notIn: ["Served", "Cancelled"] }
        }
      });

      if (remaining === 0) {
        await prisma.order.update({
          where: { orderID: updated.orderID },
          data: { orderStatus: "Completed", paymentStatus: "Paid" } // Cập nhật status order
        });
      }
    }

    res.json({ message: "Cập nhật trạng thái món thành công", updated });
  } catch (error) {
    console.error("updateItemStatus error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};
