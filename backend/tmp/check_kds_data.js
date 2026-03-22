import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'manager1@rms.vn' },
    select: { userID: true, username: true, role: true, branchID: true }
  });
  console.log("MANAGER SEARCH BY EMAIL:", JSON.stringify(user, null, 2));

  const totalOrders = await prisma.order.count();
  console.log("TOTAL ORDERS IN DB:", totalOrders);

  const latestOrder = await prisma.order.findFirst({
    orderBy: { orderTime: 'desc' },
    select: { orderTime: true, branchID: true }
  });
  console.log("LATEST ORDER TIME:", latestOrder?.orderTime);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  console.log("SERVER CURRENT TIME:", now.toISOString());
  console.log("FILTER RANGE:", startOfDay.toISOString(), "TO", endOfDay.toISOString());

  const ordersToday = await prisma.order.findMany({
    where: {
      orderTime: { gte: startOfDay, lte: endOfDay }
    },
    select: { orderID: true, branchID: true, orderTime: true }
  });
  console.log("ORDERS TODAY:", JSON.stringify(ordersToday, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
