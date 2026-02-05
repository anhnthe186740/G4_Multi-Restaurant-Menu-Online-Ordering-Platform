import { db } from "../config/db.js";

// GET /api/admin/service-packages
export const getAllPackages = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM ServicePackages WHERE IsActive = TRUE ORDER BY Price ASC"
        );
        res.json(rows);
    } catch (error) {
        console.error("Error fetching packages:", error);
        res.status(500).json({ message: "Lỗi khi tải danh sách gói dịch vụ" });
    }
};

// POST /api/admin/service-packages
export const createPackage = async (req, res) => {
    const { PackageName, Duration, Price, Description } = req.body;

    if (!PackageName || !Duration || !Price) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO ServicePackages (PackageName, Duration, Price, Description, IsActive) VALUES (?, ?, ?, ?, TRUE)",
            [PackageName, Duration, Price, Description]
        );

        const newPackage = {
            PackageID: result.insertId,
            PackageName,
            Duration,
            Price,
            Description,
            IsActive: true,
        };

        res.status(201).json(newPackage);
    } catch (error) {
        console.error("Error creating package:", error);
        res.status(500).json({ message: "Lỗi khi tạo gói dịch vụ" });
    }
};

// PUT /api/admin/service-packages/:id
export const updatePackage = async (req, res) => {
    const { id } = req.params;
    const { PackageName, Duration, Price, Description } = req.body;

    try {
        const [result] = await db.query(
            "UPDATE ServicePackages SET PackageName = ?, Duration = ?, Price = ?, Description = ? WHERE PackageID = ?",
            [PackageName, Duration, Price, Description, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy gói dịch vụ" });
        }

        res.json({
            PackageID: id,
            PackageName,
            Duration,
            Price,
            Description,
        });
    } catch (error) {
        console.error("Error updating package:", error);
        res.status(500).json({ message: "Lỗi khi cập nhật gói dịch vụ" });
    }
};

// DELETE /api/admin/service-packages/:id
export const deletePackage = async (req, res) => {
    const { id } = req.params;

    try {
        // Soft delete
        const [result] = await db.query(
            "UPDATE ServicePackages SET IsActive = FALSE WHERE PackageID = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy gói dịch vụ" });
        }

        res.json({ message: "Đã xóa gói dịch vụ thành công" });
    } catch (error) {
        console.error("Error deleting package:", error);
        res.status(500).json({ message: "Lỗi khi xóa gói dịch vụ" });
    }
};

// POST /api/admin/service-packages/renew
export const renewSubscription = async (req, res) => {
    const { restaurantId, packageId } = req.body;

    if (!restaurantId || !packageId) {
        return res.status(400).json({ message: "Thieu thong tin gia han" });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get Package Info to know Duration
        const [pkgRows] = await connection.query("SELECT * FROM ServicePackages WHERE PackageID = ?", [packageId]);
        if (pkgRows.length === 0) {
            throw new Error("Gói dịch vụ không tồn tại");
        }
        const selectedPackage = pkgRows[0];

        // 2. SMART RENEWAL LOGIC:
        // Find the LATEST EndDate of any "Active" subscription for this restaurant.
        // If the latest EndDate is in the future, we extend from THAT date.
        // If it's in the past (expired) or doesn't exist, we start from NOW.
        const [subRows] = await connection.query(
            "SELECT MAX(EndDate) as MaxEndDate FROM Subscriptions WHERE RestaurantID = ? AND Status = 'Active'",
            [restaurantId]
        );

        let newStartDate = new Date();
        if (subRows.length > 0 && subRows[0].MaxEndDate) {
            const maxEndDate = new Date(subRows[0].MaxEndDate);
            if (maxEndDate > newStartDate) {
                newStartDate = maxEndDate; // Cumulative extension
            }
        }

        // 3. Calculate EndDate
        const newEndDate = new Date(newStartDate);
        newEndDate.setMonth(newEndDate.getMonth() + selectedPackage.Duration);

        // 4. Create new Subscription record
        await connection.query(
            "INSERT INTO Subscriptions (RestaurantID, PackageID, StartDate, EndDate, Status, AutoRenew) VALUES (?, ?, ?, ?, 'Active', FALSE)",
            [restaurantId, packageId, newStartDate, newEndDate]
        );

        await connection.commit();
        res.json({
            message: "Gia hạn thành công",
            startDate: newStartDate,
            newEndDate: newEndDate
        });

    } catch (error) {
        await connection.rollback();
        console.error("Error renewing subscription:", error);
        res.status(500).json({ message: error.message || "Lỗi khi gia hạn" });
    } finally {
        connection.release();
    }
};

// GET /api/admin/service-packages/history
export const getSubscriptionHistory = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                s.SubscriptionID,
                r.Name as RestaurantName,
                p.PackageName,
                p.Price,
                s.StartDate,
                s.EndDate,
                s.Status
            FROM Subscriptions s
            JOIN Restaurants r ON s.RestaurantID = r.RestaurantID
            JOIN ServicePackages p ON s.PackageID = p.PackageID
            ORDER BY s.StartDate DESC
            LIMIT 50
        `);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ message: "Lỗi tải lịch sử giao dịch" });
    }
}

// Get list of restaurants for renewal (Lite version)
export const getRestaurantsForRenewal = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                r.RestaurantID, 
                r.Name AS RestaurantName, 
                u.FullName AS OwnerName,
                u.Phone AS OwnerPhone
            FROM Restaurants r
            JOIN Users u ON r.OwnerUserID = u.UserID
            ORDER BY r.Name ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching restaurants for renewal:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// GET /api/admin/service-packages/active-subscriptions
// Get all restaurants with their CURRENT active package status
export const getRestaurantStatuses = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                r.RestaurantID,
                r.Name AS RestaurantName,
                u.FullName AS OwnerName,
                u.Phone,
                COALESCE(sub.PackageName, 'Chưa đăng ký') AS CurrentPackage,
                sub.EndDate AS ExpiryDate,
                CASE 
                    WHEN sub.EndDate IS NULL THEN 'None'
                    WHEN sub.EndDate > NOW() THEN 'Active'
                    ELSE 'Expired'
                END AS Status,
                DATEDIFF(sub.EndDate, NOW()) as DaysRemaining
            FROM Restaurants r
            JOIN Users u ON r.OwnerUserID = u.UserID
            LEFT JOIN (
                SELECT s.RestaurantID, s.EndDate, p.PackageName
                FROM Subscriptions s
                JOIN ServicePackages p ON s.PackageID = p.PackageID
                WHERE s.Status = 'Active'
                AND s.EndDate = (
                    SELECT MAX(s2.EndDate) 
                    FROM Subscriptions s2 
                    WHERE s2.RestaurantID = s.RestaurantID AND s2.Status = 'Active'
                )
            ) sub ON r.RestaurantID = sub.RestaurantID
            ORDER BY 
                CASE WHEN sub.EndDate > NOW() THEN 0 ELSE 1 END, -- Active first
                sub.EndDate ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching restaurant statuses:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
