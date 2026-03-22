
import prisma from "../config/prismaClient.js";

async function verifyKDSLogic() {
  console.log("--- KDS Authorization Logic Verification ---");

  try {
    // 1. Find a Branch Manager and their branch
    const manager = await prisma.user.findFirst({
      where: { role: "BranchManager" },
      include: { managedBranches: true }
    });

    if (!manager) {
      console.log("SKIP: No BranchManager found in DB to test.");
    } else {
      const branchID = manager.managedBranches[0]?.branchID;
      console.log(`Testing Manager ID: ${manager.userID} for Branch ID: ${branchID}`);
      
      // Simulation of getKitchenOrders check
      const branch = await prisma.branch.findFirst({
        where: { branchID: branchID, managerUserID: manager.userID },
      });
      
      if (branch) {
        console.log("✅ SUCCESS: Manager correctly authorized for their own branch.");
      } else {
        console.log("❌ FAILURE: Manager NOT authorized for their own branch.");
      }

      // Test unauthorized access
      const otherBranch = await prisma.branch.findFirst({
        where: { managerUserID: { not: manager.userID } },
      });

      if (otherBranch) {
        const unauthorizedCheck = await prisma.branch.findFirst({
          where: { branchID: otherBranch.branchID, managerUserID: manager.userID },
        });
        if (!unauthorizedCheck) {
          console.log(`✅ SUCCESS: Manager ID ${manager.userID} correctly denied for Branch ID ${otherBranch.branchID}`);
        } else {
          console.log(`❌ FAILURE: Manager ID ${manager.userID} incorrectly ALLOWED for Branch ID ${otherBranch.branchID}`);
        }
      }
    }

    // 2. Find a Restaurant Owner
    const owner = await prisma.user.findFirst({
      where: { role: "RestaurantOwner" },
      include: { ownedRestaurants: { include: { branches: true } } }
    });

    if (!owner) {
      console.log("SKIP: No RestaurantOwner found in DB to test.");
    } else {
      const restaurant = owner.ownedRestaurants[0];
      const branchID = restaurant?.branches[0]?.branchID;
      
      if (restaurant && branchID) {
        console.log(`Testing Owner ID: ${owner.userID} for Branch ID: ${branchID}`);
        
        // Simulation of Owner check
        const branchCheck = await prisma.branch.findFirst({
          where: { branchID: branchID, restaurantID: restaurant.restaurantID },
        });
        
        if (branchCheck) {
          console.log("✅ SUCCESS: Owner correctly authorized for their branch.");
        } else {
          console.log("❌ FAILURE: Owner NOT authorized for their branch.");
        }
      }
    }

  } catch (error) {
    console.error("Verification Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyKDSLogic();
