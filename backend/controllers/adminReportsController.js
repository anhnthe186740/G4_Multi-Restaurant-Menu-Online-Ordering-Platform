import { db as pool } from "../config/db.js";

/* ================= GET ALL REPORTS WITH FILTERS ================= */
export const getAllReports = async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Build WHERE clause dynamically
    let whereConditions = [];
    let queryParams = [];

    if (status && status !== 'All') {
      whereConditions.push('st.Status = ?');
      queryParams.push(status);
    }

    if (priority && priority !== 'All') {
      whereConditions.push('st.Priority = ?');
      queryParams.push(priority);
    }

    if (search) {
      whereConditions.push('(st.Subject LIKE ? OR st.Description LIKE ? OR u.FullName LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM SupportTickets st
      LEFT JOIN Users u ON st.UserID = u.UserID
      ${whereClause}
    `;
    const [countResult] = await pool.query(countQuery, queryParams);
    const totalRecords = countResult[0].total;

    // Get paginated results with restaurant info
    const dataQuery = `
      SELECT 
        st.TicketID,
        st.Subject,
        st.Description,
        st.Priority,
        st.Status,
        st.Resolution,
        st.CreatedAt,
        u.FullName as UserName,
        u.Email as UserEmail,
        r.Name as RestaurantName,
        r.RestaurantID
      FROM SupportTickets st
      LEFT JOIN Users u ON st.UserID = u.UserID
      LEFT JOIN Restaurants r ON r.OwnerUserID = u.UserID
      ${whereClause}
      ORDER BY st.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));
    const [reports] = await pool.query(dataQuery, queryParams);

    res.json({
      reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("getAllReports error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= GET REPORT STATISTICS ================= */
export const getReportStats = async (req, res) => {
  try {
    // Total ALL reports (not just this month)
    const [totalAll] = await pool.query(`
      SELECT COUNT(*) as total
      FROM SupportTickets
    `);

    // By status (ALL reports)
    const [byStatus] = await pool.query(`
      SELECT 
        Status,
        COUNT(*) as count
      FROM SupportTickets
      GROUP BY Status
    `);

    // Convert to object for easier access
    const statusCounts = {
      Open: 0,
      InProgress: 0,
      Resolved: 0,
      Closed: 0
    };

    byStatus.forEach(item => {
      if (statusCounts.hasOwnProperty(item.Status)) {
        statusCounts[item.Status] = item.count;
      }
    });

    res.json({
      totalThisMonth: totalAll[0].total || 0, // Actually total ALL now
      byStatus: statusCounts
    });
  } catch (error) {
    console.error("getReportStats error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/* ================= GET REPORT BY ID ================= */
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const [reports] = await pool.query(`
      SELECT 
        st.TicketID,
        st.Subject,
        st.Description,
        st.Priority,
        st.Status,
        st.Resolution,
        st.CreatedAt,
        u.UserID,
        u.FullName as UserName,
        u.Email as UserEmail,
        u.Phone as UserPhone,
        r.Name as RestaurantName,
        r.RestaurantID
      FROM SupportTickets st
      LEFT JOIN Users u ON st.UserID = u.UserID
      LEFT JOIN Restaurants r ON r.OwnerUserID = u.UserID
      WHERE st.TicketID = ?
    `, [id]);

    if (reports.length === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json(reports[0]);
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

    // Validate status
    const validStatuses = ['Open', 'InProgress', 'Resolved', 'Closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    // Build update query
    let updates = [];
    let params = [];

    if (status) {
      updates.push('Status = ?');
      params.push(status);
    }

    if (resolution !== undefined) {
      updates.push('Resolution = ?');
      params.push(resolution);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No updates provided" });
    }

    params.push(id);

    await pool.query(`
      UPDATE SupportTickets
      SET ${updates.join(', ')}
      WHERE TicketID = ?
    `, params);

    // Get updated record
    const [updated] = await pool.query(
      'SELECT * FROM SupportTickets WHERE TicketID = ?',
      [id]
    );

    res.json({
      message: "Report updated successfully",
      report: updated[0]
    });
  } catch (error) {
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

    // Get current resolution
    const [current] = await pool.query(
      'SELECT Resolution FROM SupportTickets WHERE TicketID = ?',
      [id]
    );

    if (current.length === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Append new response to existing resolution
    const currentResolution = current[0].Resolution || '';
    const timestamp = new Date().toISOString();
    const newResolution = currentResolution 
      ? `${currentResolution}\n\n[${timestamp}] Admin: ${response}`
      : `[${timestamp}] Admin: ${response}`;

    await pool.query(`
      UPDATE SupportTickets
      SET Resolution = ?, Status = 'InProgress'
      WHERE TicketID = ?
    `, [newResolution, id]);

    res.json({
      message: "Response added successfully",
      resolution: newResolution
    });
  } catch (error) {
    console.error("addReportResponse error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};
