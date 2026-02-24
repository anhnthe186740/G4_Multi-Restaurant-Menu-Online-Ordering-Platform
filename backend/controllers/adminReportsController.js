import prisma from "../config/prismaClient.js";

/* ================= GET ALL REPORTS WITH FILTERS ================= */
export const getAllReports = async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    if (status && status !== "All") where.status = status;
    if (priority && priority !== "All") where.priority = priority;
    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { description: { contains: search } },
        { user: { fullName: { contains: search } } },
      ];
    }

    const [totalRecords, reports] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              ownedRestaurants: { select: { restaurantID: true, name: true }, take: 1 },
            },
          },
        },
      }),
    ]);

    const result = reports.map((t) => ({
      TicketID: t.ticketID,
      Subject: t.subject,
      Description: t.description,
      Priority: t.priority,
      Status: t.status,
      Resolution: t.resolution,
      CreatedAt: t.createdAt,
      UserName: t.user?.fullName,
      UserEmail: t.user?.email,
      RestaurantName: t.user?.ownedRestaurants?.[0]?.name || null,
      RestaurantID: t.user?.ownedRestaurants?.[0]?.restaurantID || null,
    }));

    res.json({
      reports: result,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRecords / parseInt(limit)),
        totalRecords,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("getAllReports error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= GET REPORT STATISTICS ================= */
export const getReportStats = async (req, res) => {
  try {
    const [total, byStatus] = await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.groupBy({
        by: ["status"],
        _count: { ticketID: true },
      }),
    ]);

    const statusCounts = { Open: 0, InProgress: 0, Resolved: 0, Closed: 0 };
    byStatus.forEach((item) => {
      if (item.status && statusCounts.hasOwnProperty(item.status)) {
        statusCounts[item.status] = item._count.ticketID;
      }
    });

    res.json({ totalThisMonth: total, byStatus: statusCounts });
  } catch (error) {
    console.error("getReportStats error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= GET REPORT BY ID ================= */
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { ticketID: parseInt(id) },
      include: {
        user: {
          select: {
            userID: true,
            fullName: true,
            email: true,
            phone: true,
            ownedRestaurants: { select: { restaurantID: true, name: true }, take: 1 },
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json({
      TicketID: ticket.ticketID,
      Subject: ticket.subject,
      Description: ticket.description,
      Priority: ticket.priority,
      Status: ticket.status,
      Resolution: ticket.resolution,
      CreatedAt: ticket.createdAt,
      UserID: ticket.user?.userID,
      UserName: ticket.user?.fullName,
      UserEmail: ticket.user?.email,
      UserPhone: ticket.user?.phone,
      RestaurantName: ticket.user?.ownedRestaurants?.[0]?.name || null,
      RestaurantID: ticket.user?.ownedRestaurants?.[0]?.restaurantID || null,
    });
  } catch (error) {
    console.error("getReportById error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= UPDATE REPORT STATUS ================= */
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;

    const validStatuses = ["Open", "InProgress", "Resolved", "Closed"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const updated = await prisma.supportTicket.update({
      where: { ticketID: parseInt(id) },
      data: {
        ...(status && { status }),
        ...(resolution !== undefined && { resolution }),
      },
    });

    res.json({ message: "Report updated successfully", report: updated });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Report not found" });
    }
    console.error("updateReportStatus error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= ADD REPORT RESPONSE ================= */
export const addReportResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({ message: "Response is required" });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { ticketID: parseInt(id) },
      select: { resolution: true },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Report not found" });
    }

    const timestamp = new Date().toISOString();
    const newResolution = ticket.resolution
      ? `${ticket.resolution}\n\n[${timestamp}] Admin: ${response}`
      : `[${timestamp}] Admin: ${response}`;

    await prisma.supportTicket.update({
      where: { ticketID: parseInt(id) },
      data: { resolution: newResolution, status: "InProgress" },
    });

    res.json({ message: "Response added successfully", resolution: newResolution });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Report not found" });
    }
    console.error("addReportResponse error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};
