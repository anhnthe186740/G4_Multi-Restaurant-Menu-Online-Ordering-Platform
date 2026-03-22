import prisma from "./config/prismaClient.js";

async function run() {
  try {
    const branchID = 157; // Just testing with any branch ID or we'll fetch one first
    
    // Get the first branch
    const branch1 = await prisma.branch.findFirst({});
    console.log("Found branch:", branch1.branchID);

    const branch = await prisma.branch.findUnique({
      where: { branchID: branch1.branchID },
      include: {
        restaurant: {
          select: {
            name: true,
            description: true,
            logo: true,
            coverImage: true,
            taxCode: true,
            // What if taxName address doesn't exist on Restaurant?
            taxName: true,
            address: true,
          }
        }
      }
    });
    console.log("Success");
  } catch (err) {
    console.error("Prisma error:", err);
  } finally {
    prisma.$disconnect();
  }
}
run();
