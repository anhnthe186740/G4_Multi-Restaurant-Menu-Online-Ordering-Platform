import { db as pool } from "../config/db.js";

/* ================= GET DASHBOARD OVERVIEW ================= */
export const getOverview = async (req, res) => {
  try {
    // Total restaurants
    const [restaurants] = await pool.query(`
      SELECT COUNT(*) as total FROM Restaurants
    `);

    // Active subscriptions
    const [activeSubscriptions] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM Subscriptions 
      WHERE Status = 'Active'
    `);

    // Total revenue from active subscriptions
    const [revenue] = await pool.query(`
      SELECT SUM(sp.Price) as total
      FROM Subscriptions s
      INNER JOIN ServicePackages sp ON s.PackageID = sp.PackageID
      WHERE s.Status = 'Active'
    `);

    // Pending registration requests
    const [pendingRequests] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM RegistrationRequests 
      WHERE ApprovalStatus = 'Pending'
    `);

    // Monthly revenue (current month)
    const [monthlyRevenue] = await pool.query(`
      SELECT SUM(sp.Price) as total
      FROM Subscriptions s
      INNER JOIN ServicePackages sp ON s.PackageID = sp.PackageID
      WHERE s.Status = 'Active'
        AND MONTH(s.StartDate) = MONTH(CURRENT_DATE())
        AND YEAR(s.StartDate) = YEAR(CURRENT_DATE())
    `);

    // Expiring soon (within 7 days)
    const [expiringSoon] = await pool.query(`
      SELECT COUNT(*) as total
      FROM Subscriptions
      WHERE Status = 'Active'
        AND EndDate BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)
    `);

    res.json({
      totalRestaurants: restaurants[0].total || 0,
      activeRestaurants: restaurants[0].total || 0,
      totalRevenue: parseFloat(revenue[0].total || 0),
      pendingRequests: pendingRequests[0].total || 0,
      activeSubscriptions: activeSubscriptions[0].total || 0,
      monthlyRevenue: parseFloat(monthlyRevenue[0].total || 0),
      expiringSoon: expiringSoon[0].total || 0
    });
  } catch (error) {
    console.error("getOverview error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= GET REVENUE CHART ================= */
export const getRevenueChart = async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT 
        DATE_FORMAT(s.StartDate, '%Y-%m') as month,
        SUM(sp.Price) as revenue
      FROM Subscriptions s
      INNER JOIN ServicePackages sp ON s.PackageID = sp.PackageID
      WHERE s.StartDate >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(s.StartDate, '%Y-%m')
      ORDER BY month ASC
    `);

    const labels = results.map(r => r.month);
    const data = results.map(r => parseFloat(r.revenue));

    res.json({ labels, data });
  } catch (error) {
    console.error("getRevenueChart error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= GET PACKAGE DISTRIBUTION ================= */
export const getPackageDistribution = async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT 
        sp.PackageName as packageName,
        COUNT(s.SubscriptionID) as count
      FROM ServicePackages sp
      LEFT JOIN Subscriptions s ON sp.PackageID = s.PackageID AND s.Status = 'Active'
      WHERE sp.IsActive = TRUE
      GROUP BY sp.PackageID, sp.PackageName
      ORDER BY count DESC
    `);

    res.json(results);
  } catch (error) {
    console.error("getPackageDistribution error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= GET PENDING REQUESTS ================= */
export const getPendingRequests = async (req, res) => {
  try {
    const [requests] = await pool.query(`
      SELECT 
        RequestID,
        OwnerName,
        RestaurantName,
        ContactInfo,
        SubmissionDate,
        ApprovalStatus
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

/* ================= GET RECENT TICKETS ================= */
export const getRecentTickets = async (req, res) => {
  try {
    const [tickets] = await pool.query(`
      SELECT 
        st.TicketID,
        st.Subject,
        st.Priority,
        st.Status,
        st.CreatedAt,
        u.FullName as userName
      FROM SupportTickets st
      LEFT JOIN Users u ON st.UserID = u.UserID
      ORDER BY st.CreatedAt DESC
      LIMIT 10
    `);

    res.json(tickets);
  } catch (error) {
    console.error("getRecentTickets error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= GET EXPIRING SUBSCRIPTIONS ================= */
export const getExpiringSubscriptions = async (req, res) => {
  try {
    const [subscriptions] = await pool.query(`
      SELECT 
        s.SubscriptionID,
        r.Name as RestaurantName,
        sp.PackageName,
        s.EndDate,
        DATEDIFF(s.EndDate, CURRENT_DATE()) as DaysRemaining
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

/* ================= GET PAYMENT HISTORY ================= */
export const getPaymentHistory = async (req, res) => {
  try {
    const [payments] = await pool.query(`
      SELECT 
        s.SubscriptionID,
        r.Name as RestaurantName,
        u.FullName as OwnerName,
        sp.PackageName,
        sp.Price as Amount,
        s.StartDate as PaymentDate,
        s.Status,
        s.EndDate
      FROM Subscriptions s
      INNER JOIN Restaurants r ON s.RestaurantID = r.RestaurantID
      INNER JOIN Users u ON r.OwnerUserID = u.UserID
      INNER JOIN ServicePackages sp ON s.PackageID = sp.PackageID
      ORDER BY s.StartDate DESC
      LIMIT 10
    `);

    res.json(payments);
  } catch (error) {
    console.error("getPaymentHistory error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};
