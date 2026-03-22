import prisma from "../config/prismaClient.js";
import { PayOS } from "@payos/node";

// Initialize PayOS (reuse keys from env)
let payos = null;
if (process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY) {
  payos = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
  );
}
import bcrypt from "bcrypt";
import { ExcelExportStrategy, PdfExportStrategy } from "../config/ExportStrategy.js";
import { sendNewAccountEmail } from "../config/emailService.js";

/* ─── helper: lấy branchID mà user này quản lý ─── */
const getManagerBranchId = async (user) => {
  if (!user || !user.userId) {
    console.error("getManagerBranchId: Missing user or userId", user);
    return null;
  }

  const uId = parseInt(user.userId);
  if (isNaN(uId)) {
    console.error("getManagerBranchId: userId is not a number", user.userId);
    return null;
  }

  if (user.role === "BranchManager") {
    const branch = await prisma.branch.findFirst({
      where: { managerUserID: uId },
      select: { branchID: true },
    });
    return branch?.branchID ?? null;
  }
  
  // For Staff / Kitchen / User, take branchID from User table
  const dbUser = await prisma.user.findUnique({
    where: { userID: uId },
    select: { branchID: true },
  });
  return dbUser?.branchID ?? null;
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

/* ─── helper: phát tín hiệu realtime qua socket ─── */
const emitTableUpdate = (req) => {
  const io = req.app.get("io");
  if (io) {
    io.emit("tableUpdate", { timestamp: Date.now() });
    console.log("📢 Emitted tableUpdate via Socket.io");
  }
};

/* ===============================================================
   1. DASHBOARD STATS  (có filter theo period)
   GET /api/manager/dashboard/stats?period=today|7days|month
=============================================================== */
export const getManagerDashboardStats = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    if (!branchID)
      return res.status(404).json({ message: "Không tìm thấy chi nhánh được gán cho tài khoản này." });

    const period = req.query.period || "today";
    const { start, end } = getPeriodRange(period);
    const { start: prevStart, end: prevEnd } = getPrevPeriodRange(period);

    const [
      branch, tables,
      currRevAgg, prevRevAgg,
      currOrders, prevOrders,
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
      totalTables: tables.length,
      occupiedTables: tables.filter(t => t.status === "Occupied").length,
      openOrders,
      pendingServiceRequests: pendingServiceReqs,
      // Stat cards
      totalRevenue: currRev,
      totalOrders: currOrders,
      avgOrderValue,
      revenueGrowth: calcGrowth(currRev, prevRev),
      ordersGrowth: calcGrowth(currOrders, prevOrders),
      avgGrowth: calcGrowth(avgOrderValue, prevAvg),
    });
  } catch (err) {
    console.error("getManagerDashboardStats error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ===============================================================
   1.1 EXPORT REVENUE REPORT
   GET /api/manager/dashboard/export-revenue?startDate=...&endDate=...
=============================================================== */
export const exportRevenueReport = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    if (!branchID)
      return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const { startDate, endDate, type = "excel" } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Vui lòng truyền startDate và endDate." });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const [branch, orders] = await Promise.all([
      prisma.branch.findUnique({
        where: { branchID },
        select: { name: true, address: true }
      }),
      prisma.order.findMany({
        where: {
          branchID: branchID,
          orderStatus: "Completed",
          orderTime: {
            gte: start,
            lte: end,
          },
        },
        select: {
          orderID: true,
          orderTime: true,
          totalAmount: true,
          paymentStatus: true,
          creator: {
            select: { fullName: true, username: true }
          },
          orderTables: {
            select: {
              table: { select: { tableName: true } }
            }
          }
        },
        orderBy: { orderTime: "asc" }
      })
    ]);

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "Không có dữ liệu trong thời gian này." });
    }

    const reportData = {
      branch,
      orders,
      startDate: start,
      endDate: end
    };

    let exportStrategy;
    if (type === "pdf") {
      exportStrategy = new PdfExportStrategy();
    } else {
      exportStrategy = new ExcelExportStrategy();
    }
    
    await exportStrategy.exportData(reportData, res);

  } catch (err) {
    console.error("exportRevenueReport error:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi xuất báo cáo." });
  }
};

/* ===============================================================
   2. REVENUE TREND — bar chart by month (6 tháng gần nhất)
   GET /api/manager/dashboard/revenue-trend
=============================================================== */
export const getManagerRevenueTrend = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
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
      month: r.month,
      revenue: parseFloat(r.revenue),
      orders: Number(r.orders),
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
    const branchID = await getManagerBranchId(req.user);
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
    const branchID = await getManagerBranchId(req.user);
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
      productID: r.productID,
      name: productMap[r.productID] ?? "Sản phẩm không xác định",
      quantity: r._sum.quantity || 0,
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
    const branchID = await getManagerBranchId(req.user);
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
    const branchID = await getManagerBranchId(req.user);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const tables = await prisma.table.findMany({
      where: { branchID },
      orderBy: { tableID: "asc" },
      select: { tableID: true, tableName: true, capacity: true, status: true, qrCode: true, mergedGroupId: true, isActive: true },
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
        id: t.tableID,
        name: t.tableName ?? `Bàn ${t.tableID}`,
        capacity: t.capacity ?? 4,
        status: mapStatus(t.status),
        qrCode: t.qrCode,
        mergedGroupId: t.mergedGroupId ?? null,
        mergedWith,               // mảng ID các bàn cùng nhóm
        isActive: t.isActive,
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
    const branchID = await getManagerBranchId(req.user);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const { name, capacity } = req.body;
    if (!name) return res.status(400).json({ message: "Tên bàn không được để trống." });

    const table = await prisma.table.create({
      data: {
        branchID,
        tableName: name,
        capacity: parseInt(capacity) || 4,
        status: "Available",
      },
    });

    res.status(201).json({
      id: table.tableID,
      name: table.tableName,
      capacity: table.capacity,
      status: "Trống",
      qrCode: null,
    });

    emitTableUpdate(req);
  } catch (err) {
    console.error("createTable error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ── PUT /api/manager/tables/:id ── */
export const updateTable = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const tableID = parseInt(req.params.id);
    const { name, capacity, isActive } = req.body;

    const existing = await prisma.table.findFirst({ where: { tableID, branchID } });
    if (!existing) return res.status(404).json({ message: "Không tìm thấy bàn." });

    const updated = await prisma.table.update({
      where: { tableID },
      data: {
        ...(name && { tableName: name }),
        ...(capacity && { capacity: parseInt(capacity) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({
      id: updated.tableID,
      name: updated.tableName,
      capacity: updated.capacity,
      status: mapStatus(updated.status),
      qrCode: updated.qrCode,
      isActive: updated.isActive,
    });

    emitTableUpdate(req);
  } catch (err) {
    console.error("updateTable error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ── PATCH /api/manager/tables/:id/status ── */
export const updateTableStatus = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
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
        data: { status: "Available", mergedGroupId: null },
      });
      return res.json({ id: tableID, status: "Trống", mergedGroupId: null });
    }

    const updated = await prisma.table.update({
      where: { tableID },
      data: { status: dbStatus },
    });

    res.json({ id: updated.tableID, status: mapStatus(updated.status), mergedGroupId: updated.mergedGroupId ?? null });

    emitTableUpdate(req);
  } catch (err) {
    console.error("updateTableStatus error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ── DELETE /api/manager/tables/:id ── */
export const deleteTable = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const tableID = parseInt(req.params.id);
    const existing = await prisma.table.findFirst({ where: { tableID, branchID } });
    if (!existing) return res.status(404).json({ message: "Không tìm thấy bàn." });

    await prisma.table.delete({ where: { tableID } });
    res.json({ message: "Đã xoá bàn thành công." });

    emitTableUpdate(req);
  } catch (err) {
    console.error("deleteTable error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ── POST /api/manager/tables/merge ── */
export const mergeTables = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const { sourceTableId, targetTableId } = req.body;
    if (!sourceTableId || !targetTableId)
      return res.status(400).json({ message: "Thiếu sourceTableId hoặc targetTableId." });
    if (sourceTableId === targetTableId)
      return res.status(400).json({ message: "Không thể gộp bàn với chính nó." });

    const srcId = parseInt(sourceTableId);
    const tgtId = parseInt(targetTableId);

    const [srcTable, tgtTable] = await Promise.all([
      prisma.table.findFirst({ where: { tableID: srcId, branchID } }),
      prisma.table.findFirst({ where: { tableID: tgtId, branchID } }),
    ]);
    if (!srcTable) return res.status(404).json({ message: `Không tìm thấy bàn nguồn (id=${srcId}).` });
    if (!tgtTable) return res.status(404).json({ message: `Không tìm thấy bàn đích (id=${tgtId}).` });

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
      await prisma.$transaction(async (tx) => {
        // Move all items from tgtOrder to srcOrder
        await tx.orderDetail.updateMany({
          where: { orderID: tgtOrder.orderID },
          data: { orderID: srcOrder.orderID },
        });

        // Ensure target table is linked to srcOrder
        await tx.orderTable.upsert({
          where: { orderID_tableID: { orderID: srcOrder.orderID, tableID: tgtId } },
          create: { orderID: srcOrder.orderID, tableID: tgtId },
          update: {},
        });

        // Remove old links from tgtOrder
        await tx.orderTable.deleteMany({
          where: { orderID: tgtOrder.orderID },
        });

        // Delete tgtOrder
        await tx.order.delete({ where: { orderID: tgtOrder.orderID } });

        // Recalculate totalAmount for srcOrder based on non-cancelled items
        const details = await tx.orderDetail.findMany({
          where: { orderID: srcOrder.orderID, itemStatus: { not: 'Cancelled' } },
          select: { quantity: true, unitPrice: true },
        });
        const newTotal = details.reduce(
          (sum, d) => sum + d.quantity * parseFloat(d.unitPrice), 0
        );
        await tx.order.update({
          where: { orderID: srcOrder.orderID },
          data: { totalAmount: newTotal },
        });
      });
      mergedOrderId = srcOrder.orderID;

    } else if (srcOrder && !tgtOrder) {
      await prisma.orderTable.upsert({
        where: { orderID_tableID: { orderID: srcOrder.orderID, tableID: tgtId } },
        create: { orderID: srcOrder.orderID, tableID: tgtId },
        update: {},
      });
      mergedOrderId = srcOrder.orderID;

    } else if (!srcOrder && tgtOrder) {
      await prisma.orderTable.upsert({
        where: { orderID_tableID: { orderID: tgtOrder.orderID, tableID: srcId } },
        create: { orderID: tgtOrder.orderID, tableID: srcId },
        update: {},
      });
      mergedOrderId = tgtOrder.orderID;

    } else {
      mergedOrderId = null;
    }

    const existingGroupId = srcTable.mergedGroupId || tgtTable.mergedGroupId;
    const groupId = existingGroupId || `grp_${srcId}_${tgtId}_${Date.now()}`;

    const oldGroupIds = [srcTable.mergedGroupId, tgtTable.mergedGroupId].filter(Boolean);
    if (oldGroupIds.length > 0) {
      await prisma.table.updateMany({
        where: { mergedGroupId: { in: oldGroupIds }, branchID },
        data: { mergedGroupId: groupId },
      });
    }
    await prisma.table.updateMany({
      where: { tableID: { in: [srcId, tgtId] } },
      data: { mergedGroupId: groupId },
    });

    const groupTables = await prisma.table.findMany({
      where: { mergedGroupId: groupId, branchID },
      select: { tableID: true, tableName: true },
    });
    const mergedWithIds = groupTables.map(t => t.tableID);

    res.json({
      message: `Đã gộp hóa đơn ${srcTable.tableName} ↔ ${tgtTable.tableName} thành công.`,
      mergedOrderId,
      mergedGroupId: groupId,
      mergedWithIds,
      sourceTable: { id: srcId, name: srcTable.tableName },
      targetTable: { id: tgtId, name: tgtTable.tableName },
    });

    emitTableUpdate(req);
  } catch (err) {
    console.error("mergeTables error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ── POST /api/manager/confirm-order ── */
export const confirmManagerOrder = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const { tableId, items } = req.body;
    if (!tableId || !items || !items.length) {
      return res.status(400).json({ message: "Thiếu thông tin bàn hoặc món ăn." });
    }

    const tId = parseInt(tableId);

    const result = await prisma.$transaction(async (tx) => {
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
        orderID = activeOrderTable.orderID;
        await tx.order.update({
          where: { orderID },
          data: { totalAmount: { increment: totalAmountToAdd } }
        });
      } else {
        const newOrder = await tx.order.create({
          data: {
            branchID,
            createdBy: req.user.userId,
            totalAmount: totalAmountToAdd,
            orderStatus: "Open",
            paymentStatus: "Unpaid",
          }
        });
        orderID = newOrder.orderID;

        await tx.orderTable.create({
          data: { orderID, tableID: tId }
        });
      }

      await tx.orderDetail.createMany({
        data: items.map(item => ({
          orderID,
          productID: item.productID,
          quantity: item.quantity,
          unitPrice: parseFloat(item.price),
          itemStatus: "Pending"
        }))
      });

      const table = await tx.table.findUnique({ where: { tableID: tId } });
      if (table.mergedGroupId) {
        // Lấy tất cả bàn trong nhóm gộp
        const groupTables = await tx.table.findMany({
          where: { mergedGroupId: table.mergedGroupId, branchID },
          select: { tableID: true },
        });

        // Link tất cả bàn trong nhóm vào cùng 1 order (upsert để tránh duplicate)
        for (const t of groupTables) {
          await tx.orderTable.upsert({
            where: { orderID_tableID: { orderID, tableID: t.tableID } },
            create: { orderID, tableID: t.tableID },
            update: {},
          });
        }

        // Đánh dấu tất cả bàn trong nhóm là Occupied
        await tx.table.updateMany({
          where: { mergedGroupId: table.mergedGroupId, branchID },
          data: { status: "Occupied" },
        });
      } else {
        await tx.table.update({
          where: { tableID: tId },
          data: { status: "Occupied" },
        });
      }

      return { orderID };
    });

    res.json({
      message: "Xác nhận order thành công (v3)!",
      ...result
    });

    emitTableUpdate(req);
  } catch (err) {
    console.error("confirmManagerOrder error:", err);
    res.status(500).json({ message: err.message || "Lỗi xác nhận order" });
  }
};

/* ===============================================================
   NEW: CHECKOUT & BILL RETRIEVAL
=============================================================== */

/* ── GET /api/manager/tables/:id/bill ── */
export const getBillByTable = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    const tableID = parseInt(req.params.id);

    const orderTable = await prisma.orderTable.findFirst({
      where: {
        tableID,
        order: { orderStatus: { in: ["Open", "Serving"] }, branchID }
      },
      include: {
        order: {
          include: {
            orderDetails: { include: { product: true } },
            orderTables: { include: { table: true } }
          }
        }
      }
    });

    if (!orderTable) {
      return res.status(404).json({ message: "Bàn này hiện không có hóa đơn chưa thanh toán." });
    }

    const order = orderTable.order;
    const tables = order.orderTables.map(ot => ({ id: ot.table.tableID, name: ot.table.tableName }));

    const itemsMap = {};
    order.orderDetails.forEach(det => {
      // Chỉ tính các món không bị huỷ
      if (det.itemStatus === 'Cancelled') return;

      const pID = det.productID;
      if (itemsMap[pID]) {
        itemsMap[pID].quantity += det.quantity;
      } else {
        itemsMap[pID] = {
          productID: pID,
          name: det.product?.name || "Món đã xóa",
          imageURL: det.product?.imageURL,
          price: parseFloat(det.unitPrice),
          quantity: det.quantity
        };
      }
    });

    res.json({
      orderID: order.orderID,
      tables,
      items: Object.values(itemsMap),
      totalAmount: parseFloat(order.totalAmount),
      orderTime: order.orderTime
    });
  } catch (err) {
    console.error("getBillByTable error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ── POST /api/manager/tables/:id/checkout ── */
export const processManagerCheckout = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    const tableID = parseInt(req.params.id);
    const { paymentMethod = "Cash" } = req.body;

    const orderTable = await prisma.orderTable.findFirst({
      where: {
        tableID,
        order: { orderStatus: { in: ["Open", "Serving"] }, branchID }
      },
      include: {
        order: { include: { orderDetails: true, orderTables: true } }
      }
    });

    if (!orderTable) {
      return res.status(404).json({ message: "Không tìm thấy hóa đơn cần thanh toán." });
    }

    const order = orderTable.order;
    const tableIdsInvolved = order.orderTables.map(ot => ot.tableID);

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          orderID: order.orderID,
          subTotal: order.totalAmount,
          totalAmount: order.totalAmount,
          status: "Issued",
          issuedDate: new Date()
        }
      });

      await tx.invoiceDetail.createMany({
        data: order.orderDetails
          .filter(det => det.itemStatus !== 'Cancelled') // Bỏ qua món đã huỷ
          .map(det => ({
            invoiceID: invoice.invoiceID,
            orderDetailID: det.orderDetailID,
            productID: det.productID,
            quantity: det.quantity,
            unitPrice: det.unitPrice,
            totalPrice: parseFloat(det.unitPrice) * det.quantity,
            status: "Finalized"
          }))
      });

      await tx.transaction.create({
        data: {
          invoiceID: invoice.invoiceID,
          amount: order.totalAmount,
          paymentMethod: paymentMethod,
          status: "Success"
        }
      });

      await tx.order.update({
        where: { orderID: order.orderID },
        data: { orderStatus: "Completed", paymentStatus: "Paid" }
      });

      await tx.table.updateMany({
        where: { tableID: { in: tableIdsInvolved } },
        data: { status: "Available", mergedGroupId: null }
      });

      return invoice;
    });

    res.json({ message: "Thanh toán thành công!", invoiceID: result.invoiceID });

    emitTableUpdate(req);
  } catch (err) {
    console.error("processManagerCheckout error:", err);
    res.status(500).json({ message: err.message || "Lỗi xử lý thanh toán" });
  }
};

/* ===============================================================
   PAYOS PAYMENT FOR TABLE
   POST /api/manager/tables/:id/payment-link
   GET  /api/manager/tables/:id/payment-status/:orderCode */

/* ── POST /api/manager/tables/:id/payment-link ── */
export const createTablePaymentLink = async (req, res) => {
  try {
    if (!payos) {
      return res.status(503).json({ message: "PayOS chưa được cấu hình trên server." });
    }

    const branchID = await getManagerBranchId(req.user);
    const tableID = parseInt(req.params.id);

    // 1. Lấy bill hiện tại của bàn
    const orderTable = await prisma.orderTable.findFirst({
      where: {
        tableID,
        order: { orderStatus: { in: ["Open", "Serving"] }, branchID }
      },
      include: { order: true }
    });

    if (!orderTable) {
      return res.status(404).json({ message: "Bàn này không có hóa đơn chưa thanh toán." });
    }

    const totalAmount = Math.round(parseFloat(orderTable.order.totalAmount));
    if (totalAmount <= 0) {
      return res.status(400).json({ message: "Tổng tiền không hợp lệ." });
    }

    // 2. Tạo orderCode unique (timestamp)
    const orderCode = Date.now();

    // 3. Gọi PayOS API để tạo payment link
    const payosBody = {
      orderCode,
      amount: totalAmount,
      description: `Ban ${tableID} - ${orderCode}`.substring(0, 25),
      returnUrl: `http://${req.hostname}:5173/manager/tables`,
      cancelUrl: `http://${req.hostname}:5173/manager/tables`,
    };

    const paymentLinkData = await payos.paymentRequests.create(payosBody);

    // 4. Lưu session vào DB
    await prisma.tablePaymentSession.create({
      data: {
        tableId: tableID,
        orderCode: BigInt(orderCode),
        amount: totalAmount,
        status: "PENDING",
        payosLinkId: paymentLinkData.paymentLinkId,
        qrCode: paymentLinkData.qrCode,
        checkoutUrl: paymentLinkData.checkoutUrl,
      }
    });

    res.json({
      orderCode,
      amount: totalAmount,
      qrCode: paymentLinkData.qrCode,
      checkoutUrl: paymentLinkData.checkoutUrl,
      paymentLinkId: paymentLinkData.paymentLinkId,
    });
  } catch (err) {
    console.error("createTablePaymentLink error:", err);
    res.status(500).json({ message: err.message || "Lỗi tạo link thanh toán" });
  }
};

/* ── GET /api/manager/tables/:id/payment-status/:orderCode ── */
export const checkTablePaymentStatus = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    const tableID = parseInt(req.params.id);
    const orderCode = BigInt(req.params.orderCode);

    // 1. Tìm session trong DB
    const session = await prisma.tablePaymentSession.findUnique({
      where: { orderCode }
    });

    if (!session) {
      return res.status(404).json({ message: "Không tìm thấy phiên thanh toán." });
    }

    // Nếu đã xử lý, trả về ngay
    if (session.status === "PAID") {
      return res.json({ status: "PAID", message: "Đã thanh toán." });
    }

    // 2. Hỏi PayOS để lấy trạng thái thực tế
    let payosStatus = session.status;
    try {
      if (payos) {
        const payosResponse = await payos.paymentRequests.get(String(orderCode));
        payosStatus = payosResponse.status; // PAID | PENDING | CANCELLED | EXPIRED
      }
    } catch (payosErr) {
      console.warn("PayOS check error (non-fatal):", payosErr.message);
    }

    // 3. Nếu PAID: thực hiện checkout và cập nhật session
    if (payosStatus === "PAID" && session.status !== "PAID") {
      // Tìm order của bàn
      const orderTable = await prisma.orderTable.findFirst({
        where: {
          tableID,
          order: { orderStatus: { in: ["Open", "Serving"] }, branchID }
        },
        include: {
          order: { include: { orderDetails: true, orderTables: true } }
        }
      });

      if (orderTable) {
        const order = orderTable.order;
        const tableIdsInvolved = order.orderTables.map(ot => ot.tableID);

        await prisma.$transaction(async (tx) => {
          const invoice = await tx.invoice.create({
            data: {
              orderID: order.orderID,
              subTotal: order.totalAmount,
              totalAmount: order.totalAmount,
              status: "Issued",
              issuedDate: new Date()
            }
          });
          await tx.invoiceDetail.createMany({
            data: order.orderDetails.map(det => ({
              invoiceID: invoice.invoiceID,
              orderDetailID: det.orderDetailID,
              productID: det.productID,
              quantity: det.quantity,
              unitPrice: det.unitPrice,
              totalPrice: parseFloat(det.unitPrice) * det.quantity,
              status: "Finalized"
            }))
          });
          await tx.transaction.create({
            data: {
              invoiceID: invoice.invoiceID,
              amount: order.totalAmount,
              paymentMethod: "BankTransfer",
              status: "Success",
              paymentGatewayRef: String(orderCode),
            }
          });
          await tx.order.update({
            where: { orderID: order.orderID },
            data: { orderStatus: "Completed", paymentStatus: "Paid" }
          });
          await tx.table.updateMany({
            where: { tableID: { in: tableIdsInvolved } },
            data: { status: "Available", mergedGroupId: null }
          });
          await tx.tablePaymentSession.update({
            where: { orderCode },
            data: { status: "PAID", paidAt: new Date() }
          });
        });

        emitTableUpdate(req);
        return res.json({ status: "PAID", message: "Thanh toán thành công! Bàn đã được giải phóng." });
      }
    }

    // 4. Cập nhật status nếu CANCELLED/EXPIRED
    if (["CANCELLED", "EXPIRED"].includes(payosStatus) && session.status !== payosStatus) {
      await prisma.tablePaymentSession.update({
        where: { orderCode },
        data: { status: payosStatus }
      });
    }

    res.json({ status: payosStatus });
  } catch (err) {
    console.error("checkTablePaymentStatus error:", err);
    res.status(500).json({ message: err.message || "Lỗi kiểm tra trạng thái" });
  }
};


/* ===============================================================
   GET /api/manager/orders
=============================================================== */
export const getOrders = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    if (!branchID)
      return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const { status } = req.query;

    const where = {
      branchID,
      orderStatus: status
        ? status
        : { in: ["Open", "Serving", "Completed"] },
    };

    const orders = await prisma.order.findMany({
      where,
      orderBy: { orderTime: "desc" },
      include: {
        orderTables: {
          include: { table: { select: { tableID: true, tableName: true } } },
        },
        orderDetails: {
          include: { product: { select: { name: true, imageURL: true } } },
        },
      },
    });

    const result = orders.map((o) => ({
      id: o.orderID,
      orderStatus: o.orderStatus,
      paymentStatus: o.paymentStatus,
      orderTime: o.orderTime,
      totalAmount: parseFloat(o.totalAmount),
      customerNote: o.customerNote ?? "",
      orderTable: o.orderTables
        .map((ot) => ot.table?.tableName ?? `Bàn ${ot.table?.tableID}`)
        .join(" + "),
      tableIds: o.orderTables.map((ot) => ot.tableID),
      orderDetails: o.orderDetails.map((d) => ({
        id: d.orderDetailID,
        productName: d.product?.name ?? "Món đã xóa",
        imageURL: d.product?.imageURL ?? null,
        quantity: d.quantity,
        unitPrice: parseFloat(d.unitPrice),
        itemStatus: d.itemStatus,
        note: d.note ?? "",
      })),
    }));

    res.json(result);
  } catch (err) {
    console.error("getOrders error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ===============================================================
   SERVICE REQUESTS
=============================================================== */
export const getServiceRequests = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    if (!branchID)
      return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const { type, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const typeMap = {
      "Gọi món": "GoiMon",
      "Thanh toán": "ThanhToan",
    };
    const dbType = type ? (typeMap[type] ?? type) : undefined;

    const where = {
      branchID,
      ...(dbType ? { requestType: dbType } : {}),
    };

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [requests, total, pendingCount, totalToday] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        orderBy: { createdTime: "desc" },
        skip,
        take: parseInt(limit),
        include: { table: { select: { tableName: true } } },
      }),
      prisma.serviceRequest.count({ where }),
      prisma.serviceRequest.count({
        where: { branchID, status: "Đang xử lý" },
      }),
      prisma.serviceRequest.count({
        where: { branchID, createdTime: { gte: todayStart, lte: todayEnd } },
      }),
    ]);

    const displayTypeMap = {
      GoiMon: { label: "Gọi món", icon: "bell" },
      ThanhToan: { label: "Thanh toán", icon: "credit-card" },
    };

    const data = requests.map((r) => ({
      requestID: r.requestID,
      tableID: r.tableID,
      tableName: r.table?.tableName ?? `Bàn ${r.tableID}`,
      requestType: r.requestType,
      displayType: displayTypeMap[r.requestType] ?? { label: r.requestType, icon: "more" },
      status: r.status,
      createdTime: r.createdTime,
    }));

    res.json({
      data,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      stats: { pending: pendingCount, totalToday },
    });
  } catch (err) {
    console.error("getServiceRequests error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ===============================================================
   ORDER STATUS UPDATE
=============================================================== */
export const updateOrderStatus = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    if (!branchID)
      return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const orderID = parseInt(req.params.id);
    const { orderStatus } = req.body;

    const allowed = ["Serving", "Completed"];
    if (!allowed.includes(orderStatus))
      return res.status(400).json({ message: "Trạng thái không hợp lệ." });

    const existing = await prisma.order.findFirst({ where: { orderID, branchID } });
    if (!existing)
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });

    const updated = await prisma.order.update({
      where: { orderID },
      data: { orderStatus },
    });

    if (orderStatus === "Completed") {
      const orderTables = await prisma.orderTable.findMany({ where: { orderID } });
      const tableIds = orderTables.map((ot) => ot.tableID);
      if (tableIds.length) {
        if (updated.paymentStatus === "Paid") {
          await prisma.table.updateMany({
            where: { tableID: { in: tableIds } },
            data: { status: "Available", mergedGroupId: null },
          });
        }
      }
    }

    emitTableUpdate(req);
    res.json({ message: "Cập nhật trạng thái thành công.", orderID, orderStatus });
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ===============================================================
   SERVICE REQUEST STATUS UPDATE
=============================================================== */
export const updateServiceRequestStatus = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
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
      data: { status },
    });

    res.json({ requestID: updated.requestID, status: updated.status });
  } catch (err) {
    console.error("updateServiceRequestStatus error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ===============================================================
   7. BRANCH INFO 
=============================================================== */
export const getBranchInfo = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
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
   8. UPLOAD COVER IMAGE
=============================================================== */
export const uploadBranchCoverImage = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    if (!branchID) {
      return res.status(404).json({ message: "Không tìm thấy chi nhánh." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn ảnh bìa." });
    }

    const branch = await prisma.branch.findUnique({
      where: { branchID },
      select: { restaurantID: true },
    });

    if (!branch) {
      return res.status(404).json({ message: "Chi nhánh không tồn tại." });
    }

    const coverImageURL = `/uploads/${req.file.filename}`;

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
    const branchID = await getManagerBranchId(req.user);
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
    const branchID = await getManagerBranchId(req.user);
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

/* ===============================================================
   9. PAYMENT HISTORY
   GET /api/manager/payment-history
   Query: startDate, endDate (ISO strings)
=============================================================== */
export const getPaymentHistory = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    if (!branchID)
      return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const { startDate, endDate } = req.query;

    const where = {
      invoice: {
        order: {
          branchID: branchID,
        },
      },
      status: "Success",
    };

    if (startDate || endDate) {
      where.transactionTime = {};
      if (startDate) {
        where.transactionTime.gte = new Date(startDate);
      }
      if (endDate) {
        const dEnd = new Date(endDate);
        dEnd.setHours(23, 59, 59, 999); // Hết ngày
        where.transactionTime.lte = dEnd;
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { transactionTime: "desc" },
      include: {
        invoice: {
          include: {
            order: {
              include: {
                orderTables: {
                  include: { table: { select: { tableName: true, tableID: true } } },
                },
                orderDetails: {
                  include: { product: { select: { name: true, imageURL: true } } },
                },
              },
            },
          },
        },
      },
    });

    const result = transactions.map((t) => {
      const order = t.invoice?.order;
      return {
        transactionID:   t.transactionID,
        transactionTime: t.transactionTime,
        amount:          parseFloat(t.amount),
        paymentMethod:   t.paymentMethod,
        invoiceID:       t.invoiceID,
        orderID:         order?.orderID,
        tableName:       order?.orderTables
          .map((ot) => ot.table?.tableName ?? `Bàn ${ot.tableID}`)
          .join(", "),
        items: order?.orderDetails.map((d) => ({
          productName: d.product?.name ?? "Món đã xóa",
          quantity:    d.quantity,
          unitPrice:   parseFloat(d.unitPrice),
        })),
      };
    });

    res.json(result);
  } catch (err) {
    console.error("getPaymentHistory error:", err);
    res.status(500).json({ message: "Lỗi lấy lịch sử thanh toán." });
  }
};
/* ===============================================================
   9. STAFF MANAGEMENT (Branch Manager)
=============================================================== */

/**
 * GET /api/manager/staff
 * Lấy danh sách nhân viên và bếp của chi nhánh
 */
export const getBranchStaff = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const staff = await prisma.user.findMany({
      where: {
        branchID,
        role: { in: ["Staff", "Kitchen"] }
      },
      select: {
        userID: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(staff);
  } catch (err) {
    console.error("getBranchStaff error:", err);
    res.status(500).json({ message: "Lỗi lấy danh sách nhân viên" });
  }
};

/**
 * POST /api/manager/staff
 * Tạo tài khoản nhân viên hoặc bếp mới
 */
export const createBranchStaff = async (req, res) => {
  try {
    const branch = await prisma.branch.findUnique({
      where: { branchID: await getManagerBranchId(req.user) },
      select: { branchID: true, restaurantID: true }
    });
    if (!branch) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });
    const branchID = branch.branchID;
    const restaurantID = branch.restaurantID;

    const { username, password, fullName, email, phone, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc (username, password, role)." });
    }

    if (!["Staff", "Kitchen"].includes(role)) {
      return res.status(400).json({ message: "Role không hợp lệ. Chỉ chấp nhận Staff hoặc Kitchen." });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email: email || undefined }] }
    });

    if (existing) {
      return res.status(400).json({ message: "Username hoặc Email đã tồn tại." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        fullName,
        email,
        phone,
        role,
        branchID,
        restaurantID,
        status: "Active"
      }
    });

    if (newUser.email) {
      try {
        await sendNewAccountEmail(newUser.email, newUser.fullName, newUser.username, password, role);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    }

    res.status(201).json({
      message: "Tạo tài khoản nhân viên thành công!",
      user: {
        userID: newUser.userID,
        username: newUser.username,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error("createBranchStaff error:", err);
    res.status(500).json({ message: "Lỗi tạo tài khoản nhân viên" });
  }
};

/**
 * PATCH /api/manager/staff/:id/status
 */
export const updateStaffStatus = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    const staffID = parseInt(req.params.id);
    if (isNaN(staffID)) {
      return res.status(400).json({ message: "ID nhân viên không hợp lệ." });
    }
    const { status } = req.body;

    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ." });
    }

    const staff = await prisma.user.findFirst({
      where: { userID: staffID, branchID }
    });

    if (!staff) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên." });
    }

    await prisma.user.update({
      where: { userID: staffID },
      data: { status }
    });

    res.json({ message: `Đã ${status === "Active" ? "kích hoạt" : "khoá"} tài khoản thành công.` });
  } catch (err) {
    console.error("updateStaffStatus error:", err);
    res.status(500).json({ message: "Lỗi cập nhật trạng thái nhân viên" });
  }
};

/**
 * DELETE /api/manager/staff/:id
 */
export const deleteBranchStaff = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    const staffID = parseInt(req.params.id);
    if (isNaN(staffID)) {
      return res.status(400).json({ message: "ID nhân viên không hợp lệ." });
    }

    const staff = await prisma.user.findFirst({
      where: { userID: staffID, branchID }
    });

    if (!staff) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên." });
    }

    await prisma.user.delete({ where: { userID: staffID } });

    res.json({ message: "Đã xoá tài khoản nhân viên thành công." });
  } catch (err) {
    console.error("deleteBranchStaff error:", err);
    res.status(500).json({ message: "Lỗi xoá nhân viên" });
  }
};

/**
 * PUT /api/manager/staff/:id
 */
export const updateBranchStaff = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    const staffID = parseInt(req.params.id);
    if (isNaN(staffID)) {
      return res.status(400).json({ message: "ID nhân viên không hợp lệ." });
    }

    const { fullName, email, phone, role } = req.body;

    const staff = await prisma.user.findFirst({
      where: { userID: staffID, branchID }
    });

    if (!staff) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên trong chi nhánh này." });
    }

    if (email && email.trim() !== staff.email) {
      const existing = await prisma.user.findFirst({
        where: { email: email.trim() }
      });
      if (existing) return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const updated = await prisma.user.update({
      where: { userID: staffID },
      data: {
        fullName: fullName || staff.fullName,
        email: email ? email.trim() : staff.email,
        phone: phone || staff.phone,
        role: role || staff.role,
      }
    });

    res.json({ message: "Cập nhật thông tin nhân viên thành công", staff: updated });
  } catch (err) {
    console.error("updateBranchStaff error:", err);
    res.status(500).json({ message: "Lỗi cập nhật thông tin nhân viên" });
  }
};

/* ===============================================================
   GET /api/manager/tables/:id/order-details
   Lấy chi tiết từng món ăn (không group) kèm itemStatus từ DB */
export const getTableOrderDetails = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const tableID = parseInt(req.params.id);

    const orderTable = await prisma.orderTable.findFirst({
      where: {
        tableID,
        order: { orderStatus: { in: ["Open", "Serving"] }, branchID },
      },
      include: {
        order: {
          include: {
            orderDetails: {
              include: { product: { select: { name: true, imageURL: true, price: true } } },
              orderBy: { orderDetailID: "asc" },
            },
            orderTables: { include: { table: { select: { tableID: true, tableName: true } } } },
          },
        },
      },
    });

    if (!orderTable) {
      return res.status(404).json({ message: "Bàn này hiện không có đơn hàng đang mở." });
    }

    const order = orderTable.order;

    res.json({
      orderID: order.orderID,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      totalAmount: parseFloat(order.totalAmount),
      orderTime: order.orderTime,
      customerNote: order.customerNote ?? "",
      tables: order.orderTables.map((ot) => ({
        id: ot.table.tableID,
        name: ot.table.tableName,
      })),
      items: order.orderDetails.map((d) => ({
        orderDetailID: d.orderDetailID,
        productID: d.productID,
        productName: d.product?.name ?? "Món đã xóa",
        imageURL: d.product?.imageURL ?? null,
        quantity: d.quantity,
        unitPrice: parseFloat(d.unitPrice),
        itemStatus: d.itemStatus,
        note: d.note ?? "",
      })),
    });
  } catch (err) {
    console.error("getTableOrderDetails error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ===============================================================
   PATCH /api/manager/order-items/:detailId/cancel */
export const cancelOrderItem = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const orderDetailID = parseInt(req.params.detailId);
    if (isNaN(orderDetailID)) return res.status(400).json({ message: "ID món ăn không hợp lệ." });

    const { cancelQuantity } = req.body;

    const detail = await prisma.orderDetail.findUnique({
      where: { orderDetailID },
      include: {
        order: {
          include: {
            orderTables: { select: { tableID: true }, take: 1 },
          },
        },
      },
    });

    if (!detail || !detail.order) return res.status(404).json({ message: "Không tìm thấy món ăn." });

    // So sánh int vs int
    const orderBranchID = parseInt(detail.order.branchID);
    const userBranchID = parseInt(branchID);

    if (orderBranchID !== userBranchID)
      return res.status(403).json({ message: "Bạn không có quyền huỷ món này." });

    if (detail.itemStatus !== "Pending") {
      return res.status(400).json({
        message: "Không thể huỷ — món này đã được bếp xử lý!",
      });
    }

    const orderID = detail.orderID;
    const tableID = detail.order.orderTables?.[0]?.tableID ?? null;
    const currentQty = detail.quantity;
    const requestedCancelQty = parseInt(cancelQuantity) || currentQty;

    if (requestedCancelQty > currentQty || requestedCancelQty <= 0) {
      return res.status(400).json({ message: "Số lượng huỷ không hợp lệ." });
    }

    await prisma.$transaction(async (tx) => {
      if (requestedCancelQty < currentQty) {
        // Giảm số lượng
        await tx.orderDetail.update({
          where: { orderDetailID },
          data: { quantity: currentQty - requestedCancelQty },
        });
        // Tạo log huỷ
        await tx.orderDetail.create({
          data: {
            orderID,
            productID: detail.productID,
            quantity: requestedCancelQty,
            unitPrice: detail.unitPrice,
            itemStatus: "Cancelled",
            note: detail.note ? `(Huỷ ${requestedCancelQty}) ${detail.note}` : `Huỷ ${requestedCancelQty} từ đơn gốc`,
          },
        });
      } else {
        // Huỷ toàn bộ
        await tx.orderDetail.update({
          where: { orderDetailID },
          data: { itemStatus: "Cancelled" },
        });
      }

      // Tính lại tổng tiền
      const remainingDetails = await tx.orderDetail.findMany({
        where: { orderID, itemStatus: { not: "Cancelled" } },
        select: { quantity: true, unitPrice: true },
      });
      const newTotal = remainingDetails.reduce(
        (sum, d) => sum + d.quantity * Number(d.unitPrice),
        0
      );

      await tx.order.update({
        where: { orderID },
        data: { totalAmount: newTotal },
      });
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("orderItemStatusChanged", {
        orderDetailID,
        itemStatus: requestedCancelQty < currentQty ? detail.itemStatus : "Cancelled",
        tableID,
        orderID,
      });
      io.emit("tableUpdate", { branchID: userBranchID, tableID, timestamp: Date.now() });
    }

    res.json({
      message: requestedCancelQty < currentQty ? `Đã huỷ ${requestedCancelQty} món.` : "Đã huỷ toàn bộ món.",
      orderDetailID,
      itemStatus: requestedCancelQty < currentQty ? detail.itemStatus : "Cancelled"
    });
  } catch (err) {
    console.error("cancelOrderItem error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ===============================================================
   POST /api/manager/service-requests */
export const createManagerServiceRequest = async (req, res) => {
  try {
    const branchID = await getManagerBranchId(req.user);
    if (!branchID) return res.status(404).json({ message: "Không tìm thấy chi nhánh." });

    const { tableId, requestType = "GoiMon" } = req.body;
    if (!tableId) return res.status(400).json({ message: "Thiếu tableId." });

    const validTypes = ["GoiMon", "GoiNuoc", "ThanhToan", "Khac"];
    if (!validTypes.includes(requestType))
      return res.status(400).json({ message: `requestType không hợp lệ.` });

    const table = await prisma.table.findFirst({
      where: { tableID: parseInt(tableId), branchID },
    });
    if (!table) return res.status(404).json({ message: "Không tìm thấy bàn." });

    const newRequest = await prisma.serviceRequest.create({
      data: {
        branchID,
        tableID: parseInt(tableId),
        requestType,
        status: "Đang chờ",
        createdTime: new Date(),
      },
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("serviceRequestCreated", {
        requestID: newRequest.requestID,
        tableID: parseInt(tableId),
        tableName: table.tableName,
        requestType,
        createdTime: newRequest.createdTime,
      });
    }

    res.status(201).json({
      message: "Đã tạo yêu cầu gọi nhân viên thành công.",
      requestID: newRequest.requestID,
      tableID: parseInt(tableId),
      requestType,
    });
  } catch (err) {
    console.error("createManagerServiceRequest error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};
