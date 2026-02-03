import { db } from "./config/db.js";

async function testConnection() {
    try {
        console.log("Testing DB Connection...");

        // 1. Test basic query
        const [result] = await db.query("SELECT 1 + 1 as test");
        console.log("Connection successful! Test result:", result[0].test);

        // 2. Count Users
        const [users] = await db.query("SELECT COUNT(*) as count FROM Users");
        console.log("Total Users:", users[0].count);

        // 3. Count Restaurants
        const [restaurants] = await db.query("SELECT COUNT(*) as count FROM Restaurants");
        console.log("Total Restaurants:", restaurants[0].count);

        // 4. Test Query used in Controller (simplified)
        const [joined] = await db.query(`
      SELECT COUNT(*) as total
      FROM Restaurants r
      LEFT JOIN Users u ON r.OwnerUserID = u.UserID
    `);
        console.log("Controller Query Result:", joined[0].total);

        // 5. List all Restaurants
        const [list] = await db.query("SELECT * FROM Restaurants");
        console.log("Restaurant List:", list);

    } catch (error) {
        console.error("DB Error:", error);
    } finally {
        process.exit();
    }
}

testConnection();
