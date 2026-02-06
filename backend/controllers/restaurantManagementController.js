import { db } from "../config/db.js";

/* ================= GET ALL RESTAURANTS ================= */
export const getAllRestaurants = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        // Build WHERE clause
        let whereConditions = [];
        let queryParams = [];

        if (status) {
            whereConditions.push("u.Status = ?");
            queryParams.push(status);
        }

        if (search) {
            whereConditions.push("(r.Name LIKE ? OR u.FullName LIKE ? OR u.Email LIKE ?)");
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern);
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        // Get total count
        const countQuery = `
      SELECT COUNT(*) as total
      FROM Restaurants r
      LEFT JOIN Users u ON r.OwnerUserID = u.UserID
      ${whereClause}
    `;
        console.log("Count Query:", countQuery);
        console.log("Query Params:", queryParams);

        const [countResult] = await db.query(countQuery, queryParams);
        const totalRestaurants = countResult[0].total;
        console.log("Total Restaurants Found:", totalRestaurants);

        // Get paginated data
        const dataQuery = `
      SELECT 
        r.RestaurantID,
        r.Name as restaurantName,
        r.Logo,
        r.Description,
        r.TaxCode,
        r.Website,
        u.UserID as ownerID,
        u.FullName as ownerName,
        u.Email as ownerEmail,
        u.Phone as ownerPhone,
        u.Status as ownerStatus,
        u.CreatedAt as registeredDate,
        (SELECT COUNT(*) FROM Branches WHERE RestaurantID = r.RestaurantID) as branchCount,
        (SELECT PackageName FROM ServicePackages sp 
         INNER JOIN Subscriptions s ON sp.PackageID = s.PackageID 
         WHERE s.RestaurantID = r.RestaurantID AND s.Status = 'Active' 
         LIMIT 1) as currentPackage,
        (SELECT EndDate FROM Subscriptions 
         WHERE RestaurantID = r.RestaurantID AND Status = 'Active' 
         ORDER BY EndDate DESC LIMIT 1) as packageExpiryDate
      FROM Restaurants r
      LEFT JOIN Users u ON r.OwnerUserID = u.UserID
      ${whereClause}
      ORDER BY r.RestaurantID DESC
      LIMIT ? OFFSET ?
    `;

        console.log("Data Query:", dataQuery);
        console.log("Data Params:", [...queryParams, parseInt(limit), parseInt(offset)]);

        queryParams.push(parseInt(limit), parseInt(offset));
        const [restaurants] = await db.query(dataQuery, queryParams);

        res.json({
            restaurants,
            pagination: {
                total: totalRestaurants,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalRestaurants / limit)
            }
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

        // Get restaurant basic info
        const [restaurants] = await db.query(`
      SELECT 
        r.RestaurantID,
        r.Name,
        r.Logo,
        r.Description,
        r.TaxCode,
        r.Website,
        u.UserID as ownerID,
        u.Username as ownerUsername,
        u.FullName as ownerName,
        u.Email as ownerEmail,
        u.Phone as ownerPhone,
        u.Status as ownerStatus,
        u.CreatedAt as registeredDate
      FROM Restaurants r
      LEFT JOIN Users u ON r.OwnerUserID = u.UserID
      WHERE r.RestaurantID = ?
    `, [id]);

        if (restaurants.length === 0) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        const restaurant = restaurants[0];

        // Get branches
        const [branches] = await db.query(`
      SELECT 
        b.BranchID,
        b.Name,
        b.Address,
        b.Phone,
        b.OpeningHours,
        b.IsActive,
        m.FullName as managerName,
        (SELECT COUNT(*) FROM Tables WHERE BranchID = b.BranchID) as tableCount
      FROM Branches b
      LEFT JOIN Users m ON b.ManagerUserID = m.UserID
      WHERE b.RestaurantID = ?
    `, [id]);

        // Get subscription history
        const [subscriptions] = await db.query(`
      SELECT 
        s.SubscriptionID,
        s.StartDate,
        s.EndDate,
        s.Status,
        s.AutoRenew,
        sp.PackageName,
        sp.Price
      FROM Subscriptions s
      INNER JOIN ServicePackages sp ON s.PackageID = sp.PackageID
      WHERE s.RestaurantID = ?
      ORDER BY s.StartDate DESC
    `, [id]);

        // Get support tickets
        const [tickets] = await db.query(`
      SELECT 
        st.TicketID,
        st.Subject,
        st.Description,
        st.Priority,
        st.Status,
        st.CreatedAt
      FROM SupportTickets st
      WHERE st.UserID = ?
      ORDER BY st.CreatedAt DESC
      LIMIT 10
    `, [restaurant.ownerID]);

        res.json({
            restaurant,
            branches,
            subscriptions,
            tickets
        });
    } catch (error) {
        console.error("getRestaurantDetails error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

/* ================= SOFT DELETE RESTAURANT ================= */
export const deactivateRestaurant = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Get restaurant owner
        const [restaurants] = await db.query(
            "SELECT OwnerUserID FROM Restaurants WHERE RestaurantID = ?",
            [id]
        );

        if (restaurants.length === 0) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        const ownerID = restaurants[0].OwnerUserID;

        if (!ownerID) {
            return res.status(400).json({ message: "Cannot deactivate: This restaurant has no associated owner account." });
        }

        // Soft delete: Set owner status to Inactive
        const [result] = await db.query(
            "UPDATE Users SET Status = 'Inactive' WHERE UserID = ?",
            [ownerID]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Owner user not found" });
        }

        // Optional: Log the reason in SupportTickets
        if (reason) {
            await db.query(`
        INSERT INTO SupportTickets (UserID, Subject, Description, Priority, Status)
        VALUES (?, 'Account Deactivated', ?, 'High', 'Closed')
      `, [ownerID, `Deactivation reason: ${reason}`]);
        }

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

        // Get restaurant owner
        const [restaurants] = await db.query(
            "SELECT OwnerUserID FROM Restaurants WHERE RestaurantID = ?",
            [id]
        );

        if (restaurants.length === 0) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        const ownerID = restaurants[0].OwnerUserID;

        if (!ownerID) {
            return res.status(400).json({ message: "Cannot reactivate: This restaurant has no associated owner account." });
        }

        // Reactivate: Set owner status to Active
        const [result] = await db.query(
            "UPDATE Users SET Status = 'Active' WHERE UserID = ?",
            [ownerID]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Owner user not found" });
        }

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

        // Get owner ID first
        const [restaurants] = await db.query(
            "SELECT OwnerUserID FROM Restaurants WHERE RestaurantID = ?",
            [id]
        );

        if (restaurants.length === 0) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        const ownerID = restaurants[0].OwnerUserID;

        // --- STEP 1: Deep Clean Dependencies (due to missing CASCADE in schema) ---

        // 1.1 Delete Subscriptions
        await db.query("DELETE FROM Subscriptions WHERE RestaurantID = ?", [id]);

        // 1.2 Handle Orders & Invoices chain
        const [branches] = await db.query("SELECT BranchID FROM Branches WHERE RestaurantID = ?", [id]);
        const branchIDs = branches.map(b => b.BranchID);

        if (branchIDs.length > 0) {
            const [orders] = await db.query("SELECT OrderID FROM Orders WHERE BranchID IN (?)", [branchIDs]);
            const orderIDs = orders.map(o => o.OrderID);

            if (orderIDs.length > 0) {
                const [invoices] = await db.query("SELECT InvoiceID FROM Invoices WHERE OrderID IN (?)", [orderIDs]);
                const invoiceIDs = invoices.map(i => i.InvoiceID);

                if (invoiceIDs.length > 0) {
                    // Delete Transactions
                    await db.query("DELETE FROM Transactions WHERE InvoiceID IN (?)", [invoiceIDs]);
                    // Delete Invoices
                    await db.query("DELETE FROM Invoices WHERE InvoiceID IN (?)", [invoiceIDs]);
                }

                // Delete Orders (OrderDetails should Cascade)
                await db.query("DELETE FROM Orders WHERE OrderID IN (?)", [orderIDs]);
            }
        }

        // --- STEP 2: Delete Restaurant ---
        // This should cascade Branches, Tables, Categories, Products, Discounts
        await db.query("DELETE FROM Restaurants WHERE RestaurantID = ?", [id]);

        // --- STEP 3: Delete Owner User ---
        if (ownerID) {
            // Delete related SupportTickets
            await db.query("DELETE FROM SupportTickets WHERE UserID = ?", [ownerID]);

            // Delete User
            await db.query("DELETE FROM Users WHERE UserID = ?", [ownerID]);
        }

        res.json({ message: "Restaurant permanently deleted" });
    } catch (error) {
        console.error("forceDeleteRestaurant error:", error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                message: "Cannot delete: Data integrity constraint. Related data exists in other tables (e.g., Orders, Reports).",
                detail: error.message
            });
        }
        res.status(500).json({ message: error.message || "Server error" });
    }
};

/* ================= UPDATE RESTAURANT INFO ================= */
export const updateRestaurantInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, website, logo } = req.body;

        const updates = [];
        const params = [];

        if (name) {
            updates.push("Name = ?");
            params.push(name);
        }
        if (description !== undefined) {
            updates.push("Description = ?");
            params.push(description);
        }
        if (website !== undefined) {
            updates.push("Website = ?");
            params.push(website);
        }
        if (logo !== undefined) {
            updates.push("Logo = ?");
            params.push(logo);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: "No fields to update" });
        }

        params.push(id);
        const query = `UPDATE Restaurants SET ${updates.join(', ')} WHERE RestaurantID = ?`;

        await db.query(query, params);

        res.json({ message: "Restaurant updated successfully" });
    } catch (error) {
        console.error("updateRestaurantInfo error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

/* ================= GET RESTAURANT STATISTICS ================= */
export const getRestaurantStats = async (req, res) => {
    try {
        const { id } = req.params;

        // Get revenue from subscriptions
        const [revenue] = await db.query(`
      SELECT 
        COALESCE(SUM(sp.Price), 0) as totalRevenue,
        COUNT(s.SubscriptionID) as subscriptionCount
      FROM Subscriptions s
      INNER JOIN ServicePackages sp ON s.PackageID = sp.PackageID
      WHERE s.RestaurantID = ?
    `, [id]);

        // Get branch and table counts
        const [counts] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM Branches WHERE RestaurantID = ?) as branchCount,
        (SELECT COUNT(*) FROM Tables t 
         INNER JOIN Branches b ON t.BranchID = b.BranchID 
         WHERE b.RestaurantID = ?) as totalTables
    `, [id, id]);

        // Get active subscription
        const [activeSubscription] = await db.query(`
      SELECT sp.PackageName, s.EndDate, s.AutoRenew
      FROM Subscriptions s
      INNER JOIN ServicePackages sp ON s.PackageID = sp.PackageID
      WHERE s.RestaurantID = ? AND s.Status = 'Active'
      ORDER BY s.EndDate DESC
      LIMIT 1
    `, [id]);

        res.json({
            totalRevenue: parseFloat(revenue[0].totalRevenue),
            subscriptionCount: revenue[0].subscriptionCount,
            branchCount: counts[0].branchCount,
            totalTables: counts[0].totalTables,
            activeSubscription: activeSubscription[0] || null
        });
    } catch (error) {
        console.error("getRestaurantStats error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};
