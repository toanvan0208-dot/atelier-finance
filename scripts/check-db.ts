import { prisma } from '../src/lib/database/client';
async function run() {
  const r = await prisma.financialStatement.findMany({ select: { ticker: true, sourceLabel: true }});
  console.log(r);
}
run().catch(console.error).finally(()=>prisma.$disconnect());
