import prisma from "../config/prismaClient.js";

/* ================= GET ALL RESTAURANTS ================= */
export const getAllRestaurants = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.owner = { status };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { owner: { fullName: { contains: search } } },
        { owner: { email: { contains: search } } },
      ];
    }

    const [totalRestaurants, restaurants] = await Promise.all([
      prisma.restaurant.count({ where }),
      prisma.restaurant.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { restaurantID: "desc" },
        include: {
          owner: {
            select: { userID: true, fullName: true, email: true, phone: true, status: true, createdAt: true },
          },
          _count: { select: { branches: true } },
          subscriptions: {
            where: { status: "Active" },
            orderBy: { endDate: "desc" },
            take: 1,
            include: { package: { select: { packageName: true } } },
          },
        },
      }),
    ]);

    const result = restaurants.map((r) => ({
      RestaurantID: r.restaurantID,
      restaurantName: r.name,
      Logo: r.logo,
      Description: r.description,
      TaxCode: r.taxCode,
      Website: r.website,
      ownerID: r.owner?.userID,
      ownerName: r.owner?.fullName,
      ownerEmail: r.owner?.email,
      ownerPhone: r.owner?.phone,
      ownerStatus: r.owner?.status,
      registeredDate: r.owner?.createdAt,
      branchCount: r._count.branches,
      currentPackage: r.subscriptions[0]?.package?.packageName || null,
      packageExpiryDate: r.subscriptions[0]?.endDate || null,
    }));

    res.json({
      restaurants: result,
      pagination: {
        total: totalRestaurants,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalRestaurants / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("getAllRestaurants error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= GET RESTAURANT DETAILS ================= */
export const getRestaurantDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { restaurantID: parseInt(id) },
      include: {
        owner: {
          select: { userID: true, username: true, fullName: true, email: true, phone: true, status: true, createdAt: true },
        },
        branches: {
          include: {
            manager: { select: { fullName: true } },
            _count: { select: { tables: true } },
          },
        },
        subscriptions: {
          orderBy: { startDate: "desc" },
          include: { package: { select: { packageName: true, price: true } } },
        },
      },
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Get tickets from owner
    const tickets = restaurant.owner
      ? await prisma.supportTicket.findMany({
          where: { userID: restaurant.owner.userID },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { ticketID: true, subject: true, description: true, priority: true, status: true, createdAt: true },
        })
      : [];

    res.json({
      restaurant: {
        RestaurantID: restaurant.restaurantID,
        Name: restaurant.name,
        Logo: restaurant.logo,
        Description: restaurant.description,
        TaxCode: restaurant.taxCode,
        Website: restaurant.website,
        ownerID: restaurant.owner?.userID,
        ownerUsername: restaurant.owner?.username,
        ownerName: restaurant.owner?.fullName,
        ownerEmail: restaurant.owner?.email,
        ownerPhone: restaurant.owner?.phone,
        ownerStatus: restaurant.owner?.status,
        registeredDate: restaurant.owner?.createdAt,
      },
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
      subscriptions: restaurant.subscriptions.map((s) => ({
        SubscriptionID: s.subscriptionID,
        StartDate: s.startDate,
        EndDate: s.endDate,
        Status: s.status,
        AutoRenew: s.autoRenew,
        PackageName: s.package?.packageName,
        Price: s.package?.price,
      })),
      tickets,
    });
  } catch (error) {
    console.error("getRestaurantDetails error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= SOFT DELETE — DEACTIVATE RESTAURANT ================= */
export const deactivateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const restaurant = await prisma.restaurant.findUnique({
      where: { restaurantID: parseInt(id) },
      select: { ownerUserID: true },
    });

    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    if (!restaurant.ownerUserID) {
      return res.status(400).json({ message: "Cannot deactivate: This restaurant has no associated owner account." });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { userID: restaurant.ownerUserID },
        data: { status: "Inactive" },
      });

      if (reason) {
        await tx.supportTicket.create({
          data: {
            userID: restaurant.ownerUserID,
            subject: "Account Deactivated",
            description: `Deactivation reason: ${reason}`,
            priority: "High",
            status: "Closed",
          },
        });
      }
    });

    res.json({ message: "Restaurant deactivated successfully" });
  } catch (error) {
    console.error("deactivateRestaurant error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= REACTIVATE RESTAURANT ================= */
export const reactivateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { restaurantID: parseInt(id) },
      select: { ownerUserID: true },
    });

    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    if (!restaurant.ownerUserID) {
      return res.status(400).json({ message: "Cannot reactivate: This restaurant has no associated owner account." });
    }

    await prisma.user.update({
      where: { userID: restaurant.ownerUserID },
      data: { status: "Active" },
    });

    res.json({ message: "Restaurant reactivated successfully" });
  } catch (error) {
    console.error("reactivateRestaurant error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= FORCE DELETE RESTAURANT ================= */
export const forceDeleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { restaurantID: parseInt(id) },
      select: { ownerUserID: true },
    });

    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    // Schema có onDelete: Cascade nên chỉ cần xóa Restaurant
    // Branches, Tables, Categories, Products, Discounts, Subscriptions sẽ tự cascade
    // Nhưng Orders → Invoices → Transactions cần xử lý thủ công
    await prisma.$transaction(async (tx) => {
      const branches = await tx.branch.findMany({
        where: { restaurantID: parseInt(id) },
        select: { branchID: true },
      });
      const branchIDs = branches.map((b) => b.branchID);

      if (branchIDs.length > 0) {
        const orders = await tx.order.findMany({
          where: { branchID: { in: branchIDs } },
          select: { orderID: true },
        });
        const orderIDs = orders.map((o) => o.orderID);

        if (orderIDs.length > 0) {
          const invoices = await tx.invoice.findMany({
            where: { orderID: { in: orderIDs } },
            select: { invoiceID: true },
          });
          const invoiceIDs = invoices.map((i) => i.invoiceID);

          if (invoiceIDs.length > 0) {
            await tx.transaction.deleteMany({ where: { invoiceID: { in: invoiceIDs } } });
            await tx.invoiceDetail.deleteMany({ where: { invoiceID: { in: invoiceIDs } } });
            await tx.invoice.deleteMany({ where: { invoiceID: { in: invoiceIDs } } });
          }
          // orderDetails cascade từ orders
          await tx.order.deleteMany({ where: { orderID: { in: orderIDs } } });
        }
      }

      // Xóa restaurant (cascade: branches, tables, categories, products, discounts, subscriptions)
      await tx.restaurant.delete({ where: { restaurantID: parseInt(id) } });

      // Xóa owner user nếu có
      if (restaurant.ownerUserID) {
        await tx.supportTicket.deleteMany({ where: { userID: restaurant.ownerUserID } });
        await tx.user.delete({ where: { userID: restaurant.ownerUserID } });
      }
    });

    res.json({ message: "Restaurant permanently deleted" });
  } catch (error) {
    console.error("forceDeleteRestaurant error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= UPDATE RESTAURANT INFO ================= */
export const updateRestaurantInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, website, logo } = req.body;

    const data = {};
    if (name) data.name = name;
    if (description !== undefined) data.description = description;
    if (website !== undefined) data.website = website;
    if (logo !== undefined) data.logo = logo;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    await prisma.restaurant.update({
      where: { restaurantID: parseInt(id) },
      data,
    });

    res.json({ message: "Restaurant updated successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    console.error("updateRestaurantInfo error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= GET RESTAURANT STATISTICS ================= */
export const getRestaurantStats = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantID = parseInt(id);

    const [subscriptionAgg, branchCount, tableCount, activeSub] = await Promise.all([
      prisma.subscription.findMany({
        where: { restaurantID },
        include: { package: { select: { price: true } } },
      }),
      prisma.branch.count({ where: { restaurantID } }),
      prisma.table.count({ where: { branch: { restaurantID } } }),
      prisma.subscription.findFirst({
        where: { restaurantID, status: "Active" },
        orderBy: { endDate: "desc" },
        include: { package: { select: { packageName: true } } },
      }),
    ]);

    const totalRevenue = subscriptionAgg.reduce(
      (sum, s) => sum + (parseFloat(s.package?.price) || 0), 0
    );

    res.json({
      totalRevenue,
      subscriptionCount: subscriptionAgg.length,
      branchCount,
      totalTables: tableCount,
      activeSubscription: activeSub
        ? { PackageName: activeSub.package?.packageName, EndDate: activeSub.endDate, AutoRenew: activeSub.autoRenew }
        : null,
    });
  } catch (error) {
    console.error("getRestaurantStats error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};
