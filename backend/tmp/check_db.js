import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { userID: true, username: true, role: true, branchID: true }
  });
  console.log("USERS:", JSON.stringify(users, null, 2));

  const branches = await prisma.branch.findMany({
    select: { branchID: true, name: true, managerUserID: true }
  });
  console.log("BRANCHES:", JSON.stringify(branches, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
