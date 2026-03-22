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

/* ===============================================================
   TABLE MANAGEMENT
=============================================================== */

// Helper: map DB status → tiếng Việt
const mapStatus = (s) => s === "Occupied" ? "Đang ngồi" : "Trống";
// Helper: map tiếng Việt → DB status
const mapStatusToDB = (s) => s === "Đang ngồi" ? "Occupied" : "Available";

/* ── GET /api/manager/tables ── */
export const getTables = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user.userId);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const tables = await prisma.table.findMany({
      where: { branchID },
      orderBy: { tableID: "asc" },
      select: { tableID: true, tableName: true, capacity: true, status: true, qrCode: true, mergedGroupId: true },
    });

    // Build mergedWith: danh sách các tableID cùng nhóm (trừ chính nó)
    const result = tables.map(t => {
      let mergedWith = [];
      if (t.mergedGroupId) {
        mergedWith = tables
          .filter(other => other.mergedGroupId === t.mergedGroupId && other.tableID !== t.tableID)
          .map(other => other.tableID);
      }
      return {
        id:            t.tableID,
        name:          t.tableName ?? `Bàn ${t.tableID}`,
        capacity:      t.capacity  ?? 4,
        status:        mapStatus(t.status),
        qrCode:        t.qrCode,
        mergedGroupId: t.mergedGroupId ?? null,
        mergedWith,               // mảng ID các bàn cùng nhóm
      };
    });

    res.json(result);
  } catch (err) {
    console.error("getTables error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ── POST /api/manager/tables ── */
export const createTable = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user.userId);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const { name, capacity } = req.body;
    if (!name) return res.status(400).json({ message: "Tên bàn không được để trống." });

    const table = await prisma.table.create({
      data: {
        branchID,
        tableName: name,
        capacity:  parseInt(capacity) || 4,
        status:    "Available",
      },
    });

    res.status(201).json({
      id:       table.tableID,
      name:     table.tableName,
      capacity: table.capacity,
      status:   "Trống",
      qrCode:   null,
    });
  } catch (err) {
    console.error("createTable error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ── PUT /api/manager/tables/:id ── */
export const updateTable = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user.userId);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const tableID = parseInt(req.params.id);
    const { name, capacity } = req.body;

    const existing = await prisma.table.findFirst({ where: { tableID, branchID } });
    if (!existing) return res.status(404).json({ message: "Không tìm thấy bàn." });

    const updated = await prisma.table.update({
      where: { tableID },
      data: {
        ...(name     && { tableName: name }),
        ...(capacity && { capacity: parseInt(capacity) }),
      },
    });

    res.json({
      id:       updated.tableID,
      name:     updated.tableName,
      capacity: updated.capacity,
      status:   mapStatus(updated.status),
      qrCode:   updated.qrCode,
    });
  } catch (err) {
    console.error("updateTable error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ── PATCH /api/manager/tables/:id/status ── */
export const updateTableStatus = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user.userId);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const tableID = parseInt(req.params.id);
    const { status } = req.body; // "Trống" | "Đang ngồi"

    const existing = await prisma.table.findFirst({ where: { tableID, branchID } });
    if (!existing) return res.status(404).json({ message: "Không tìm thấy bàn." });

    const dbStatus = mapStatusToDB(status);

    // Khi thanh toán (về Trống): xóa mergedGroupId của toàn bộ nhóm
    if (dbStatus === "Available" && existing.mergedGroupId) {
      await prisma.table.updateMany({
        where: { mergedGroupId: existing.mergedGroupId, branchID },
        data:  { status: "Available", mergedGroupId: null },
      });
      return res.json({ id: tableID, status: "Trống", mergedGroupId: null });
    }

    const updated = await prisma.table.update({
      where: { tableID },
      data: { status: dbStatus },
    });

    res.json({ id: updated.tableID, status: mapStatus(updated.status), mergedGroupId: updated.mergedGroupId ?? null });
  } catch (err) {
    console.error("updateTableStatus error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ── DELETE /api/manager/tables/:id ── */
export const deleteTable = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user.userId);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const tableID = parseInt(req.params.id);
    const existing = await prisma.table.findFirst({ where: { tableID, branchID } });
    if (!existing) return res.status(404).json({ message: "Không tìm thấy bàn." });

    await prisma.table.delete({ where: { tableID } });
    res.json({ message: "Đã xoá bàn thành công." });
  } catch (err) {
    console.error("deleteTable error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ── POST /api/manager/tables/merge ──────────────────────────────────────────
   Body: { sourceTableId, targetTableId }
   Logic:
    1. Tìm Order đang active (Open/Serving) của sourceTable và targetTable
    2. Nếu cả 2 đều có order → gộp OrderDetails của targetOrder vào sourceOrder
       rồi xóa targetOrder
    3. Nếu chỉ 1 bên có order → thêm bàn kia vào OrderTable của order đó
    4. Nếu không bên nào có order → chỉ ghi nhận (không có gì để gộp)
    5. Cập nhật totalAmount của order còn lại
──────────────────────────────────────────────────────────────────────────── */
export const mergeTables = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user.userId);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const { sourceTableId, targetTableId } = req.body;
    if (!sourceTableId || !targetTableId)
      return res.status(400).json({ message: "Thiếu sourceTableId hoặc targetTableId." });
    if (sourceTableId === targetTableId)
      return res.status(400).json({ message: "Không thể gộp bàn với chính nó." });

    const srcId = parseInt(sourceTableId);
    const tgtId = parseInt(targetTableId);

    // Xác nhận 2 bàn đều thuộc chi nhánh này
    const [srcTable, tgtTable] = await Promise.all([
      prisma.table.findFirst({ where: { tableID: srcId, branchID } }),
      prisma.table.findFirst({ where: { tableID: tgtId, branchID } }),
    ]);
    if (!srcTable) return res.status(404).json({ message: `Không tìm thấy bàn nguồn (id=${srcId}).` });
    if (!tgtTable) return res.status(404).json({ message: `Không tìm thấy bàn đích (id=${tgtId}).` });

    // Tìm Order đang active của mỗi bàn
    const findActiveOrder = async (tableID) => {
      const ot = await prisma.orderTable.findFirst({
        where: {
          tableID,
          order: { orderStatus: { in: ["Open", "Serving"] } },
        },
        include: { order: { include: { orderDetails: true } } },
      });
      return ot?.order ?? null;
    };

    const [srcOrder, tgtOrder] = await Promise.all([
      findActiveOrder(srcId),
      findActiveOrder(tgtId),
    ]);

    let mergedOrderId;

    if (srcOrder && tgtOrder) {
      // ── Cả 2 đều có order: gộp tgtOrder vào srcOrder ──
      await prisma.$transaction(async (tx) => {
        // Di chuyển OrderDetails từ targetOrder → sourceOrder
        await tx.orderDetail.updateMany({
          where: { orderID: tgtOrder.orderID },
          data:  { orderID: srcOrder.orderID },
        });
        // Gắn targetTable vào sourceOrder (nếu chưa có)
        await tx.orderTable.upsert({
          where:  { orderID_tableID: { orderID: srcOrder.orderID, tableID: tgtId } },
          create: { orderID: srcOrder.orderID, tableID: tgtId },
          update: {},
        });
        // Xoá liên kết của targetTable với targetOrder
        await tx.orderTable.deleteMany({
          where: { orderID: tgtOrder.orderID, tableID: tgtId },
        });
        // Xoá targetOrder (cascade xoá Invoice nếu có)
        await tx.order.delete({ where: { orderID: tgtOrder.orderID } });
        // Cập nhật lại totalAmount của sourceOrder
        const details = await tx.orderDetail.findMany({
          where: { orderID: srcOrder.orderID },
          select: { quantity: true, unitPrice: true },
        });
        const newTotal = details.reduce(
          (sum, d) => sum + d.quantity * parseFloat(d.unitPrice), 0
        );
        await tx.order.update({
          where: { orderID: srcOrder.orderID },
          data:  { totalAmount: newTotal },
        });
      });
      mergedOrderId = srcOrder.orderID;

    } else if (srcOrder && !tgtOrder) {
      // ── Chỉ sourceTable có order: thêm targetTable vào order đó ──
      await prisma.orderTable.upsert({
        where:  { orderID_tableID: { orderID: srcOrder.orderID, tableID: tgtId } },
        create: { orderID: srcOrder.orderID, tableID: tgtId },
        update: {},
      });
      mergedOrderId = srcOrder.orderID;

    } else if (!srcOrder && tgtOrder) {
      // ── Chỉ targetTable có order: thêm sourceTable vào order đó ──
      await prisma.orderTable.upsert({
        where:  { orderID_tableID: { orderID: tgtOrder.orderID, tableID: srcId } },
        create: { orderID: tgtOrder.orderID, tableID: srcId },
        update: {},
      });
      mergedOrderId = tgtOrder.orderID;

    } else {
      // ── Không bàn nào có order đang mở ──
      mergedOrderId = null;
    }

    // ── Cập nhật mergedGroupId cho cả 2 bàn vào cùng 1 nhóm ──
    // Ưu tiên dùng groupId đã có (nếu bàn đã trong 1 nhóm trước đó)
    const existingGroupId = srcTable.mergedGroupId || tgtTable.mergedGroupId;
    const groupId = existingGroupId || `grp_${srcId}_${tgtId}_${Date.now()}`;

    // Lấy tất cả bàn trong các nhóm cũ của cả 2 (để merge nhóm lại)
    const oldGroupIds = [srcTable.mergedGroupId, tgtTable.mergedGroupId].filter(Boolean);
    if (oldGroupIds.length > 0) {
      // Đổi toàn bộ bàn từ các nhóm cũ sang groupId mới
      await prisma.table.updateMany({
        where: { mergedGroupId: { in: oldGroupIds }, branchID },
        data:  { mergedGroupId: groupId },
      });
    }
    // Đảm bảo cả 2 bàn hiện tại cũng có groupId
    await prisma.table.updateMany({
      where: { tableID: { in: [srcId, tgtId] } },
      data:  { mergedGroupId: groupId },
    });

    // Trả về mergedWith list cho cả 2 bàn
    const groupTables = await prisma.table.findMany({
      where: { mergedGroupId: groupId, branchID },
      select: { tableID: true, tableName: true },
    });
    const mergedWithIds = groupTables.map(t => t.tableID);

    res.json({
      message: `Đã gộp hóa đơn ${srcTable.tableName} ↔ ${tgtTable.tableName} thành công.`,
      mergedOrderId,
      mergedGroupId: groupId,
      mergedWithIds,  // tất cả ID trong nhóm (kể cả chính bàn nguồn)
      sourceTable: { id: srcId, name: srcTable.tableName },
      targetTable: { id: tgtId, name: tgtTable.tableName },
    });
  } catch (err) {
    console.error("mergeTables error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ── POST /api/manager/confirm-order ──────────────────────────────────────
   Body: { tableId, items: [{productID, quantity, price}] }
   Logic: 
    1. Tạo/Tìm Order hiện tại của bàn
    2. Thêm OrderDetails
    3. Cập nhật trạng thái Bàn -> Occupied
──────────────────────────────────────────────────────────────────────────── */
export const confirmManagerOrder = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user.userId);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const { tableId, items } = req.body;
    if (!tableId || !items || !items.length) {
      return res.status(400).json({ message: "Thiếu thông tin bàn hoặc món ăn." });
    }

    const tId = parseInt(tableId);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Tìm xem bàn có Order nào đang mở (Open/Serving) không
      const activeOrderTable = await tx.orderTable.findFirst({
        where: {
          tableID: tId,
          order: { orderStatus: { in: ["Open", "Serving"] } }
        },
        include: { order: true }
      });

      let orderID;
      const totalAmountToAdd = items.reduce((sum, item) => sum + (item.quantity * parseFloat(item.price)), 0);

      if (activeOrderTable) {
        // Gộp vào order cũ
        orderID = activeOrderTable.orderID;
        await tx.order.update({
          where: { orderID },
          data: { totalAmount: { increment: totalAmountToAdd } }
        });
      } else {
        // Tạo order mới
        const newOrder = await tx.order.create({
          data: {
            branchID,
            createdBy: req.user.userId,
            totalAmount: totalAmountToAdd,
            orderStatus: "Serving",
            paymentStatus: "Unpaid",
          }
        });
        orderID = newOrder.orderID;
        
        await tx.orderTable.create({
          data: { orderID, tableID: tId }
        });
      }

      // 2. Tạo OrderDetails cho các món mới
      await tx.orderDetail.createMany({
        data: items.map(item => ({
          orderID,
          productID: item.productID,
          quantity: item.quantity,
          unitPrice: parseFloat(item.price),
          itemStatus: "Served" // Vì quản lý gọi nên coi như đã phục vụ
        }))
      });

      // 3. Cập nhật trạng thái Bàn -> Occupied
      const table = await tx.table.findUnique({ where: { tableID: tId } });
      if (table.mergedGroupId) {
        await tx.table.updateMany({
          where: { mergedGroupId: table.mergedGroupId, branchID },
          data: { status: "Occupied" }
        });
      } else {
        await tx.table.update({
          where: { tableID: tId },
          data: { status: "Occupied" }
        });
      }

      return { orderID };
    });

    res.json({
      message: "Xác nhận order thành công (v3)!",
      ...result
    });

  } catch (err) {
    console.error("confirmManagerOrder error:", err);
    res.status(500).json({ message: err.message || "Lỗi xác nhận order" });
  }
};


/* ===============================================================
   SERVICE REQUESTS
=============================================================== */

/* ── GET /api/manager/service-requests ──
   Query: type (optional), page (default 1), limit (default 10)
──────────────────────────────────────────────────────────────── */
export const getServiceRequests = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user.userId);
    if (!branchID)
      return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const { type, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Map frontend tab label -> Prisma enum KEY (not @map value)
    const typeMap = {
      "Gọi món":    "GoiMon",
      "Thanh toán": "ThanhToan",
    };
    const dbType = type ? (typeMap[type] ?? type) : undefined;

    const where = {
      branchID,
      ...(dbType ? { requestType: dbType } : {}),
    };

    // Today range for stats
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [requests, total, pendingCount, totalToday] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        orderBy: { createdTime: "desc" },
        skip,
        take: parseInt(limit),
        include: { table: { select: { tableName: true } } },
      }),
      prisma.serviceRequest.count({ where }),
      // Đếm các yêu cầu đang xử lý (chưa xong)
      prisma.serviceRequest.count({
        where: { branchID, status: "Đang xử lý" },
      }),
      prisma.serviceRequest.count({
        where: { branchID, createdTime: { gte: todayStart, lte: todayEnd } },
      }),
    ]);

    // Map Prisma enum KEY -> display label + icon
    const displayTypeMap = {
      GoiMon:    { label: "Gọi món",    icon: "bell" },
      ThanhToan: { label: "Thanh toán", icon: "credit-card" },
    };

    const data = requests.map((r) => ({
      requestID:   r.requestID,
      tableID:     r.tableID,
      tableName:   r.table?.tableName ?? `Bàn ${r.tableID}`,
      requestType: r.requestType,
      displayType: displayTypeMap[r.requestType] ?? { label: r.requestType, icon: "more" },
      status:      r.status,
      createdTime: r.createdTime,
    }));

    res.json({
      data,
      total,
      page:       parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      stats: { pending: pendingCount, totalToday },
    });
  } catch (err) {
    console.error("getServiceRequests error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ── PATCH /api/manager/service-requests/:id ──
   Body: { status: "Đã xử lý" | "Đang chờ" | ... }
──────────────────────────────────────────────────────────────── */
export const updateServiceRequestStatus = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user.userId);
    if (!branchID)
      return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const requestID = parseInt(req.params.id);
    const { status } = req.body;
    if (!status)
      return res.status(400).json({ message: "Thiếu trạng thái cần cập nhật." });

    const existing = await prisma.serviceRequest.findFirst({
      where: { requestID, branchID },
    });
    if (!existing)
      return res.status(404).json({ message: "Không tìm thấy yêu cầu phục vụ." });

    const updated = await prisma.serviceRequest.update({
      where: { requestID },
      data:  { status },
    });

    res.json({ requestID: updated.requestID, status: updated.status });
  } catch (err) {
    console.error("updateServiceRequestStatus error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ===============================================================
   7. BRANCH INFO 
   GET /api/manager/branch-info
=============================================================== */
export const getBranchInfo = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user.userId);
    if (!branchID)
      return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const branch = await prisma.branch.findUnique({
      where: { branchID },
      include: {
        restaurant: {
          select: {
            name: true,
            description: true,
            logo: true,
            coverImage: true,
            taxCode: true,
          }
        }
      }
    });

    if (!branch) {
      return res.status(404).json({ message: "Chi nhánh không tồn tại" });
    }

    // Map logo and coverImage to logoURL and coverImageURL for frontend compatibility
    const responseData = {
      ...branch,
      restaurant: {
        ...branch.restaurant,
        logoURL: branch.restaurant.logo,
        coverImageURL: branch.restaurant.coverImage
      }
    };

    res.json(responseData);
  } catch (err) {
    console.error("getBranchInfo error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ===============================================================
   8. UPLOAD COVER IMAGE FOR BRANCH (RESTAURANT)
   PATCH /api/manager/branch-info/cover
=============================================================== */
export const uploadBranchCoverImage = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user.userId);
    if (!branchID) {
      return res.status(404).json({ message: "Không tìm thấy chi nhánh." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn ảnh bìa." });
    }

    // Get branch to find restaurant ID
    const branch = await prisma.branch.findUnique({
      where: { branchID },
      select: { restaurantID: true },
    });

    if (!branch) {
      return res.status(404).json({ message: "Chi nhánh không tồn tại." });
    }

    const coverImageURL = `/uploads/${req.file.filename}`;

    // Update restaurant's cover image
    await prisma.restaurant.update({
      where: { restaurantID: branch.restaurantID },
      data: { coverImage: coverImageURL },
    });

    res.json({ message: "Đã cập nhật ảnh bìa thành công", coverImageURL });
  } catch (err) {
    console.error("uploadBranchCoverImage error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ===============================================================
   9. BRANCH MENU MANAGEMENT 
=============================================================== */

export const getBranchMenuItems = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user.userId);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const branch = await prisma.branch.findUnique({
      where: { branchID },
      select: { restaurantID: true }
    });

    if (!branch) return res.status(404).json({ message: "Chi nhánh không tồn tại." });

    // Lấy tất cả category và product của nhà hàng
    const categories = await prisma.category.findMany({
      where: { restaurantID: branch.restaurantID },
      include: {
        products: {
          include: {
            branchMenus: {
              where: { branchID }
            }
          }
        }
      },
      orderBy: { displayOrder: 'asc' }
    });

    // Formatting response: merge product with its branchMenu status
    const formattedCategories = categories.map(cat => ({
      ...cat,
      products: cat.products.map(p => {
        const branchMenu = p.branchMenus[0];
        return {
          productID: p.productID,
          name: p.name,
          description: p.description,
          price: p.price,
          imageURL: p.imageURL,
          // Defaults for items without BranchMenu records yet
          isAvailable: branchMenu ? branchMenu.isAvailable : false,
          quantity: branchMenu ? branchMenu.quantity : 0
        };
      })
    }));

    res.json(formattedCategories);
  } catch (err) {
    console.error("getBranchMenuItems error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const saveBranchMenu = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user.userId);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const { items } = req.body; 

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
    }

    // Upsert each item
    await prisma.$transaction(
      items.map(item => 
        prisma.branchMenu.upsert({
          where: {
            branchID_productID: {
              branchID: branchID,
              productID: item.productID
            }
          },
          update: {
            isAvailable: item.isAvailable,
            quantity: item.quantity
          },
          create: {
            branchID: branchID,
            productID: item.productID,
            isAvailable: item.isAvailable,
            quantity: item.quantity
          }
        })
      )
    );

    res.json({ message: "Đã lưu thực đơn chi nhánh thành công." });
  } catch (err) {
    console.error("saveBranchMenu error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
