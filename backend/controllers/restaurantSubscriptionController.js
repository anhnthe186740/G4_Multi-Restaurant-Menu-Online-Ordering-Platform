import prisma from "../config/prismaClient.js";
import { PayOS } from "@payos/node";

let payos = null;

// Initialize PayOS if keys exist
if (
  process.env.PAYOS_CLIENT_ID &&
  process.env.PAYOS_API_KEY &&
  process.env.PAYOS_CHECKSUM_KEY
) {
  payos = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
  );
} else {
  console.warn("⚠️ PayOS keys are missing in .env! PayOS features will fail.");
}

// GET /api/restaurant/subscription/packages
export const getPublicPackages = async (req, res) => {
  try {
    const packages = await prisma.servicePackage.findMany({
      where: { isActive: true },
      orderBy: { duration: "asc" },
    });
    res.json(packages);
  } catch (error) {
    console.error("Error fetching packages:", error);
    res.status(500).json({ message: "Lỗi khi tải danh sách gói dịch vụ" });
  }
};

// GET /api/restaurant/subscription/my-subscription
export const getMySubscription = async (req, res) => {
  const userId = req.user.userId;
  try {
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerUserID: userId },
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Không tìm thấy nhà hàng của bạn" });
    }

    const latestActiveSub = await prisma.subscription.findFirst({
      where: {
        restaurantID: restaurant.restaurantID,
        status: "Active",
      },
      orderBy: { endDate: "desc" },
      include: {
        package: true,
      },
    });

    let status = "None";
    let daysRemaining = 0;
    
    if (latestActiveSub && latestActiveSub.endDate) {
      const now = new Date();
      const endDate = new Date(latestActiveSub.endDate);
      if (endDate > now) {
        status = "Active";
        daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      } else {
        status = "Expired";
      }
    }

    res.json({
      subscription: latestActiveSub || null,
      status, 
      daysRemaining,
    });
  } catch (error) {
    console.error("Error fetching my subscription:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi tải gói của tôi" });
  }
};

// POST /api/restaurant/subscription/create-payment
export const createPaymentLink = async (req, res) => {
  const userId = req.user.userId;
  const { packageId } = req.body;

  if (!payos) {
    return res.status(500).json({ message: "PayOS chưa được cấu hình. Vui lòng liên hệ Admin." });
  }

  if (!packageId) {
    return res.status(400).json({ message: "Thiếu thông tin gói dịch vụ." });
  }

  try {
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerUserID: userId },
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Không tìm thấy nhà hàng của bạn" });
    }

    const pkg = await prisma.servicePackage.findUnique({
      where: { packageID: parseInt(packageId) },
    });

    if (!pkg) {
      return res.status(404).json({ message: "Không tìm thấy gói dịch vụ" });
    }

    const amount = Number(pkg.price) > 0 ? Number(pkg.price) : 2000; // minimal PayOS testing amount can be 2000
    const orderCode = Number(String(Date.now()).slice(-9)); // PayOS orderCode must be <= 9007199254740991 and unique, but using last 9 digits of timestamp is common

    // Create DB Payment Order
    const paymentOrder = await prisma.paymentOrder.create({
      data: {
        orderCode: BigInt(orderCode),
        restaurantID: restaurant.restaurantID,
        packageID: pkg.packageID,
        amount: amount,
        status: "PENDING",
      },
    });

    // We pass a dummy returnUrl and cancelUrl because we handle polling in FE UI
    const expiredAt = Math.floor(Date.now() / 1000) + 5 * 60; // 5 minutes from now

    const payload = {
      orderCode: orderCode,
      amount: amount,
      description: `Thanh toan goi ${pkg.packageName}`.substring(0, 25), // PayOS desc limit 25 chars
      cancelUrl: `http://localhost:5173/owner/service-packages`,
      returnUrl: `http://localhost:5173/owner/service-packages`, 
      expiredAt: expiredAt,
    };

    const paymentLinkRes = await payos.paymentRequests.create(payload);

    // Update DB with checkout link
    await prisma.paymentOrder.update({
      where: { orderID: paymentOrder.orderID },
      data: { payOSPaymentLinkId: paymentLinkRes.paymentLinkId },
    });

    res.json({
      orderCode: orderCode,
      qrCode: paymentLinkRes.qrCode,
      checkoutUrl: paymentLinkRes.checkoutUrl,
      amount: amount,
    });
  } catch (error) {
    console.error("Error creating payment link FULL:", error);
    if (error.response) {
       console.error("PayOS Response Data:", error.response.data);
    }
    if (error.code || error.desc) {
       console.error("PayOS Error Details:", { code: error.code, desc: error.desc });
    }
    res.status(500).json({ message: "Lỗi hệ thống khi tạo QR thanh toán: " + (error.desc || error.message) });
  }
};

// GET /api/restaurant/subscription/check-payment/:orderCode
export const checkPaymentStatus = async (req, res) => {
  const { orderCode } = req.params;

  try {
    const paymentOrder = await prisma.paymentOrder.findUnique({
      where: { orderCode: BigInt(orderCode) },
    });

    if (!paymentOrder) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch" });
    }

    // Nếu DB đã PAID thì trả về luôn không cần hỏi PayOS
    if (paymentOrder.status === "PAID") {
      return res.json({ status: "PAID" });
    }

    // Nếu hỏi PayOS (fallback polling)
    if (payos) {
      try {
         const payosRecord = await payos.paymentRequests.get(orderCode);
         if (payosRecord.status === "PAID") {
             // Cập nhật DB thủ công nếu webhook chưa tới
             await handleSuccessfulPayment(BigInt(orderCode));
             return res.json({ status: "PAID" });
         } else if (payosRecord.status === "CANCELLED" || payosRecord.status === "EXPIRED") {
             await prisma.paymentOrder.update({
                where: { orderCode: BigInt(orderCode) },
                data: { status: payosRecord.status }
             });
             return res.json({ status: payosRecord.status });
         }
      } catch(e) {
         // Lỗi call PayOS có thể do đơn chưa tạo xong hoặc timeout
         console.error("Lỗi khi fetch status từ PayOS:", e.message);
      }
    }

    res.json({ status: paymentOrder.status });
  } catch (error) {
    console.error("Error checking payment:", error);
    res.status(500).json({ message: "Lỗi kiểm tra trạng thái" });
  }
};


// POST /api/restaurant/subscription/webhook
export const payosWebhook = async (req, res) => {
  try {
    if (!payos) {
      return res.status(500).json({ error: "PayOS is not configured" });
    }

    const body = req.body;
    
    // Verify webhook signature using the new v2 API
    try {
       const verifiedData = await payos.webhooks.verify(req.body);
       await handleSuccessfulPayment(BigInt(verifiedData.orderCode));
    } catch (verifyError) {
       console.error("Webhook verification failed:", verifyError.message);
    }
    
    // Always return 200 to acknowledge webhook receipt
    res.json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({ error: "Internal Error processing webhook" });
  }
};

// Helper function to process successful payment
async function handleSuccessfulPayment(orderCode) {
    await prisma.$transaction(async (tx) => {
        const paymentOrder = await tx.paymentOrder.findUnique({
            where: { orderCode: orderCode },
            include: { package: true }
        });

        if (!paymentOrder || paymentOrder.status === "PAID") return;

        // 1. Update Payment Order
        await tx.paymentOrder.update({
            where: { orderID: paymentOrder.orderID },
            data: { 
                status: "PAID",
                paidAt: new Date()
            }
        });

        // 2. Determine Smart Renewal Start Date
        const latestActiveSub = await tx.subscription.findFirst({
            where: {
              restaurantID: paymentOrder.restaurantID,
              status: "Active",
            },
            orderBy: { endDate: "desc" },
        });
    
        let newStartDate = new Date();
        if (latestActiveSub?.endDate && new Date(latestActiveSub.endDate) > newStartDate) {
            newStartDate = new Date(latestActiveSub.endDate); // Cộng dồn nếu gói hiện hành còn hạn
        }
    
        // 3. Tính EndDate
        const newEndDate = new Date(newStartDate);
        newEndDate.setMonth(newEndDate.getMonth() + paymentOrder.package.duration);
    
        // 4. Record new Subscription
        await tx.subscription.create({
            data: {
              restaurantID: paymentOrder.restaurantID,
              packageID: paymentOrder.package.packageID,
              startDate: newStartDate,
              endDate: newEndDate,
              status: "Active",
              autoRenew: false,
            },
        });
    });
}
