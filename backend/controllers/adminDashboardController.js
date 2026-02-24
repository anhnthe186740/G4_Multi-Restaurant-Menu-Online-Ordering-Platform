import prisma from "../config/prismaClient.js";

/* ================= GET DASHBOARD OVERVIEW ================= */
export const getOverview = async (req, res) => {
  try {
    const [
      totalRestaurants,
      activeSubscriptions,
      pendingRequests,
      expiringSoon,
      revenueAgg,
      monthlyRevenueAgg,
    ] = await Promise.all([
      // Total restaurants
      prisma.restaurant.count(),

      // Active subscriptions
      prisma.subscription.count({ where: { status: "Active" } }),

      // Pending registration requests
      prisma.registrationRequest.count({ where: { approvalStatus: "Pending" } }),

      // Expiring within 7 days
      prisma.subscription.count({
        where: {
          status: "Active",
          endDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Total revenue from active subscriptions
      prisma.subscription.findMany({
        where: { status: "Active" },
        include: { package: { select: { price: true } } },
      }),

      // Monthly revenue (current month)
      prisma.subscription.findMany({
        where: {
          status: "Active",
          startDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
          },
        },
        include: { package: { select: { price: true } } },
      }),
    ]);

    const totalRevenue = revenueAgg.reduce(
      (sum, s) => sum + (parseFloat(s.package?.price) || 0), 0
    );
    const monthlyRevenue = monthlyRevenueAgg.reduce(
      (sum, s) => sum + (parseFloat(s.package?.price) || 0), 0
    );

    res.json({
      totalRestaurants,
      activeRestaurants: totalRestaurants,
      totalRevenue,
      pendingRequests,
      activeSubscriptions,
      monthlyRevenue,
      expiringSoon,
    });
  } catch (error) {
    console.error("getOverview error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= GET REVENUE CHART ================= */
export const getRevenueChart = async (req, res) => {
  try {
    // Dùng $queryRaw vì cần DATE_FORMAT (MySQL function)
    const results = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(s.StartDate, '%Y-%m') as month,
        SUM(sp.Price) as revenue
      FROM Subscriptions s
      INNER JOIN ServicePackages sp ON s.PackageID = sp.PackageID
      WHERE s.StartDate >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(s.StartDate, '%Y-%m')
      ORDER BY month ASC
    `;

    const labels = results.map((r) => r.month);
    const data = results.map((r) => parseFloat(r.revenue));

    res.json({ labels, data });
  } catch (error) {
    console.error("getRevenueChart error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= GET PACKAGE DISTRIBUTION ================= */
export const getPackageDistribution = async (req, res) => {
  try {
    const packages = await prisma.servicePackage.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { subscriptions: { where: { status: "Active" } } },
        },
      },
      orderBy: { packageID: "asc" },
    });

    const results = packages.map((pkg) => ({
      packageName: pkg.packageName,
      count: pkg._count.subscriptions,
    }));

    res.json(results);
  } catch (error) {
    console.error("getPackageDistribution error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= GET PENDING REQUESTS ================= */
export const getPendingRequests = async (req, res) => {
  try {
    const requests = await prisma.registrationRequest.findMany({
      where: { approvalStatus: "Pending" },
      orderBy: { submissionDate: "desc" },
      take: 10,
      select: {
        requestID: true,
        ownerName: true,
        restaurantName: true,
        contactInfo: true,
        submissionDate: true,
        approvalStatus: true,
      },
    });

    res.json(requests);
  } catch (error) {
    console.error("getPendingRequests error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= GET RECENT TICKETS ================= */
export const getRecentTickets = async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        ticketID: true,
        subject: true,
        priority: true,
        status: true,
        createdAt: true,
        user: { select: { fullName: true } },
      },
    });

    const result = tickets.map((t) => ({
      TicketID: t.ticketID,
      Subject: t.subject,
      Priority: t.priority,
      Status: t.status,
      CreatedAt: t.createdAt,
      userName: t.user?.fullName || null,
    }));

    res.json(result);
  } catch (error) {
    console.error("getRecentTickets error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= GET EXPIRING SUBSCRIPTIONS ================= */
export const getExpiringSubscriptions = async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: "Active",
        endDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { endDate: "asc" },
      include: {
        restaurant: { select: { name: true } },
        package: { select: { packageName: true } },
      },
    });

    const result = subscriptions.map((s) => ({
      SubscriptionID: s.subscriptionID,
      RestaurantName: s.restaurant?.name,
      PackageName: s.package?.packageName,
      EndDate: s.endDate,
      DaysRemaining: Math.ceil((new Date(s.endDate) - new Date()) / (1000 * 60 * 60 * 24)),
    }));

    res.json(result);
  } catch (error) {
    console.error("getExpiringSubscriptions error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= GET PAYMENT HISTORY ================= */
export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await prisma.subscription.findMany({
      orderBy: { startDate: "desc" },
      take: 10,
      include: {
        restaurant: {
          select: {
            name: true,
            owner: { select: { fullName: true } },
          },
        },
        package: { select: { packageName: true, price: true } },
      },
    });

    const result = payments.map((s) => ({
      SubscriptionID: s.subscriptionID,
      RestaurantName: s.restaurant?.name,
      OwnerName: s.restaurant?.owner?.fullName,
      PackageName: s.package?.packageName,
      Amount: s.package?.price,
      PaymentDate: s.startDate,
      Status: s.status,
      EndDate: s.endDate,
    }));

    res.json(result);
  } catch (error) {
    console.error("getPaymentHistory error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};
