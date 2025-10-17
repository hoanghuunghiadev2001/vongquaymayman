import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🎯 Hàm chọn phần thưởng theo trọng số (giống trong API thật)
function pickPrizeByRatio(prizes: { name: string; ratio: number }[]) {
  const total = prizes.reduce((sum, p) => sum + p.ratio, 0);
  const random = Math.random() * total;
  let cumulative = 0;

  for (const p of prizes) {
    cumulative += p.ratio;
    if (random <= cumulative) return p.name;
  }

  // fallback (hiếm khi xảy ra)
  return prizes[prizes.length - 1].name;
}

async function main() {
  const prizes = await prisma.prizeConfig.findMany({
    select: { name: true, ratio: true },
  });

  if (prizes.length === 0) {
    console.log('⚠️ Chưa có phần thưởng trong DB');
    return;
  }

  const resultCount: Record<string, number> = {};
  prizes.forEach((p) => (resultCount[p.name] = 0));

  const totalSpins = 10000; // tăng lên để kết quả chính xác hơn
  for (let i = 0; i < totalSpins; i++) {
    const prizeName = pickPrizeByRatio(prizes);
    resultCount[prizeName]++;
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
