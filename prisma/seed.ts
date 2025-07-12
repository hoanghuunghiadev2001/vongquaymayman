// prisma/seed.ts
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const passwordHash = await bcrypt.hash('Adm!n@8686$$', 10);

  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'it@toyota.binhduong.vn',
      passwordHash,
    },
  });

  console.log('✅ Tài khoản admin đã được tạo: admin / admin123');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
