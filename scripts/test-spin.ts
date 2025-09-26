import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const prizes = await prisma.prizeConfig.findMany();

  if (prizes.length === 0) {
    console.log('⚠️ Chưa có phần thưởng trong DB');
    return;
  }

  // Tạo mảng trọng số
  const weighted: string[] = [];
  prizes.forEach((p: { ratio: number; name: string; }) => {
    for (let i = 0; i < p.ratio; i++) {
      weighted.push(p.name);
    }
  });

  const resultCount: Record<string, number> = {};
  prizes.forEach((p: { name: string | number; }) => resultCount[p.name] = 0);

  const totalSpins = 1000;
  for (let i = 0; i < totalSpins; i++) {
    const prize = weighted[Math.floor(Math.random() * weighted.length)];
    resultCount[prize]++;
  }

  console.log(`🎯 Kết quả sau ${totalSpins} lần quay:`);
  Object.entries(resultCount).forEach(([name, count]) => {
    const percent = ((count / totalSpins) * 100).toFixed(2);
    console.log(`- ${name}: ${count} lượt (${percent}%)`);
  });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
});
