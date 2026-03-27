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
        const branchId = table.branch.branchID;

        // ✅ AUTO-ACTIVATION: Nếu bàn đang TRỐNG, chuyển sang ĐANG NGỒI khi khách quét mã
        if (table.status === "Available") {
            await prisma.table.update({
                where: { tableID: tableId },
                data: { status: "Occupied" }
            });

            // Phát tín hiệu realtime cho Manager Dashboard
            const io = req.app.get("io");
            if (io) {
                io.emit("tableUpdate", { branchID: branchId, timestamp: new Date() });
                console.log(`📢 Auto-activated table ${tableId} on QR scan`);
            }
        }

        // 2. Find categories and available products for this branch
        const categoriesRaw = await prisma.category.findMany({
            where: { restaurantID: restaurantId },
            orderBy: { displayOrder: 'asc' }, // Sorting by order if available
            include: {
                products: {
                    where: { 
                        status: 'Available',
                        branchMenuEntries: {
                            some: {
                                branchID: branchId,
                                isAvailable: true
                            }
                        }
                    },
                    include: {
                        branchMenuEntries: {
                            where: { branchID: branchId }
                        }
                    }
                }
            }
        });

        // Filter out categories with 0 products and format product data
        const categories = categoriesRaw
            .filter(category => category.products.length > 0)
            .map(category => ({
                ...category,
                products: category.products.map(product => {
                    const branchEntry = product.branchMenuEntries[0];
                    return {
                        productID: product.productID,
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        imageURL: product.imageURL,
                        status: product.status,
                        branchQuantity: branchEntry?.quantity || 0
                    };
                })
            }));

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
                mergedGroupId: table.mergedGroupId,
                isActive: table.isActive
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
        if (!table.isActive) return res.status(403).json({ message: "Bàn này hiện đang ngừng hoạt động, không thể đặt món." });
        const branchID = table.branchID;

        let totalAddition = 0;
        const mappedItems = items.map(item => {
            const p = parseFloat(item.price);
            const q = parseInt(item.quantity);
            totalAddition += p * q;
            return {
                productID: item.productID,
                tableID: tId, // Mới: Lưu vết bàn nào đặt món này
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
        const { tableId, requestType, note } = req.body;

        if (!tableId || !requestType) {
            return res.status(400).json({ message: "Thiếu tableId hoặc requestType." });
        }

        const tId = parseInt(tableId);
        const allowedTypes = ["GoiMon", "ThanhToan", "GoiNuoc", "Khac"];
        if (!allowedTypes.includes(requestType)) {
            return res.status(400).json({ message: "Loại yêu cầu không hợp lệ." });
        }

        // Tìm bàn để lấy branchID
        const table = await prisma.table.findUnique({
            where: { tableID: tId },
            select: { tableID: true, branchID: true, isActive: true },
        });
        if (!table) {
            return res.status(404).json({ message: "Không tìm thấy bàn." });
        }
        if (!table.isActive) {
            return res.status(403).json({ message: "Bàn này hiện đang ngừng hoạt động, không thể gửi yêu cầu." });
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
            // Đã có yêu cầu pending → cập nhật thời gian và ghi chú mới (nếu có)
            await prisma.serviceRequest.update({
                where: { requestID: existing.requestID },
                data:  { 
                    createdTime: new Date(),
                    note: note || existing.note
                },
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
                note:        note || null,
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
        const { tableId, orderDetailID, cancelQuantity } = req.body;
        if (!tableId || !orderDetailID) {
            return res.status(400).json({ message: "Thiếu tableId hoặc orderDetailID." });
        }

        const tId      = parseInt(tableId);
        const detailId = parseInt(orderDetailID);
        const qtyToCancel = parseInt(cancelQuantity) || 1;

        if (qtyToCancel <= 0) {
            return res.status(400).json({ message: "Số lượng huỷ không hợp lệ." });
        }

        // 1. Kiểm tra orderDetail này có thuộc đơn đang active của đúng bàn không
        const orderDetail = await prisma.orderDetail.findUnique({
            where: { orderDetailID: detailId },
            include: {
                order: {
                    include: {
                        orderTables: true
                    }
                }
            }
        });

        if (!orderDetail || !orderDetail.order) {
            return res.status(404).json({ message: "Không tìm thấy món ăn này trong đơn hàng." });
        }

        // Kiểm tra xem đơn hàng có thuộc bàn này không
        const isCorrectTable = orderDetail.order.orderTables.some(ot => ot.tableID === tId);
        if (!isCorrectTable) {
            return res.status(403).json({ message: "Món này không thuộc đơn hàng của bàn bạn." });
        }

        // Kiểm tra trạng thái đơn hàng
        if (!["Open", "Serving"].includes(orderDetail.order.orderStatus)) {
            return res.status(400).json({ message: "Đơn hàng đã hoàn thành hoặc đã hủy, không thể chỉnh sửa." });
        }

        // 2. ATOMIC: chỉ cancel nếu itemStatus vẫn là "Pending"
        if (orderDetail.itemStatus !== "Pending") {
            return res.status(400).json({
                message: "Không thể huỷ — bếp đã bắt đầu chuẩn bị món này!",
            });
        }

        if (qtyToCancel > orderDetail.quantity) {
            return res.status(400).json({ message: "Số lượng huỷ vượt quá số lượng hiện có." });
        }

        const orderID = orderDetail.orderID;

        // 3. Xử lý chia tách bản ghi nếu quantity > qtyToCancel
        if (orderDetail.quantity > qtyToCancel) {
            // Giảm số lượng của bản ghi hiện tại
            await prisma.orderDetail.update({
                where: { orderDetailID: detailId },
                data: { quantity: orderDetail.quantity - qtyToCancel }
            });

            // Tạo bản ghi mới đã bị huỷ với số lượng là qtyToCancel
            await prisma.orderDetail.create({
                data: {
                    orderID: orderID,
                    productID: orderDetail.productID,
                    quantity: qtyToCancel,
                    unitPrice: orderDetail.unitPrice,
                    note: orderDetail.note,
                    itemStatus: "Cancelled"
                }
            });
        } else {
            // Nếu huỷ toàn bộ số lượng, đổi trạng thái sang Cancelled
            await prisma.orderDetail.update({
                where: { orderDetailID: detailId },
                data: { itemStatus: "Cancelled" }
            });
        }

        // 4. Recalculate totalAmount (Dựa trên tất cả món có status khác Cancelled)
        const remainingItems = await prisma.orderDetail.findMany({
            where: { orderID, itemStatus: { not: "Cancelled" } },
            select: { quantity: true, unitPrice: true },
        });
        const newTotal = remainingItems.reduce((s, d) => s + d.quantity * parseFloat(d.unitPrice), 0);

        const isFullCancelled = remainingItems.length === 0;

        await prisma.order.update({ 
            where: { orderID }, 
            data: { 
                totalAmount: newTotal,
                ...(isFullCancelled ? { orderStatus: "Cancelled" } : {})
            } 
        });

        // Nếu huỷ sạch món, giải phóng bàn luôn
        if (isFullCancelled) {
            await prisma.table.update({
                where: { tableID: tId },
                data: { status: "Available" }
            });
        }

        // 5. Phát tín hiệu realtime
        const io = req.app.get("io");
        // Gửi sự kiện cập nhật để manager và các client khác reload
        io?.emit("tableUpdate", { branchID: orderDetail.order.branchID, tableID: tId, timestamp: Date.now() });
        // Sự kiện cụ thể cho item status
        io?.emit("orderItemStatusChanged", { orderDetailID: detailId, itemStatus: "Cancelled", tableID: tId });

        res.json({ 
            message: `Đã huỷ ${qtyToCancel} món thành công.`, 
            orderDetailID: detailId, 
            cancelledQuantity: qtyToCancel 
        });
    } catch (error) {
        console.error("cancelPublicOrderItem error:", error);
        res.status(500).json({ message: "Lỗi khi huỷ món.", error: error.message });
    }
};
