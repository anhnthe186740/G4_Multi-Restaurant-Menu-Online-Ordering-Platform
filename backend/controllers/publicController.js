import { PrismaClient } from '@prisma/client';
import os from "os";

const prisma = new PrismaClient();

// Get menu and restaurant info by tableId
export const getMenuByTable = async (req, res) => {
    try {
        const tableId = parseInt(req.params.tableId);
        
        if (isNaN(tableId)) {
            return res.status(400).json({ message: "Invalid Table ID" });
        }

        // 1. Find the table and include its branch and restaurant
        const table = await prisma.table.findUnique({
            where: { tableID: tableId },
            include: {
                branch: {
                    include: {
                        restaurant: true
                    }
                }
            }
        });

        if (!table) {
            return res.status(404).json({ message: "Table not found." });
        }

        const restaurantId = table.branch.restaurant.restaurantID;

        // 2. Find categories and available products for this restaurant
        const categories = await prisma.category.findMany({
            where: { restaurantID: restaurantId },
            orderBy: { displayOrder: 'asc' }, // Sorting by order if available
            include: {
                products: {
                    where: { status: 'Available' }
                }
            }
        });

        res.json({
            restaurant: {
                id: table.branch.restaurant.restaurantID,
                name: table.branch.restaurant.name,
                logo: table.branch.restaurant.logo,
                coverImage: table.branch.restaurant.coverImage,
                description: table.branch.restaurant.description
            },
            branch: {
                id: table.branch.branchID,
                name: table.branch.name,
                address: table.branch.address,
                phone: table.branch.phone
            },
            table: {
                id: table.tableID,
                name: table.tableName || `Bàn ${table.tableID}`,
                capacity: table.capacity,
                mergedGroupId: table.mergedGroupId
            },
            categories: categories
        });
    } catch (error) {
        console.error("Error fetching menu by table:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getServerIP = (req, res) => {
  const interfaces = os.networkInterfaces();
  let bestIp = "localhost";
  
  for (const name of Object.keys(interfaces)) {
    // Bỏ qua các mạng ảo phổ biến như Radmin, Hamachi, VMware, VirtualBox, v.v.
    const isVirtual = name.toLowerCase().match(/(virtual|vmware|vbox|radmin|hamachi|tailscale|zerotier|wsl)/);
    
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        if (!isVirtual) {
            return res.json({ ip: iface.address });
        }
        bestIp = iface.address;
      }
    }
  }
  
  res.json({ ip: bestIp });
};

export const createPublicOrder = async (req, res) => {
    try {
        const { tableId, items } = req.body;
        if (!tableId || !items || items.length === 0) {
            return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
        }

        const tId = parseInt(tableId);
        const table = await prisma.table.findUnique({
            where: { tableID: tId }
        });

        if (!table) return res.status(404).json({ message: "Không tìm thấy bàn" });
        const branchID = table.branchID;

        let totalAddition = 0;
        const mappedItems = items.map(item => {
            const p = parseFloat(item.price);
            const q = parseInt(item.quantity);
            totalAddition += p * q;
            return {
                productID: item.productID,
                quantity: q,
                unitPrice: p
            };
        });

        const activeOrderTable = await prisma.orderTable.findFirst({
            where: {
                tableID: tId,
                order: { orderStatus: { in: ["Open", "Serving"] }, branchID }
            },
            include: { order: true }
        });

        if (activeOrderTable) {
            // Append
            const orderID = activeOrderTable.orderID;
            await prisma.orderDetail.createMany({
                data: mappedItems.map(item => ({ ...item, orderID }))
            });
            await prisma.order.update({
                where: { orderID },
                data: { totalAmount: { increment: totalAddition } }
            });
        } else {
            // Create new
            await prisma.order.create({
                data: {
                    branchID,
                    orderTime: new Date(),
                    orderStatus: "Open",
                    totalAmount: totalAddition,
                    paymentStatus: "Unpaid",
                    orderDetails: { create: mappedItems },
                    orderTables: { create: [{ tableID: tId }] }
                }
            });
            await prisma.table.update({
                where: { tableID: tId },
                data: { status: "Occupied" }
            });
        }

        const io = req.app.get("io");
        if (io) io.emit("tableUpdate", { branchID, timestamp: new Date() });

        res.json({ message: "Đặt món thành công!" });
    } catch (error) {
        console.error("Public order error:", error);
        res.status(500).json({ message: error.message });
    }
};
