
import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const requests = await prisma.registrationRequest.findMany({
    orderBy: { submissionDate: 'desc' },
    take: 5,
    include: {
        owner: true
    }
  });

  console.log('Recent Registration Requests:');
  requests.forEach(r => {
    console.log(`ID: ${r.requestID}, Status: ${r.approvalStatus}, Restaurant: ${r.restaurantName}, Email: ${r.owner?.email || r.contactInfo}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
