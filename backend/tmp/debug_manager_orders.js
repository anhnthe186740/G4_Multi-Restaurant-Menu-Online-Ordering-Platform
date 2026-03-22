import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'manager1@rms.vn' },
    include: { managedBranches: true }
  });
  console.log("MANAGER:", JSON.stringify(user, null, 2));

  const branchIDFromUser = user?.managedBranches[0]?.branchID;
  console.log("BRANCH ID FROM RELATION:", branchIDFromUser);

  if (branchIDFromUser) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const orders = await prisma.order.findMany({
      where: {
        branchID: branchIDFromUser,
        orderTime: { gte: startOfDay, lte: endOfDay },
        orderStatus: { not: "Cancelled" },
      },
      include: {
        orderDetails: {
          include: { product: true }
        }
      }
    });
    console.log(`FOUND ${orders.length} ORDERS FOR BRANCH ${branchIDFromUser} TODAY`);
    if (orders.length > 0) {
        console.log("FIRST ORDER DETAILS:", JSON.stringify(orders[0].orderDetails, null, 2));
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
