import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Load .env from backend root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'restaurant_db'
};

async function migrate() {
    console.log("Connecting to database...", dbConfig.database);
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected.");

        // 1. Alter Table ServicePackages
        try {
            await connection.query("SELECT Description FROM ServicePackages LIMIT 1");
            console.log("Column 'Description' already exists.");
        } catch (err) {
            console.log("Column 'Description' missing. Creating...");
            await connection.query("ALTER TABLE ServicePackages ADD COLUMN Description TEXT");
        }

        // 2. Clear old data using DELETE (safer with constraints)
        console.log("Clearing old data...");
        await connection.query("SET FOREIGN_KEY_CHECKS = 0");
        await connection.query("DELETE FROM Subscriptions");
        await connection.query("DELETE FROM ServicePackages");

        // Reset Auto Increment if possible, or just insert with specific IDs.
        // We are inserting with specific IDs (1,2,3,4) so auto increment doesn't matter much for collisions if table is empty.

        // 3. Insert New Packages
        console.log("Seeding ServicePackages...");
        const packagesSql = `
            INSERT INTO ServicePackages (PackageID, PackageName, Price, Duration, Description, IsActive) VALUES
            (1, 'Gói 1 Tháng', 199000, 1, 'Gói trải nghiệm ngắn hạn', TRUE),
            (2, 'Gói 3 Tháng', 499000, 3, 'Tiết kiệm 15%', TRUE),
            (3, 'Gói 6 Tháng', 899000, 6, 'Tiết kiệm 25%', TRUE),
            (4, 'Gói 1 Năm', 1599000, 12, 'Gói phổ biến nhất - Tiết kiệm 33%', TRUE);
        `;
        await connection.query(packagesSql);

        // 4. Insert Sample Subscriptions using VALID Restaurant IDs
        console.log("Fetching existing restaurants...");
        const [restaurants] = await connection.query("SELECT RestaurantID FROM Restaurants LIMIT 5");

        if (restaurants.length === 0) {
            console.log("WARNING: No restaurants found. Skipping Subscription seeding.");
        } else {
            console.log(`Found ${restaurants.length} restaurants. Seeding Subscriptions...`);
            // Map valid IDs to our sample data logic
            // We need at least 1 restaurant to make sense, we'll round robin them.
            const getRId = (index) => restaurants[index % restaurants.length].RestaurantID;

            const subsSql = `
                INSERT INTO Subscriptions (RestaurantID, PackageID, StartDate, EndDate, Status, AutoRenew) VALUES
                (${getRId(0)}, 2, '2026-01-01', '2026-03-31', 'Active', TRUE),
                (${getRId(1)}, 4, '2025-02-15', '2026-02-15', 'Active', FALSE),
                (${getRId(2 || 0)}, 1, '2026-01-20', '2026-02-20', 'Active', TRUE),
                (${getRId(0)}, 1, '2025-09-01', '2025-10-01', 'Expired', FALSE),
                (${getRId(1)}, 1, '2025-10-01', '2025-11-01', 'Expired', FALSE),
                (${getRId(0)}, 1, '2025-11-01', '2025-12-01', 'Expired', FALSE),
                (${getRId(2 || 1)}, 1, '2025-12-01', '2026-01-01', 'Expired', FALSE);
            `;
            await connection.query(subsSql);
        }

        await connection.query("SET FOREIGN_KEY_CHECKS = 1");

        console.log("Migration & Seeding Completed Successfully!");
        process.exit(0);

    } catch (error) {
        console.error("Migration Failed:", error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
