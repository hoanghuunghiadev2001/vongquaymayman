import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto'; // nếu bạn dùng AES

export async function POST(req: Request) {
  try {
    const { name, phone } = await req.json();

    if (!name || !phone) {
      return NextResponse.json({ allowed: false, message: 'Thiếu thông tin!' }, { status: 400 });
    }

    const encryptedPhone = encrypt(phone); // nếu dùng mã hóa
    const encryptedName = encrypt(name);

    let existingUser = await prisma.user.findUnique({
      where: { phone: encryptedPhone },
    });

    // Nếu chưa tồn tại thì thêm mới
    if (!existingUser) {
      existingUser = await prisma.user.create({
        data: {
          name: encryptedName,
          phone: encryptedPhone,
          hasSpun: false,
        },
      });
    }

    // Nếu đã quay rồi thì chặn
    if (existingUser.hasSpun) {
      return NextResponse.json({
        allowed: false,
        message: 'Bạn đã tham gia quay thưởng rồi!',
      });
    }

    return NextResponse.json({ allowed: true });
  } catch (error) {
    console.error('Lỗi khi kiểm tra user:', error);
    return NextResponse.json({ allowed: false, message: 'Lỗi server!' }, { status: 500 });
  }
}
  