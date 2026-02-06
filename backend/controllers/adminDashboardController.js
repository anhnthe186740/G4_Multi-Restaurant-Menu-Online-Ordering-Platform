import { db } from "../config/db.js";

/* ================= DASHBOARD OVERVIEW ================= */
export const getOverview = async (req, res) => {
  try {
    // 1. Count total restaurants
    const [totalRestaurants] = await db.query(
      "SELECT COUNT(*) as count FROM Restaurants"
    );

    // 2. Count restaurants by status (using OwnerUserID status)
    const [activeRestaurants] = await db.query(`
      SELECT COUNT(*) as count 
      FROM Restaurants r
      INNER JOIN Users u ON r.OwnerUserID = u.UserID
      WHERE u.Status = 'Active'
    `);

    const [inactiveRestaurants] = await db.query(`
      SELECT COUNT(*) as count 
      FROM Restaurants r
      INNER JOIN Users u ON r.OwnerUserID = u.UserID
      WHERE u.Status = 'Inactive'
    `);

    // 3. Count pending registration requests
    const [pendingRequests] = await db.query(
      "SELECT COUNT(*) as count FROM RegistrationRequests WHERE ApprovalStatus = 'Pending'"
    );

    // 4. Calculate total revenue from subscriptions
    const [totalRevenue] = await db.query(`
      SELECT COALESCE(SUM(sp.Price), 0) as total
      FROM Subscriptions s
      INNER JOIN ServicePackages sp ON s.PackageID = sp.PackageID
      WHERE s.Status = 'Active' OR s.Status = 'Expired'
    `);

    // 5. Calculate this month's revenue
    const [monthlyRevenue] = await db.query(`
      SELECT COALESCE(SUM(sp.Price), 0) as total
      FROM Subscriptions s
      INNER JOIN ServicePackages sp ON s.PackageID = sp.PackageID
      WHERE MONTH(s.StartDate) = MONTH(CURRENT_DATE())
        AND YEAR(s.StartDate) = YEAR(CURRENT_DATE())
    `);

    // 6. Count active subscriptions
    const [activeSubscriptions] = await db.query(
      "SELECT COUNT(*) as count FROM Subscriptions WHERE Status = 'Active'"
    );

    // 7. Count subscriptions expiring soon (within 7 days)
    const [expiringSoon] = await db.query(`
      SELECT COUNT(*) as count 
      FROM Subscriptions 
      WHERE Status = 'Active' 
        AND EndDate BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)
    `);

    res.json({
      totalRestaurants: totalRestaurants[0].count,
      activeRestaurants: activeRestaurants[0].count,
      inactiveRestaurants: inactiveRestaurants[0].count,
      pendingRequests: pendingRequests[0].count,
      totalRevenue: parseFloat(totalRevenue[0].total),
      monthlyRevenue: parseFloat(monthlyRevenue[0].total),
      activeSubscriptions: activeSubscriptions[0].count,
      expiringSoon: expiringSoon[0].count
    });
  } catch (error) {
    console.error("getOverview error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= REVENUE CHART DATA ================= */
export const getRevenueChart = async (req, res) => {
  try {
    // Get revenue for last 6 months
    const [revenueData] = await db.query(`
      SELECT 
        DATE_FORMAT(s.StartDate, '%Y-%m') as month,
        SUM(sp.Price) as revenue
      FROM Subscriptions s
      INNER JOIN ServicePackages sp ON s.PackageID = sp.PackageID
      WHERE s.StartDate >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(s.StartDate, '%Y-%m')
      ORDER BY month ASC
    `);

    // Format for chart
    const labels = [];
    const data = [];
    
    revenueData.forEach(row => {
      // Convert YYYY-MM to Month name
      const [year, month] = row.month.split('-');
      const date = new Date(year, month - 1);
      const monthName = date.toLocaleString('vi-VN', { month: 'short' });
      
      labels.push(monthName);
      data.push(parseFloat(row.revenue));
    });

    res.json({ labels, data });
  } catch (error) {
    console.error("getRevenueChart error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= PACKAGE DISTRIBUTION ================= */
export const getPackageDistribution = async (req, res) => {
  try {
    const [packageData] = await db.query(`
      SELECT 
        sp.PackageName,
        COUNT(s.SubscriptionID) as count,
        SUM(sp.Price) as revenue
      FROM ServicePackages sp
      LEFT JOIN Subscriptions s ON sp.PackageID = s.PackageID AND s.Status = 'Active'
      WHERE sp.IsActive = TRUE
      GROUP BY sp.PackageID, sp.PackageName
      ORDER BY count DESC
    `);

    const result = packageData.map(row => ({
      packageName: row.PackageName,
      count: row.count,
      revenue: parseFloat(row.revenue || 0)
    }));

    res.json(result);
  } catch (error) {
    console.error("getPackageDistribution error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= PENDING REQUESTS ================= */
export const getPendingRequests = async (req, res) => {
  try {
    const [requests] = await db.query(`
      SELECT 
        RequestID,
        OwnerName,
        RestaurantName,
        ContactInfo,
        SubmissionDate
      FROM RegistrationRequests
      WHERE ApprovalStatus = 'Pending'
      ORDER BY SubmissionDate DESC
      LIMIT 10
    `);

    res.json(requests);
  } catch (error) {
    console.error("getPendingRequests error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= RECENT SUPPORT TICKETS ================= */
export const getRecentTickets = async (req, res) => {
  try {
    const [tickets] = await db.query(`
      SELECT 
        st.TicketID,
        st.Subject,
        st.Priority,
        st.Status,
        st.CreatedAt,
        u.FullName as userName
      FROM SupportTickets st
      INNER JOIN Users u ON st.UserID = u.UserID
      ORDER BY st.CreatedAt DESC
      LIMIT 10
    `);

    res.json(tickets);
  } catch (error) {
    console.error("getRecentTickets error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= EXPIRING SUBSCRIPTIONS ================= */
export const getExpiringSubscriptions = async (req, res) => {
  try {
    const [subscriptions] = await db.query(`
      SELECT 
        s.SubscriptionID,
        r.Name as restaurantName,
        sp.PackageName,
        s.EndDate,
        DATEDIFF(s.EndDate, CURRENT_DATE()) as daysLeft
      FROM Subscriptions s
      INNER JOIN Restaurants r ON s.RestaurantID = r.RestaurantID
      INNER JOIN ServicePackages sp ON s.PackageID = sp.PackageID
      WHERE s.Status = 'Active'
        AND s.EndDate BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)
      ORDER BY s.EndDate ASC
    `);

    res.json(subscriptions);
  } catch (error) {
    console.error("getExpiringSubscriptions error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};
