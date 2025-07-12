import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

export async function GET() {
  try {
    // Lấy toàn bộ user
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const decryptedUsers = users.map((user) => {
      let name = 'Không đọc được';
      let phone = 'Không đọc được';

      try {
        if (user.name) name = decrypt(user.name);
        if (user.phone) phone = decrypt(user.phone);
      } catch (err) {
        console.warn(`❗ Không giải mã được user ID ${user.id}:`, err);
      }

      return {
        id: user.id,
        name,
        phone,
        prize: user.prize,
        hasSpun: user.hasSpun,
        createdAt: user.createdAt,
      };
    });

    const totalUsers = decryptedUsers.length;
    const winners = decryptedUsers.filter((u) => u.prize !== null).length;
    const percent = totalUsers > 0 ? (winners / totalUsers) * 100 : 0;

    const prizeCounts = await prisma.user.groupBy({
      by: ['prize'],
      where: {
        prize: {
          not: null,
        },
      },
      _count: true,
    });

    const prizeConfigs = await prisma.prizeConfig.findMany();

    const detailedPrizes = prizeConfigs.map((config) => {
      const matched = prizeCounts.find((p) => p.prize === config.name);
      const used = matched?._count ?? 0;
      const total = Math.floor(100 / config.ratio); // hoặc config.quantity nếu bạn có cột này
      const remaining = total - used;

      return {
        name: config.name,
        ratio: config.ratio,
        used,
        remaining,
      };
    });

    return NextResponse.json({
      totalUsers,
      winners,
      percent: Math.round(percent * 100) / 100,
      prizeStats: detailedPrizes,
      users: decryptedUsers,
    });
  } catch (error) {
    console.error('❌ Lỗi khi thống kê:', error);
    return NextResponse.json(
      { error: 'Server error', details: String(error) },
      { status: 500 }
    );
  }
}
