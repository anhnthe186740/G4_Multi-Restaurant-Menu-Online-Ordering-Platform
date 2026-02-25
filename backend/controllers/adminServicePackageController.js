import prisma from "../config/prismaClient.js";

// GET /api/admin/service-packages
export const getAllPackages = async (req, res) => {
  try {
    const packages = await prisma.servicePackage.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
    res.json(packages);
  } catch (error) {
    console.error("Error fetching packages:", error);
    res.status(500).json({ message: "Lỗi khi tải danh sách gói dịch vụ" });
  }
};

// POST /api/admin/service-packages
export const createPackage = async (req, res) => {
  // Frontend có thể gửi "Description" hoặc "FeaturesDescription"
  const { PackageName, Duration, Price, Description, FeaturesDescription } = req.body;

  if (!PackageName || !Duration || !Price) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
  }

  try {
    const newPackage = await prisma.servicePackage.create({
      data: {
        packageName: PackageName,
        duration: parseInt(Duration),
        price: parseFloat(Price),
        // Chấp nhận cả 2 tên field từ frontend
        featuresDescription: FeaturesDescription || Description || null,
        isActive: true,
      },
    });

    res.status(201).json(newPackage);
  } catch (error) {
    console.error("Error creating package:", error);
    res.status(500).json({ message: "Lỗi khi tạo gói dịch vụ" });
  }
};

// PUT /api/admin/service-packages/:id
export const updatePackage = async (req, res) => {
  const { id } = req.params;
  const { PackageName, Duration, Price, Description, FeaturesDescription } = req.body;

  console.log("updatePackage body:", req.body);

  try {
    const data = {};
    if (PackageName != null) data.packageName = PackageName;
    if (Duration != null) data.duration = parseInt(Duration);
    if (Price != null) data.price = parseFloat(Price);
    const desc = FeaturesDescription ?? Description;
    if (desc !== undefined) data.featuresDescription = desc ?? null;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "Không có trường nào để cập nhật" });
    }

    const updated = await prisma.servicePackage.update({
      where: { packageID: parseInt(id) },
      data,
    });

    res.json(updated);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Không tìm thấy gói dịch vụ" });
    }
    console.error("Error updating package:", error);
    res.status(500).json({ message: error.message || "Lỗi khi cập nhật gói dịch vụ" });
  }
};

// DELETE /api/admin/service-packages/:id (soft delete)
export const deletePackage = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.servicePackage.update({
      where: { packageID: parseInt(id) },
      data: { isActive: false },
    });

    res.json({ message: "Đã xóa gói dịch vụ thành công" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Không tìm thấy gói dịch vụ" });
    }
    console.error("Error deleting package:", error);
    res.status(500).json({ message: "Lỗi khi xóa gói dịch vụ" });
  }
};

// POST /api/admin/service-packages/renew
export const renewSubscription = async (req, res) => {
  const { restaurantId, packageId } = req.body;

  if (!restaurantId || !packageId) {
    return res.status(400).json({ message: "Thiếu thông tin gia hạn" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lấy thông tin gói
      const pkg = await tx.servicePackage.findUnique({
        where: { packageID: parseInt(packageId) },
      });
      if (!pkg) throw new Error("Gói dịch vụ không tồn tại");

      // 2. Smart renewal: tìm EndDate xa nhất trong các sub Active
      const latestActiveSub = await tx.subscription.findFirst({
        where: {
          restaurantID: parseInt(restaurantId),
          status: "Active",
        },
        orderBy: { endDate: "desc" },
      });

      let newStartDate = new Date();
      if (latestActiveSub?.endDate && new Date(latestActiveSub.endDate) > newStartDate) {
        newStartDate = new Date(latestActiveSub.endDate); // Cộng dồn
      }

      // 3. Tính EndDate
      const newEndDate = new Date(newStartDate);
      newEndDate.setMonth(newEndDate.getMonth() + pkg.duration);

      // 4. Tạo Subscription mới
      const newSub = await tx.subscription.create({
        data: {
          restaurantID: parseInt(restaurantId),
          packageID: parseInt(packageId),
          startDate: newStartDate,
          endDate: newEndDate,
          status: "Active",
          autoRenew: false,
        },
      });

      return { newSub, newStartDate, newEndDate };
    });

    res.json({
      message: "Gia hạn thành công",
      startDate: result.newStartDate,
      newEndDate: result.newEndDate,
    });
  } catch (error) {
    console.error("Error renewing subscription:", error);
    res.status(500).json({ message: error.message || "Lỗi khi gia hạn" });
  }
};

// GET /api/admin/service-packages/history
export const getSubscriptionHistory = async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { startDate: "desc" },
      take: 50,
      include: {
        restaurant: { select: { name: true } },
        package: { select: { packageName: true, price: true } },
      },
    });

    const result = subscriptions.map((s) => ({
      SubscriptionID: s.subscriptionID,
      RestaurantName: s.restaurant?.name,
      PackageName: s.package?.packageName,
      Price: s.package?.price,
      StartDate: s.startDate,
      EndDate: s.endDate,
      Status: s.status,
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ message: "Lỗi tải lịch sử giao dịch" });
  }
};

// GET /api/admin/service-packages/restaurants-for-renewal
export const getRestaurantsForRenewal = async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { name: "asc" },
      include: {
        owner: { select: { fullName: true, phone: true } },
      },
    });

    const result = restaurants.map((r) => ({
      RestaurantID: r.restaurantID,
      RestaurantName: r.name,
      OwnerName: r.owner?.fullName,
      OwnerPhone: r.owner?.phone,
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching restaurants for renewal:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/admin/service-packages/active-subscriptions
export const getRestaurantStatuses = async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { name: "asc" },
      include: {
        owner: { select: { fullName: true, phone: true } },
        subscriptions: {
          where: { status: "Active" },
          orderBy: { endDate: "desc" },
          take: 1,
          include: { package: { select: { packageName: true } } },
        },
      },
    });

    const result = restaurants.map((r) => {
      const activeSub = r.subscriptions[0] || null;
      const endDate = activeSub?.endDate ? new Date(activeSub.endDate) : null;
      const now = new Date();

      let status = "None";
      let daysRemaining = null;
      if (endDate) {
        status = endDate > now ? "Active" : "Expired";
        daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      }

      return {
        RestaurantID: r.restaurantID,
        RestaurantName: r.name,
        OwnerName: r.owner?.fullName,
        Phone: r.owner?.phone,
        CurrentPackage: activeSub?.package?.packageName || "Chưa đăng ký",
        ExpiryDate: endDate,
        Status: status,
        DaysRemaining: daysRemaining,
      };
    });

    // Sort: Active first
    result.sort((a, b) => {
      if (a.Status === "Active" && b.Status !== "Active") return -1;
      if (a.Status !== "Active" && b.Status === "Active") return 1;
      return (a.ExpiryDate || 0) - (b.ExpiryDate || 0);
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching restaurant statuses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
