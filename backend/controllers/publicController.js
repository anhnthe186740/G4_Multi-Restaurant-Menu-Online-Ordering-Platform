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

/* ─────────────────────────────────────────────────────────────
   POST /api/public/service-request
   Body: { tableId, requestType: "GoiMon" | "ThanhToan" }

   Logic UPSERT:
   - Nếu bàn đã có yêu cầu cùng loại CHƯA được xử lý ("Đang xử lý")
     → CHỈ cập nhật createdTime (đẩy lên đầu danh sách manager)
   - Nếu chưa có hoặc cái cũ đã "Đã xử lý"
     → Tạo mới với status = "Đang xử lý"
───────────────────────────────────────────────────────────── */
export const createServiceRequest = async (req, res) => {
    try {
        const { tableId, requestType } = req.body;

        if (!tableId || !requestType) {
            return res.status(400).json({ message: "Thiếu tableId hoặc requestType." });
        }

        const tId = parseInt(tableId);
        const allowedTypes = ["GoiMon", "ThanhToan"];
        if (!allowedTypes.includes(requestType)) {
            return res.status(400).json({ message: "Loại yêu cầu không hợp lệ." });
        }

        // Tìm bàn để lấy branchID
        const table = await prisma.table.findUnique({
            where: { tableID: tId },
            select: { tableID: true, branchID: true },
        });
        if (!table) {
            return res.status(404).json({ message: "Không tìm thấy bàn." });
        }

        // Tìm yêu cầu đang chờ xử lý cùng loại của bàn này
        const existing = await prisma.serviceRequest.findFirst({
            where: {
                tableID:     tId,
                requestType: requestType,
                status:      "Đang xử lý",
            },
        });

        if (existing) {
            // Đã có yêu cầu pending → chỉ cập nhật thời gian (đẩy lên đầu)
            await prisma.serviceRequest.update({
                where: { requestID: existing.requestID },
                data:  { createdTime: new Date() },
            });
            return res.json({
                action:    "updated",
                requestID: existing.requestID,
                message:   "Yêu cầu đã được ghi nhận, nhân viên đang xử lý.",
            });
        }

        // Chưa có → tạo mới
        const created = await prisma.serviceRequest.create({
            data: {
                branchID:    table.branchID,
                tableID:     tId,
                requestType: requestType,
                status:      "Đang xử lý",
                createdTime: new Date(),
            },
        });

        res.status(201).json({
            action:    "created",
            requestID: created.requestID,
            message:   "Yêu cầu đã được gửi đến nhân viên.",
        });
    } catch (error) {
        console.error("createServiceRequest error:", error);
        res.status(500).json({ message: "Lỗi tạo yêu cầu.", error: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/public/table/:tableId/order
   Lấy đơn hàng đang active của bàn (Open/Serving) — public, không cần auth
   Dùng cho trang QR của khách để xem trạng thái món đã gọi
───────────────────────────────────────────────────────────── */
export const getPublicOrderByTable = async (req, res) => {
    try {
        const tableId = parseInt(req.params.tableId);
        if (isNaN(tableId)) return res.status(400).json({ message: "tableId không hợp lệ." });

        // Tìm bàn
        const table = await prisma.table.findUnique({
            where: { tableID: tableId },
            select: { tableID: true, tableName: true, branchID: true },
        });
        if (!table) return res.status(404).json({ message: "Không tìm thấy bàn." });

        // Tìm order đang active
        const orderTable = await prisma.orderTable.findFirst({
            where: {
                tableID: tableId,
                order: { orderStatus: { in: ["Open", "Serving"] } },
            },
            include: {
                order: {
                    include: {
                        orderDetails: {
                            include: {
                                product: { select: { name: true, imageURL: true } },
                            },
                            orderBy: { orderDetailID: "asc" },
                        },
                        orderTables: {
                            include: { table: { select: { tableID: true, tableName: true } } },
                        },
                    },
                },
            },
        });

        if (!orderTable) {
            return res.status(404).json({ message: "Bàn này chưa có đơn hàng nào đang mở." });
        }

        const order = orderTable.order;
        res.json({
            orderID: order.orderID,
            orderStatus: order.orderStatus,
            totalAmount: parseFloat(order.totalAmount),
            orderTime: order.orderTime,
            customerNote: order.customerNote ?? "",
            tables: order.orderTables.map(ot => ({
                id: ot.table.tableID,
                name: ot.table.tableName,
            })),
            items: order.orderDetails.map(d => ({
                orderDetailID: d.orderDetailID,
                productName:   d.product?.name ?? "Món đã xóa",
                imageURL:      d.product?.imageURL ?? null,
                quantity:      d.quantity,
                unitPrice:     parseFloat(d.unitPrice),
                itemStatus:    d.itemStatus,  // Pending | Cooking | Ready | Served | Cancelled
                note:          d.note ?? "",
            })),
        });
    } catch (error) {
        console.error("getPublicOrderByTable error:", error);
        res.status(500).json({ message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────
   PATCH /api/public/cancel-item
   Khách huỷ từng món từ trang QR — ATOMIC, không cần auth
   Body: { tableId, orderDetailID }
   Bảo vệ: verify orderDetailID thuộc đúng đơn của tableId
───────────────────────────────────────────────────────────── */
export const cancelPublicOrderItem = async (req, res) => {
    try {
        const { tableId, orderDetailID } = req.body;
        if (!tableId || !orderDetailID) {
            return res.status(400).json({ message: "Thiếu tableId hoặc orderDetailID." });
        }

        const tId      = parseInt(tableId);
        const detailId = parseInt(orderDetailID);

        // Kiểm tra orderDetail này có thuộc đơn đang active của đúng bàn không
        const link = await prisma.orderTable.findFirst({
            where: {
                tableID: tId,
                order: {
                    orderStatus: { in: ["Open", "Serving"] },
                    orderDetails: { some: { orderDetailID: detailId } },
                },
            },
        });

        if (!link) {
            return res.status(403).json({ message: "Món này không thuộc đơn hàng của bàn bạn." });
        }

        // ATOMIC: chỉ cancel nếu itemStatus vẫn là "Pending"
        const result = await prisma.orderDetail.updateMany({
            where: { orderDetailID: detailId, itemStatus: "Pending" },
            data:  { itemStatus: "Cancelled" },
        });

        if (result.count === 0) {
            return res.status(400).json({
                message: "Không thể huỷ — bếp đã bắt đầu chuẩn bị món này!",
            });
        }

        // Recalculate totalAmount
        const orderDetail = await prisma.orderDetail.findUnique({
            where: { orderDetailID: detailId },
            select: { orderID: true },
        });
        const orderID = orderDetail.orderID;

        const remaining = await prisma.orderDetail.findMany({
            where: { orderID, itemStatus: { not: "Cancelled" } },
            select: { quantity: true, unitPrice: true },
        });
        const newTotal = remaining.reduce((s, d) => s + d.quantity * parseFloat(d.unitPrice), 0);
        await prisma.order.update({ where: { orderID }, data: { totalAmount: newTotal } });

        // Phát realtime
        const io = req.app.get("io");
        io?.emit("orderItemStatusChanged", { orderDetailID: detailId, itemStatus: "Cancelled", tableID: tId });
        io?.emit("tableUpdate", { tableID: tId, timestamp: Date.now() });

        res.json({ message: "Đã huỷ món thành công.", orderDetailID: detailId, itemStatus: "Cancelled" });
    } catch (error) {
        console.error("cancelPublicOrderItem error:", error);
        res.status(500).json({ message: error.message });
    }
};
