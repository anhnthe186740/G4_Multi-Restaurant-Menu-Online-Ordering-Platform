import prisma from "../config/prismaClient.js";
import { Parser } from "json2csv";
import { sendNewAccountEmail } from "../config/emailService.js";
import fs from "fs/promises";

/*
  restaurantOwnerController.js
  -----------------------------
  Controller dành cho `RestaurantOwner` dùng để quản lý nhà hàng:
  thống kê dashboard, quản lý chi nhánh, menu, lịch sử thanh toán và
  cập nhật thông tin thương hiệu (logo, ảnh bìa, giấy phép...).

  Mỗi hàm export ở đây yêu cầu `req.user` được middleware xác thực
  thiết lập (các route owner yêu cầu role `RestaurantOwner`).


*/

/* =================== HELPER =================== */
// Helper: tìm bản ghi `Restaurant` thuộc owner hiện tại. Dùng để
// giới hạn các truy vấn cho các endpoint của owner chỉ trong phạm
// vi nhà hàng của họ.
async function getOwnerRestaurant(userID) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerUserID: userID },
  });
  return restaurant;
}

/* =================== GET DASHBOARD STATS =================== */
/**
 * GET /owner/dashboard/stats
 * Mục đích: Trả về các chỉ số tóm tắt cho nhà hàng của owner
 * (doanh thu, số đơn, giá trị trung bình, tăng trưởng và chi nhánh
 * tốt nhất).
 * Input: user đã được xác thực trong `req.user`.
 * Output: JSON chứa các thống kê; tổng hợp trên tất cả chi nhánh.
 */
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

    // Nhận thông số ngày từ query
    const { startDate, endDate, branchID } = req.query;

    const now = new Date();
    const start = startDate ? new Date(new Date(startDate).setHours(0, 0, 0, 0)) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : now;

    // Khoảng thời gian so sánh (cùng độ dài)
    const diffMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - diffMs);

    const filterBranches = branchID ? [parseInt(branchID)] : branchIDs;

    // Tổng doanh thu kỳ này
    const currentPeriodOrders = await prisma.order.aggregate({
      where: {
        branchID: { in: filterBranches },
        orderTime: { gte: start, lte: end },
        paymentStatus: "Paid",
        orderStatus: { in: ["Completed", "Serving"] },
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    // Tổng doanh thu kỳ trước (để tính growth)
    const lastPeriodOrders = await prisma.order.aggregate({
      where: {
        branchID: { in: filterBranches },
        orderTime: { gte: prevStart, lte: prevEnd },
        paymentStatus: "Paid",
        orderStatus: { in: ["Completed", "Serving"] },
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    const currentRevenue = parseFloat(currentPeriodOrders._sum.totalAmount || 0);
    const lastRevenue = parseFloat(lastPeriodOrders._sum.totalAmount || 0);
    const revenueGrowth = lastRevenue > 0
      ? parseFloat((((currentRevenue - lastRevenue) / lastRevenue) * 100).toFixed(1))
      : null;

    const currentOrderCount = currentPeriodOrders._count || 0;
    const lastOrderCount = lastPeriodOrders._count || 0;
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

    // Chi nhánh xuất sắc nhất
    const branchRevenues = await Promise.all(
      branches.map(async (b) => {
        const agg = await prisma.order.aggregate({
          where: {
            branchID: b.branchID,
            orderTime: { gte: start, lte: end },
            paymentStatus: "Paid",
            orderStatus: { in: ["Completed", "Serving"] },
          },
          _sum: { totalAmount: true },
        });
        const lastAgg = await prisma.order.aggregate({
          where: {
            branchID: b.branchID,
            orderTime: { gte: prevStart, lte: prevEnd },
            paymentStatus: "Paid",
            orderStatus: { in: ["Completed", "Serving"] },
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

    // Simulate Cost & Profit
    const totalCost = currentRevenue * 0.35;
    const netProfit = currentRevenue - totalCost;

    const lastTotalCost = lastRevenue * 0.35;
    const lastNetProfit = lastRevenue - lastTotalCost;
    const profitGrowth = lastNetProfit > 0
      ? parseFloat((((netProfit - lastNetProfit) / lastNetProfit) * 100).toFixed(1))
      : null;

    res.json({
      totalRevenue: currentRevenue,
      revenueGrowth,
      totalCost,
      netProfit,
      profitGrowth,
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
/**
 * GET /owner/dashboard/branch-revenue
 * Mục đích: Trả về doanh thu và số lượng đơn theo từng chi nhánh cho
 * tháng hiện tại. Input: owner đã xác thực. Output: mảng { name,
 * revenue, orders } sắp xếp theo doanh thu giảm dần.
 */
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
/**
 * GET /owner/dashboard/top-products
 * Mục đích: Tìm các sản phẩm bán chạy nhất (theo số lượng) trong
 * tháng vừa qua trên tất cả chi nhánh của owner. Trả về top 5 sản
 * phẩm kèm phần trăm đóng góp.
 */
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
/**
 * GET /owner/dashboard/orders-by-hour
 * Mục đích: Trả về số lượng đơn phân theo giờ (0-23) trong 30 ngày
 * gần nhất. Dùng để vẽ biểu đồ giờ cao điểm.
 */
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
/**
 * GET /owner/dashboard/branch-performance
 * Mục đích: Trả về chi tiết hiệu suất theo chi nhánh (số đơn,
 * doanh thu, tăng trưởng) để hiển thị bảng performance cho owner.
 */
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

/* =================== GET OWN RESTAURANT INFO =================== */
/**
 * GET /owner/restaurant
 * Mục đích: Trả về thông tin chi tiết của nhà hàng thuộc owner,
 * bao gồm thông tin liên hệ của chủ (owner) và danh sách chi nhánh.
 * Trả về các trường đã được chuẩn hóa để frontend sử dụng.
 */
export const getOwnerRestaurantInfo = async (req, res) => {
  try {
    const userID = req.user.userId;
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerUserID: userID },
      include: {
        owner: {
          select: { fullName: true, username: true, email: true, phone: true, status: true, createdAt: true },
        },
        branches: {
          include: {
            manager: { select: { fullName: true } },
            _count: { select: { tables: true } },
          },
        },
      },
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Không tìm thấy nhà hàng" });
    }

    res.json({
      RestaurantID: restaurant.restaurantID,
      Name: restaurant.name,
      Logo: restaurant.logo,
      CoverImage: restaurant.coverImage,
      BusinessLicense: restaurant.businessLicense,
      Description: restaurant.description,
      TaxCode: restaurant.taxCode,
      Website: restaurant.website,
      ownerName: restaurant.owner?.fullName,
      ownerUsername: restaurant.owner?.username,
      ownerEmail: restaurant.owner?.email,
      ownerPhone: restaurant.owner?.phone,
      ownerStatus: restaurant.owner?.status,
      registeredDate: restaurant.owner?.createdAt,
      branches: restaurant.branches.map((b) => ({
        BranchID: b.branchID,
        Name: b.name,
        Address: b.address,
        Phone: b.phone,
        OpeningHours: b.openingHours,
        IsActive: b.isActive,
        managerName: b.manager?.fullName,
        tableCount: b._count.tables,
      })),
    });
  } catch (error) {
    console.error("getOwnerRestaurantInfo error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== GET OWNER BRANCHES LIST =================== */
/**
 * GET /owner/branches
 * Mục đích: Trả về danh sách nhẹ các chi nhánh của nhà hàng thuộc
 * owner, tối ưu cho hiển thị danh sách và thống kê số lượng.
 */
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
/**
 * GET /owner/branches/:id
 * Mục đích: Trả về chi tiết một chi nhánh. Kiểm tra chi nhánh đó
 * thuộc về nhà hàng của owner hiện tại.
 */
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
/**
 * PUT /owner/branches/:id
 * Mục đích: Cập nhật metadata của chi nhánh (tên, địa chỉ, điện thoại,
 * email, giờ mở cửa). `openingHours` được lưu dưới dạng chuỗi JSON.
 */
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

/* =================== CREATE BRANCH =================== */
export const createOwnerBranch = async (req, res) => {
  try {
    const userID = req.user.userId;
    const { name, address, phone, email, openingHours, isActive } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Tên chi nhánh không được để trống' });
    }

    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: 'Không tìm thấy nhà hàng' });

    const hoursObj = { ...(openingHours || {}), email: email || '' };

    const branch = await prisma.branch.create({
      data: {
        restaurantID: restaurant.restaurantID,
        name: name.trim(),
        address: address || null,
        phone: phone || null,
        openingHours: JSON.stringify(hoursObj),
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({ message: 'Tạo chi nhánh thành công', branchID: branch.branchID });
  } catch (error) {
    console.error('createOwnerBranch error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

/* =================== GET PAYMENT HISTORY =================== */
/**
 * GET /owner/payment-history
 * Mục đích: Trả về các bản ghi giao dịch có phân trang cho nhà hàng
 * của owner. Hỗ trợ lọc, xuất CSV và thống kê tóm tắt cho các thẻ số liệu.
 */
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

    // Search logic nâng cao (Partial match for Order ID)
    const searchWhere = {};
    if (search) {
      const cleanSearch = search.replace(/#ORD-/i, "").trim();
      if (cleanSearch) {
        // Tìm các OrderID thỏa mãn LIKE %cleanSearch% bằng raw query:
        const matchedOrders = await prisma.$queryRaw`
          SELECT OrderID FROM Orders 
          WHERE CAST(OrderID AS CHAR) LIKE ${`%${cleanSearch}%`}
        `;
        const matchedIDs = matchedOrders.map(o => o.OrderID);

        searchWhere.invoice = {
          order: {
            orderID: { in: matchedIDs }
          }
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

    const skipVal = (pageNum - 1) * limitNum;
    const takeVal = limitNum;

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

/* =================== UPDATE OWN RESTAURANT INFO =================== */
/**
 * PUT /owner/restaurant
 * Mục đích: Cho phép owner cập nhật thông tin thương hiệu: `name`,
 * `description`, `website`, `taxCode`, `logo`, `coverImage`,
 * `businessLicense`. Chỉ các trường được gửi mới được cập nhật.
 */
export const updateOwnerRestaurantInfo = async (req, res) => {
  try {
    const userID = req.user.userId;
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerUserID: userID },
      select: { restaurantID: true },
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Không tìm thấy nhà hàng" });
    }

    const { name, description, website, taxCode, logo, coverImage, businessLicense } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (website !== undefined) data.website = website;
    if (taxCode !== undefined) data.taxCode = taxCode;
    if (logo !== undefined) data.logo = logo;
    if (coverImage !== undefined) data.coverImage = coverImage;
    if (businessLicense !== undefined) data.businessLicense = businessLicense;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "Không có trường nào để cập nhật" });
    }

    await prisma.restaurant.update({
      where: { restaurantID: restaurant.restaurantID },
      data,
    });

    res.json({ message: "Cập nhật thông tin nhà hàng thành công" });
  } catch (error) {
    console.error("updateOwnerRestaurantInfo error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== TOGGLE BRANCH STATUS =================== */
/**
 * PATCH /owner/branches/:id/toggle
 * Mục đích: Đảo giá trị `isActive` của chi nhánh để bật/tắt tính
 * năng đặt hàng cho chi nhánh đó.
 */
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

/* =================== DELETE BRANCH =================== */
export const deleteOwnerBranch = async (req, res) => {
  try {
    const userID = req.user.userId;
    const branchID = parseInt(req.params.id);

    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const branch = await prisma.branch.findFirst({
      where: { branchID, restaurantID: restaurant.restaurantID },
    });
    if (!branch) return res.status(404).json({ message: "Chi nhánh không tồn tại" });

    // Lấy tất cả orderID của branch
    const orders = await prisma.order.findMany({
      where: { branchID },
      select: { orderID: true },
    });
    const orderIDs = orders.map((o) => o.orderID);

    if (orderIDs.length > 0) {
      // Lấy tất cả invoiceID của các orders
      const invoices = await prisma.invoice.findMany({
        where: { orderID: { in: orderIDs } },
        select: { invoiceID: true },
      });
      const invoiceIDs = invoices.map((i) => i.invoiceID);

      if (invoiceIDs.length > 0) {
        // Xóa InvoiceDetails → Transactions trước
        await prisma.invoiceDetail.deleteMany({ where: { invoiceID: { in: invoiceIDs } } });
        await prisma.transaction.deleteMany({ where: { invoiceID: { in: invoiceIDs } } });
        await prisma.invoice.deleteMany({ where: { invoiceID: { in: invoiceIDs } } });
      }

      // Xóa OrderDetails, OrderTables
      await prisma.orderDetail.deleteMany({ where: { orderID: { in: orderIDs } } });
      await prisma.orderTable.deleteMany({ where: { orderID: { in: orderIDs } } });
      await prisma.order.deleteMany({ where: { branchID } });
    }

    // Xóa ServiceRequests
    await prisma.serviceRequest.deleteMany({ where: { branchID } });

    // Tables cascade tự xóa ServiceRequests con, nhưng ta đã xóa rồi — an toàn
    await prisma.table.deleteMany({ where: { branchID } });

    // Cuối cùng xóa Branch
    await prisma.branch.delete({ where: { branchID } });

    res.json({ message: "Xóa chi nhánh thành công" });
  } catch (error) {
    console.error("deleteOwnerBranch error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== KITCHEN DISPLAY SYSTEM (KDS) =================== */

// 1. Lấy danh sách đơn hàng trong ngày của chi nhánh/bếp (FIFO)
export const getKitchenOrders = async (req, res) => {
  try {
    const userID = parseInt(req.user?.userId || req.user?.userID);
    const branchID = parseInt(req.params.branchID);
    const categoryID = req.query.categoryID ? parseInt(req.query.categoryID) : null;

    const userRole = req.user.role;
    let allowed = false;

    if (userRole === "RestaurantOwner") {
      const restaurant = await getOwnerRestaurant(userID);
      if (restaurant) {
        const branch = await prisma.branch.findFirst({
          where: { branchID, restaurantID: restaurant.restaurantID },
        });
        if (branch) allowed = true;
      }
    } else if (userRole === "BranchManager") {
      const branch = await prisma.branch.findFirst({
        where: { branchID, managerUserID: userID },
      });
      if (branch) allowed = true;
    } else if (userRole === "Staff" || userRole === "Kitchen") {
      const user = await prisma.user.findFirst({
        where: { userID, branchID },
      });
      if (user) allowed = true;
    }

    if (!allowed) {
      const logMsg = `❌ Auth Denied: userID=${userID}, role=${userRole}, branchID=${branchID}, req.user=${JSON.stringify(req.user)}\n`;
      try { await fs.appendFile('d:/Kì 6/SWP391/G4_Multi-Restaurant-Menu-Online-Ordering-Platform/backend/tmp/auth_logs.txt', logMsg); } catch(e) {}
      console.log(logMsg);
      return res.status(403).json({ message: "Bạn không có quyền truy cập dữ liệu của chi nhánh này" });
    }

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
      orderStatus: o.orderStatus,
      customerNote: o.customerNote,
      items: o.orderDetails.map(d => ({
        orderDetailID: d.orderDetailID,
        productName: d.product.name,
        quantity: d.quantity,
        note: d.note,
        itemStatus: d.itemStatus,
        categoryID: d.product.categoryID,
      })),
    }));

    res.json(result);
  } catch (error) {
    console.error("getKitchenOrders error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== DETAILED ORDERS REPORT =================== */
export const getDetailedOrdersReport = async (req, res) => {
  try {
    const userID = req.user.userId;
    const { startDate, endDate, branchID } = req.query;

    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const ownerBranches = await prisma.branch.findMany({
      where: { restaurantID: restaurant.restaurantID },
      select: { branchID: true, name: true },
    });
    const validBranchIDs = ownerBranches.map((b) => b.branchID);

    let filterBranchIDs = validBranchIDs;
    if (branchID && branchID !== "all") {
      const bID = parseInt(branchID);
      if (validBranchIDs.includes(bID)) {
        filterBranchIDs = [bID];
      } else {
        return res.status(403).json({ message: "Không có quyền truy cập chi nhánh này" });
      }
    }

    const whereClause = {
      branchID: { in: filterBranchIDs },
      paymentStatus: "Paid",
      orderStatus: { in: ["Completed", "Serving"] }
    };

    if (startDate && endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.orderTime = {
        gte: new Date(startDate),
        lte: end,
      };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        orderID: true,
        orderTime: true,
        totalAmount: true,
        paymentStatus: true,
        orderStatus: true,
        branch: { select: { name: true } },
        orderDetails: {
          select: {
            quantity: true,
            product: { select: { name: true } }
          }
        }
      },
      orderBy: { orderTime: "desc" },
    });

    const formattedOrders = orders.map((o) => ({
      orderID: o.orderID,
      branchName: o.branch.name,
      orderTime: o.orderTime,
      totalAmount: o.totalAmount,
      status: o.orderStatus,
      itemsSummary: o.orderDetails.map(d => `${d.quantity}x ${d.product.name}`).join(', '),
      itemCount: o.orderDetails.reduce((sum, d) => sum + d.quantity, 0)
    }));

    res.json({ orders: formattedOrders });
  } catch (error) {
    console.error("getDetailedOrdersReport error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== GET MENU CATEGORIES =================== */
/**
 * GET /owner/menu/categories
 * Mục đích: Trả về danh sách danh mục menu của nhà hàng kèm số lượng
 * sản phẩm trong mỗi danh mục. Dùng bởi giao diện quản lý menu.
 */
export const getMenuCategories = async (req, res) => {
  try {
    const userID = req.user.userId;
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const categories = await prisma.category.findMany({
      where: { restaurantID: restaurant.restaurantID },
      include: { _count: { select: { products: true } } },
      orderBy: [{ displayOrder: "asc" }, { categoryID: "asc" }],
    });

    res.json(categories.map(c => ({
      categoryID: c.categoryID,
      name: c.name,
      description: c.description,
      displayOrder: c.displayOrder,
      productCount: c._count.products,
    })));
  } catch (error) {
    console.error("getMenuCategories error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== REPORTS: REVENUE TREND BY DATE =================== */
export const getRevenueByPeriod = async (req, res) => {
  try {
    const userID = req.user.userId;
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const branches = await prisma.branch.findMany({
      where: { restaurantID: restaurant.restaurantID },
      select: { branchID: true },
    });
    const branchIDs = branches.map((b) => b.branchID);

    const { startDate, endDate, branchID } = req.query;
    const now = new Date();
    const start = startDate ? new Date(new Date(startDate).setHours(0, 0, 0, 0)) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : now;
    const filterBranches = branchID ? [parseInt(branchID)] : branchIDs;

    const orders = await prisma.order.findMany({
      where: {
        branchID: { in: filterBranches },
        orderTime: { gte: start, lte: end },
        paymentStatus: "Paid",
        orderStatus: { in: ["Completed", "Serving"] },
      },
      select: { orderTime: true, totalAmount: true },
      orderBy: { orderTime: "asc" },
    });

    // Group by date
    const grouped = {};
    orders.forEach((o) => {
      const dateKey = new Date(o.orderTime).toISOString().slice(0, 10);
      if (!grouped[dateKey]) grouped[dateKey] = { date: dateKey, revenue: 0, orders: 0 };
      grouped[dateKey].revenue += parseFloat(o.totalAmount);
      grouped[dateKey].orders += 1;
    });

    // Fill missing dates with 0 and compute Cost/Profit
    const result = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      const dayData = grouped[key] || { date: key, revenue: 0, orders: 0 };
      const cost = dayData.revenue * 0.35;
      const profit = dayData.revenue - cost;
      result.push({
        ...dayData,
        cost,
        profit
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    res.json(result);
  } catch (error) {
    console.error("getRevenueByPeriod error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== REPORTS: BRANCH SUMMARY =================== */
export const getBranchSummaryReport = async (req, res) => {
  try {
    const userID = req.user.userId;
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const branches = await prisma.branch.findMany({
      where: { restaurantID: restaurant.restaurantID },
      select: { branchID: true, name: true, address: true, isActive: true },
    });

    const { startDate, endDate } = req.query;
    const now = new Date();
    const start = startDate ? new Date(new Date(startDate).setHours(0, 0, 0, 0)) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : now;

    // Same-length period before for comparison
    const diffMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - diffMs);

    const data = await Promise.all(
      branches.map(async (b) => {
        const [current, prev] = await Promise.all([
          prisma.order.aggregate({
            where: { branchID: b.branchID, orderTime: { gte: start, lte: end }, paymentStatus: "Paid", orderStatus: { in: ["Completed", "Serving"] } },
            _sum: { totalAmount: true },
            _count: true,
          }),
          prisma.order.aggregate({
            where: { branchID: b.branchID, orderTime: { gte: prevStart, lte: prevEnd }, paymentStatus: "Paid", orderStatus: { in: ["Completed", "Serving"] } },
            _sum: { totalAmount: true },
            _count: true,
          }),
        ]);

        const revenue = parseFloat(current._sum.totalAmount || 0);
        const orders = current._count || 0;
        const prevRevenue = parseFloat(prev._sum.totalAmount || 0);
        const growth = prevRevenue > 0
          ? parseFloat((((revenue - prevRevenue) / prevRevenue) * 100).toFixed(1))
          : null;
        const avgOrder = orders > 0 ? Math.round(revenue / orders) : 0;

        return {
          branchID: b.branchID,
          name: b.name,
          address: b.address,
          isActive: b.isActive,
          revenue,
          orders,
          avgOrder,
          growth,
        };
      })
    );

    res.json(data.sort((a, b) => b.revenue - a.revenue));
  } catch (error) {
    console.error("getBranchSummaryReport error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== REPORTS: PRODUCT REVENUE STATS =================== */
export const getProductRevenueStats = async (req, res) => {
  try {
    const userID = req.user.userId;
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const branches = await prisma.branch.findMany({
      where: { restaurantID: restaurant.restaurantID },
      select: { branchID: true },
    });
    const branchIDs = branches.map((b) => b.branchID);

    const { startDate, endDate, branchID } = req.query;
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : now;
    const filterBranches = branchID ? [parseInt(branchID)] : branchIDs;

    const grouped = await prisma.orderDetail.groupBy({
      by: ["productID"],
      where: {
        order: {
          branchID: { in: filterBranches },
          orderTime: { gte: start, lte: end },
        },
      },
      _sum: { quantity: true, unitPrice: true },
      orderBy: { _sum: { unitPrice: "desc" } },

      take: 10,
    });

    const totalRevenue = grouped.reduce((s, g) => s + parseFloat(g._sum.unitPrice || 0), 0);


    const result = await Promise.all(
      grouped.map(async (g) => {
        const product = await prisma.product.findUnique({
          where: { productID: g.productID },
          include: { category: { select: { name: true } } },
        });
        const revenue = parseFloat(g._sum.unitPrice || 0);


        // Mock a trend for UI presentation (from -10% to +30%)
        // Or leave null and calculate real trend if possible, here using a determinist pseudo-random
        const seed = g.productID;
        const trendRaw = (seed % 40) - 10; // -10 to +29

        return {
          productID: g.productID,
          name: product?.name || "Không xác định",
          imageURL: product?.imageURL || "",
          category: product?.category?.name || "Khác",
          quantity: g._sum.quantity || 0,
          revenue,
          percentage: totalRevenue > 0 ? parseFloat(((revenue / totalRevenue) * 100).toFixed(1)) : 0,
          trend: trendRaw >= 0 ? `+${trendRaw}%` : `${trendRaw}%`,
        };
      })
    );

    res.json({ products: result, totalRevenue });
  } catch (error) {
    console.error("getProductRevenueStats error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== CREATE MENU CATEGORY =================== */
/**
 * POST /owner/menu/categories
 * Mục đích: Tạo một danh mục (category) mới cho nhà hàng của owner.
 * Input (body): { name, description?, displayOrder? }
 * Output: 201 + object category mới.
 */
export const createMenuCategory = async (req, res) => {
  try {
    const userID = req.user.userId;
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const { name, description, displayOrder } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Tên danh mục là bắt buộc" });

    const category = await prisma.category.create({
      data: {
        restaurantID: restaurant.restaurantID,
        name: name.trim(),
        description: description || null,
        displayOrder: displayOrder ? parseInt(displayOrder) : null,
      },
    });

    res.status(201).json({ message: "Đã tạo danh mục mới", category });
  } catch (error) {
    console.error("createMenuCategory error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== UPDATE MENU CATEGORY =================== */
/**
 * PUT /owner/menu/categories/:id
 * Mục đích: Cập nhật thông tin một danh mục thuộc về nhà hàng của owner.
 * Input: params.id (categoryID), body có thể chứa { name, description, displayOrder }.
 * Output: object category đã được cập nhật.
 * Lưu ý: - Kiểm tra danh mục tồn tại và thuộc nhà hàng; - nếu không gửi trường
 * nào thì giữ nguyên giá trị cũ.
 */
export const updateMenuCategory = async (req, res) => {
  try {
    const userID = req.user.userId;
    const categoryID = parseInt(req.params.id);
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const cat = await prisma.category.findFirst({
      where: { categoryID, restaurantID: restaurant.restaurantID },
    });
    if (!cat) return res.status(404).json({ message: "Danh mục không tồn tại" });

    const { name, description, displayOrder } = req.body;
    const updated = await prisma.category.update({
      where: { categoryID },
      data: {
        name: name?.trim() || cat.name,
        description: description !== undefined ? description : cat.description,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : cat.displayOrder,
      },
    });

    res.json({ message: "Đã cập nhật danh mục", category: updated });
  } catch (error) {
    console.error("updateMenuCategory error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== DELETE MENU CATEGORY =================== */
/**
 * DELETE /owner/menu/categories/:id
 * Mục đích: Xóa một danh mục (và các ràng buộc DB theo cascade nếu có).
 * Input: params.id (categoryID).
 * Output: message xác nhận xóa.
 * Lưu ý: Kiểm tra danh mục tồn tại và thuộc nhà hàng của owner trước khi xóa.
 */
export const deleteMenuCategory = async (req, res) => {
  try {
    const userID = req.user.userId;
    const categoryID = parseInt(req.params.id);
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const cat = await prisma.category.findFirst({
      where: { categoryID, restaurantID: restaurant.restaurantID },
    });
    if (!cat) return res.status(404).json({ message: "Danh mục không tồn tại" });

    await prisma.category.delete({ where: { categoryID } });
    res.json({ message: "Đã xóa danh mục" });
  } catch (error) {
    console.error("deleteMenuCategory error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== GET MENU ITEMS =================== */
/**
 * GET /owner/menu/items
 * Mục đích: Lấy danh sách món (products) của nhà hàng thuộc owner.
 * Query params hỗ trợ: categoryID, search, status.
 * Output: mảng món với thông tin cơ bản (id, tên, mô tả, giá, ảnh,
 * trạng thái, categoryName).
 * Lưu ý: Chỉ trả món thuộc các danh mục của nhà hàng.
 */
export const getMenuItems = async (req, res) => {
  try {
    const userID = req.user.userId;
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const { categoryID, search, status } = req.query;

    // Fetch all categories for this restaurant to use as filter
    const restaurantCategories = await prisma.category.findMany({
      where: { restaurantID: restaurant.restaurantID },
      select: { categoryID: true },
    });
    const catIDs = restaurantCategories.map(c => c.categoryID);

    const where = { categoryID: { in: catIDs } };
    if (categoryID && categoryID !== "0") where.categoryID = parseInt(categoryID);
    if (status) where.status = status;
    if (search) where.name = { contains: search };

    const products = await prisma.product.findMany({
      where,
      include: { category: { select: { categoryID: true, name: true } } },
      orderBy: [{ categoryID: "asc" }, { productID: "asc" }],
    });

    res.json(products.map(p => ({
      productID: p.productID,
      name: p.name,
      description: p.description,
      price: parseFloat(p.price),
      imageURL: p.imageURL,
      isAvailable: p.status === "Available",
      status: p.status,
      categoryID: p.categoryID,
      categoryName: p.category.name,
    })));
  } catch (error) {
    console.error("getMenuItems error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== CREATE MENU ITEM =================== */
/**
 * POST /owner/menu/items
 * Mục đích: Thêm một món mới vào menu của nhà hàng.
 * Input (body): { name, description?, price, categoryID, imageURL?, isAvailable? }
 * Output: 201 + object món vừa tạo.
 * Lưu ý: - Kiểm tra `name`, `price` và `categoryID` hợp lệ; - category phải
 * thuộc cùng nhà hàng với owner; - `isAvailable` điều khiển trạng thái món.
 */
export const createMenuItem = async (req, res) => {
  try {
    const userID = req.user.userId;
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const { name, description, price, categoryID, imageURL, isAvailable } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Tên món là bắt buộc" });
    if (!price || isNaN(price) || price <= 0) return res.status(400).json({ message: "Giá không hợp lệ" });
    if (!categoryID) return res.status(400).json({ message: "Danh mục là bắt buộc" });

    // Verify category belongs to this restaurant
    const cat = await prisma.category.findFirst({
      where: { categoryID: parseInt(categoryID), restaurantID: restaurant.restaurantID },
    });
    if (!cat) return res.status(400).json({ message: "Danh mục không thuộc nhà hàng này" });

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description || null,
        price: parseFloat(price),
        categoryID: parseInt(categoryID),
        imageURL: imageURL || null,
        status: isAvailable === false ? "OutOfStock" : "Available",
      },
      include: { category: { select: { categoryID: true, name: true } } },
    });

    res.status(201).json({
      message: "Đã thêm món ăn mới",
      product: {
        productID: product.productID,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        imageURL: product.imageURL,
        isAvailable: product.status === "Available",
        status: product.status,
        categoryID: product.categoryID,
        categoryName: product.category.name,
      },
    });
  } catch (error) {
    console.error("createMenuItem error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== UPDATE MENU ITEM =================== */
/**
 * PUT /owner/menu/items/:id
 * Mục đích: Cập nhật thông tin một món ăn.
 * Input: params.id (productID), body có thể chứa { name, description, price,
 * categoryID, imageURL, isAvailable }.
 * Output: object món đã cập nhật.
 * Lưu ý: - Xác thực món thuộc nhà hàng của owner; - nếu cung cấp categoryID
 * mới thì kiểm tra category đó thuộc cùng nhà hàng.
 */
export const updateMenuItem = async (req, res) => {
  try {
    const userID = req.user.userId;
    const productID = parseInt(req.params.id);
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    // Verify product belongs to owner's restaurant (via category)
    const existing = await prisma.product.findFirst({
      where: { productID, category: { restaurantID: restaurant.restaurantID } },
    });
    if (!existing) return res.status(404).json({ message: "Món ăn không tồn tại" });

    const { name, description, price, categoryID, imageURL, isAvailable } = req.body;

    // If categoryID provided, verify it belongs to the same restaurant
    if (categoryID) {
      const cat = await prisma.category.findFirst({
        where: { categoryID: parseInt(categoryID), restaurantID: restaurant.restaurantID },
      });
      if (!cat) return res.status(400).json({ message: "Danh mục không thuộc nhà hàng này" });
    }

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = parseFloat(price);
    if (categoryID !== undefined) data.categoryID = parseInt(categoryID);
    if (imageURL !== undefined) data.imageURL = imageURL;
    if (isAvailable !== undefined) data.status = isAvailable ? "Available" : "OutOfStock";

    const updated = await prisma.product.update({
      where: { productID },
      data,
      include: { category: { select: { categoryID: true, name: true } } },
    });

    res.json({
      message: "Đã cập nhật món ăn",
      product: {
        productID: updated.productID,
        name: updated.name,
        description: updated.description,
        price: parseFloat(updated.price),
        imageURL: updated.imageURL,
        isAvailable: updated.status === "Available",
        status: updated.status,
        categoryID: updated.categoryID,
        categoryName: updated.category.name,
      },
    });
  } catch (error) {
    console.error("updateMenuItem error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== REPORTS: ORDERS HEATMAP =================== */
export const getOrdersHeatmap_Owner = async (req, res) => {
  try {
    const userID = req.user.userId;
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const branches = await prisma.branch.findMany({
      where: { restaurantID: restaurant.restaurantID },
      select: { branchID: true },
    });
    const branchIDs = branches.map((b) => b.branchID);

    // Heatmap usually takes last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await prisma.order.findMany({
      where: {
        branchID: { in: branchIDs },
        orderTime: { gte: thirtyDaysAgo, lte: now },
      },
      select: { orderTime: true },
    });

    // We need a matrix: 7 days x 24 hours
    // Initialize
    const heatmap = [];
    for (let d = 0; d < 7; d++) {
      const hours = Array(24).fill(0);
      heatmap.push(hours);
    }

    // Populate
    orders.forEach((o) => {
      const dt = new Date(o.orderTime);
      let day = dt.getDay(); // 0 (Sun) - 6 (Sat)
      // Map to 0 (Mon) - 6 (Sun)
      day = day === 0 ? 6 : day - 1;
      const hour = dt.getHours();
      heatmap[day][hour]++;
    });

    res.json(heatmap);
  } catch (error) {
    console.error("getOrdersHeatmap_Owner error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== DELETE MENU ITEM =================== */
/**
 * DELETE /owner/menu/items/:id
 * Mục đích: Xóa một món khỏi menu của nhà hàng.
 * Input: params.id (productID).
 * Output: message xác nhận xóa.
 * Lưu ý: Kiểm tra món tồn tại và thuộc nhà hàng của owner trước khi xóa.
 */
export const deleteMenuItem = async (req, res) => {
  try {
    const userID = req.user.userId;
    const productID = parseInt(req.params.id);
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const existing = await prisma.product.findFirst({
      where: { productID, category: { restaurantID: restaurant.restaurantID } },
    });
    if (!existing) return res.status(404).json({ message: "Món ăn không tồn tại" });

    await prisma.product.delete({ where: { productID } });
    res.json({ message: "Đã xóa món ăn" });
  } catch (error) {
    console.error("deleteMenuItem error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== TOGGLE MENU ITEM STATUS =================== */
/**
 * PATCH /owner/menu/items/:id/toggle
 * Mục đích: Đổi trạng thái hiển thị/không hiển thị của món (Available <-> OutOfStock).
 * Input: params.id (productID).
 * Output: message + trạng thái mới.
 * Lưu ý: Dùng để tạm ẩn hoặc bật lại món mà không xóa dữ liệu.
 */
export const toggleMenuItem = async (req, res) => {
  try {
    const userID = req.user.userId;
    const productID = parseInt(req.params.id);
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

    const existing = await prisma.product.findFirst({
      where: { productID, category: { restaurantID: restaurant.restaurantID } },
    });
    if (!existing) return res.status(404).json({ message: "Món ăn không tồn tại" });

    const newStatus = existing.status === "Available" ? "OutOfStock" : "Available";
    const updated = await prisma.product.update({
      where: { productID },
      data: { status: newStatus },
    });

    res.json({
      message: `Món ăn đã được ${newStatus === "Available" ? "bật" : "ẩn"}`,
      isAvailable: updated.status === "Available",
      status: updated.status,
    });
  } catch (error) {
    console.error("toggleMenuItem error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== SUPPORT TICKETS (Owner ↔ Admin) =================== */

const parseMessages = (resolution) => {
  if (!resolution) return [];
  return resolution.split('\n').filter(Boolean).map(line => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);
};

export const createOwnerTicket = async (req, res) => {
  try {
    const userID = req.user.userId;
    const { subject, description, priority } = req.body;
    if (!subject?.trim()) return res.status(400).json({ message: 'Tiêu đề là bắt buộc' });

    const firstMessage = JSON.stringify({ role: 'owner', text: description?.trim() || '', time: new Date().toISOString() });

    const ticket = await prisma.supportTicket.create({
      data: {
        userID,
        subject: subject.trim(),
        description: description?.trim() || '',
        priority: ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Medium',
        status: 'Open',
        resolution: firstMessage,
      },
    });
    res.status(201).json({ message: 'Đã gửi báo cáo thành công', ticketID: ticket.ticketID });
  } catch (error) {
    console.error('createOwnerTicket error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const getOwnerTickets = async (req, res) => {
  try {
    const userID = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { userID, ...(status && status !== 'All' ? { status } : {}) };

    const [total, tickets] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: { ticketID: true, subject: true, priority: true, status: true, createdAt: true, resolution: true },
      }),
    ]);

    const result = tickets.map(t => {
      const msgs = parseMessages(t.resolution);
      return {
        ticketID: t.ticketID,
        subject: t.subject,
        priority: t.priority,
        status: t.status,
        createdAt: t.createdAt,
        lastReply: msgs.at(-1) || null,
        messageCount: msgs.length,
      };
    });

    res.json({ tickets: result, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('getOwnerTickets error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const getOwnerTicketById = async (req, res) => {
  try {
    const userID = req.user.userId;
    const ticketID = parseInt(req.params.id);
    const ticket = await prisma.supportTicket.findFirst({ where: { ticketID, userID } });
    if (!ticket) return res.status(404).json({ message: 'Không tìm thấy báo cáo' });

    res.json({
      ticketID: ticket.ticketID,
      subject: ticket.subject,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt,
      messages: parseMessages(ticket.resolution),
    });
  } catch (error) {
    console.error('getOwnerTicketById error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const replyOwnerTicket = async (req, res) => {
  try {
    const userID = req.user.userId;
    const ticketID = parseInt(req.params.id);
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Nội dung không được để trống' });

    const ticket = await prisma.supportTicket.findFirst({ where: { ticketID, userID } });
    if (!ticket) return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
    if (ticket.status === 'Closed') return res.status(400).json({ message: 'Báo cáo đã đóng' });

    const newMsg = JSON.stringify({ role: 'owner', text: text.trim(), time: new Date().toISOString() });
    const updated = ticket.resolution ? `${ticket.resolution}\n${newMsg}` : newMsg;

    await prisma.supportTicket.update({ where: { ticketID }, data: { resolution: updated } });
    res.json({ message: 'Đã gửi phản hồi' });
  } catch (error) {
    console.error('replyOwnerTicket error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

/* =================== GET OWNER MANAGERS =================== */
/**
 * GET /owner/managers
 * Trả về danh sách tài khoản BranchManager thuộc các chi nhánh của owner.
 */
export const getOwnerManagers = async (req, res) => {
  try {
    const userID = req.user.userId;
    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: 'Không tìm thấy nhà hàng' });

    // Lấy tất cả branch IDs của restaurant này
    const branches = await prisma.branch.findMany({
      where: { restaurantID: restaurant.restaurantID },
      select: { branchID: true, name: true, managerUserID: true },
    });

    const managerUserIDs = branches
      .map(b => b.managerUserID)
      .filter(id => id !== null && id !== undefined);

    console.log(`[DEBUG] Owner ${userID} - Restaurant ${restaurant.restaurantID}`);
    console.log(`[DEBUG] Found ${branches.length} branches, managerUserIDs:`, managerUserIDs);

    // Lấy tất cả user có role BranchManager thuộc nhà hàng này
    const managers = await prisma.user.findMany({
      where: {
        role: 'BranchManager',
        userID: managerUserIDs.length > 0 ? { in: managerUserIDs } : undefined,
        managedBranches: {
          some: { restaurantID: restaurant.restaurantID }
        }
      },
      select: {
        userID: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        managedBranches: {
          where: { restaurantID: restaurant.restaurantID },
          select: { branchID: true, name: true },
        },
      },
    });

    const result = managers.map(m => ({
      id: m.userID,
      username: m.username,
      fullName: m.fullName,
      email: m.email,
      phone: m.phone,
      isActive: m.status === 'Active',
      createdAt: m.createdAt,
      branchId: m.managedBranches[0]?.branchID || null,
      branchName: m.managedBranches[0]?.name || null,
    }));

    res.json(result);
  } catch (error) {
    console.error('getOwnerManagers error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// 2. Cập nhật trạng thái món ăn (Bếp/Staff dùng)
export const updateItemStatus = async (req, res) => {
  try {
    const { orderDetailID, status } = req.body;
    const userID = req.user.userId;
    const userRole = req.user.role;

    // Kiểm tra status hợp lệ
    const validStatuses = ["Pending", "Cooking", "Ready", "Served", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    // Lấy thông tin order detail để kiểm tra quyền
    const orderDetail = await prisma.orderDetail.findUnique({
      where: { orderDetailID: parseInt(orderDetailID) },
      include: { order: { select: { branchID: true } } }
    });

    if (!orderDetail) {
      return res.status(404).json({ message: "Không tìm thấy món ăn" });
    }

    const branchID = orderDetail.order.branchID;
    let allowed = false;

    if (userRole === "RestaurantOwner") {
      const restaurant = await getOwnerRestaurant(userID);
      if (restaurant) {
        const branch = await prisma.branch.findFirst({
          where: { branchID, restaurantID: restaurant.restaurantID },
        });
        if (branch) allowed = true;
      }
    } else if (userRole === "BranchManager") {
      const branch = await prisma.branch.findFirst({
        where: { branchID, managerUserID: userID },
      });
      if (branch) allowed = true;
    } else if (userRole === "Staff" || userRole === "Kitchen") {
      const user = await prisma.user.findFirst({
        where: { userID, branchID },
      });
      if (user) allowed = true;
    }

    if (!allowed) {
      return res.status(403).json({ message: "Bạn không có quyền cập nhật trạng thái cho chi nhánh này" });
    }

    const updated = await prisma.orderDetail.update({
      where: { orderDetailID: parseInt(orderDetailID) },
      data: { itemStatus: status },
      include: { order: { include: { orderTables: { select: { tableID: true }, take: 1 } } } }
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
          data: { orderStatus: "Completed", paymentStatus: "Paid" }
        });
      }
    }

    // Phát realtime cho trang QR của khách
    const io = req.app.get("io");
    const tableID = updated.order?.orderTables?.[0]?.tableID ?? null;
    io?.emit("orderItemStatusChanged", {
      orderDetailID: parseInt(orderDetailID),
      itemStatus: status,
      tableID,
      orderID: updated.orderID,
    });

    res.json({ message: "Cập nhật trạng thái món thành công", updated });
  } catch (error) {
    console.error("updateItemStatus error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// 3. Cập nhật trạng thái nhiều món cùng lúc (Bếp dùng "Gom món" hoặc "Hoàn tất nhanh")
export const updateMultipleItemStatus = async (req, res) => {
  try {
    const { orderDetailIDs, status } = req.body;
    const userID = req.user.userId;
    const userRole = req.user.role;

    const validStatuses = ["Pending", "Cooking", "Ready", "Served", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    if (!Array.isArray(orderDetailIDs) || orderDetailIDs.length === 0) {
      return res.status(400).json({ message: "Danh sách món không hợp lệ" });
    }

    const ids = orderDetailIDs.map(id => parseInt(id));

    // Kiểm tra quyền trên các món này
    // Lấy tất cả branchID của các món này
    const details = await prisma.orderDetail.findMany({
      where: { orderDetailID: { in: ids } },
      include: { order: { select: { branchID: true } } }
    });

    if (details.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy các món ăn yêu cầu" });
    }

    const branchIDs = [...new Set(details.map(d => d.order.branchID))];

    for (const bID of branchIDs) {
      let allowed = false;
      if (userRole === "RestaurantOwner") {
        const restaurant = await getOwnerRestaurant(userID);
        if (restaurant) {
          const branch = await prisma.branch.findFirst({
            where: { branchID: bID, restaurantID: restaurant.restaurantID },
          });
          if (branch) allowed = true;
        }
      } else if (userRole === "BranchManager") {
        const branch = await prisma.branch.findFirst({
          where: { branchID: bID, managerUserID: userID },
        });
        if (branch) allowed = true;
      } else if (userRole === "Staff" || userRole === "Kitchen") {
        const user = await prisma.user.findFirst({
          where: { userID, branchID: bID },
        });
        if (user) allowed = true;
      }

      if (!allowed) {
        return res.status(403).json({ message: `Bạn không có quyền thao tác trên chi nhánh ID: ${bID}` });
      }
    }

    await prisma.orderDetail.updateMany({
      where: { orderDetailID: { in: ids } },
      data: { itemStatus: status }
    });

    if (status === "Served") {
      const affectedDetails = await prisma.orderDetail.findMany({
        where: { orderDetailID: { in: ids } },
        select: { orderID: true }
      });
      const orderIDs = [...new Set(affectedDetails.map(d => d.orderID))];

      for (const orderID of orderIDs) {
        const remaining = await prisma.orderDetail.count({
          where: {
            orderID,
            itemStatus: { notIn: ["Served", "Cancelled"] }
          }
        });

        if (remaining === 0) {
          await prisma.order.update({
            where: { orderID },
            data: { orderStatus: "Completed", paymentStatus: "Paid" }
          });
        }
      }
    }

    // Phát realtime cho từng orderDetailID đã cập nhật
    const io = req.app.get("io");
    if (io) {
      ids.forEach(id => {
        io.emit("orderItemStatusChanged", {
          orderDetailID: id,
          itemStatus: status,
        });
      });
    }

    res.json({ message: "Cập nhật trạng thái hàng loạt thành công" });
  } catch (error) {
    console.error("updateMultipleItemStatus error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* =================== CREATE OWNER MANAGER =================== */
/**
 * POST /owner/managers
 * Tạo tài khoản BranchManager mới và gán vào chi nhánh được chọn.
 */
export const createOwnerManager = async (req, res) => {
  try {
    const userID = req.user.userId;
    const { fullName, username, email, phone, password, branchId, isActive } = req.body;

    // Validate bắt buộc
    if (!username || !email || !password || !branchId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc' });
    }

    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: 'Không tìm thấy nhà hàng' });

    // Kiểm tra chi nhánh thuộc nhà hàng này
    const branch = await prisma.branch.findFirst({
      where: { branchID: parseInt(branchId), restaurantID: restaurant.restaurantID },
    });
    if (!branch) return res.status(404).json({ message: 'Chi nhánh không tồn tại hoặc không thuộc nhà hàng của bạn' });

    // Kiểm tra username/email trùng
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existingUser) {
      if (existingUser.username === username)
        return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    // Mã hóa mật khẩu
    const bcrypt = (await import('bcrypt')).default;
    const passwordHash = await bcrypt.hash(password, 10);

    // Tạo user mới với role BranchManager
    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        fullName: fullName || null,
        email: email.trim(),
        phone: phone || null,
        passwordHash,
        role: 'BranchManager',
        status: isActive === false ? 'Inactive' : 'Active',
      },
    });

    // Gửi email nếu có
    if (newUser.email) {
      await sendNewAccountEmail(newUser.email, newUser.fullName, newUser.username, password, 'BranchManager');
    }

    // Gán manager vào chi nhánh
    await prisma.branch.update({
      where: { branchID: branch.branchID },
      data: { managerUserID: newUser.userID },
    });

    res.status(201).json({
      message: 'Tạo tài khoản quản lý thành công',
      manager: {
        id: newUser.userID,
        username: newUser.username,
        fullName: newUser.fullName,
        email: newUser.email,
        branchId: branch.branchID,
        branchName: branch.name,
      },
    });
  } catch (error) {
    console.error('createOwnerManager error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

/* =================== TOGGLE OWNER MANAGER STATUS =================== */
/**
 * PATCH /owner/managers/:id/toggle
 * Bật/tắt trạng thái Active/Inactive của tài khoản manager.
 */
export const toggleOwnerManager = async (req, res) => {
  try {
    const userID = req.user.userId;
    const managerID = parseInt(req.params.id);

    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: 'Không tìm thấy nhà hàng' });

    // Kiểm tra manager thuộc nhà hàng này
    const manager = await prisma.user.findFirst({
      where: {
        userID: managerID,
        role: 'BranchManager',
        managedBranches: { some: { restaurantID: restaurant.restaurantID } },
      },
    });
    if (!manager) return res.status(404).json({ message: 'Không tìm thấy tài khoản quản lý' });

    const newStatus = manager.status === 'Active' ? 'Inactive' : 'Active';
    await prisma.user.update({
      where: { userID: managerID },
      data: { status: newStatus },
    });

    res.json({ message: `Tài khoản đã được ${newStatus === 'Active' ? 'kích hoạt' : 'tạm dừng'}`, status: newStatus });
  } catch (error) {
    console.error('toggleOwnerManager error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

/* =================== DELETE OWNER MANAGER =================== */
/**
 * DELETE /owner/managers/:id
 * Xóa tài khoản manager và xóa gán khỏi chi nhánh.
 */
export const deleteOwnerManager = async (req, res) => {
  try {
    const userID = req.user.userId;
    const managerID = parseInt(req.params.id);

    const restaurant = await getOwnerRestaurant(userID);
    if (!restaurant) return res.status(404).json({ message: 'Không tìm thấy nhà hàng' });

    const manager = await prisma.user.findFirst({
      where: {
        userID: managerID,
        role: 'BranchManager',
        managedBranches: { some: { restaurantID: restaurant.restaurantID } },
      },
    });
    if (!manager) return res.status(404).json({ message: 'Không tìm thấy tài khoản quản lý' });

    // Xóa gán manager khỏi chi nhánh trước
    await prisma.branch.updateMany({
      where: { managerUserID: managerID, restaurantID: restaurant.restaurantID },
      data: { managerUserID: null },
    });

    // Xóa tài khoản
    await prisma.user.delete({ where: { userID: managerID } });

    res.json({ message: 'Đã xóa tài khoản quản lý' });
  } catch (error) {
    console.error('deleteOwnerManager error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};
