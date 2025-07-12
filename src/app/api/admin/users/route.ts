import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

export async function GET() {
  try {
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

    return NextResponse.json(decryptedUsers);
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách user:', error);
    return NextResponse.json(
      { error: 'Server error', details: String(error) },
      { status: 500 }
    );
  }
}
