import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function POST(req: Request) {
  try {
    const { name, phone } = await req.json();

    if (!name || !phone) {
      return NextResponse.json({ allowed: false, message: 'Thiếu thông tin!' }, { status: 400 });
    }

    const encryptedPhone = encrypt(phone);
    const encryptedName = encrypt(name);

    // Lấy múi giờ VN (Asia/Ho_Chi_Minh)
    const startOfDay = dayjs().tz('Asia/Ho_Chi_Minh').startOf('day').toDate();
    const endOfDay = dayjs().tz('Asia/Ho_Chi_Minh').endOf('day').toDate();

    // Kiểm tra trong SpinHistory xem đã quay trong ngày chưa
    const spunToday = await prisma.spinHistory.findFirst({
      where: {
        phone: encryptedPhone,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (spunToday) {
      return NextResponse.json({
        allowed: false,
        message: 'Bạn đã hết lượt quay hôm nay!',
      });
    }

    // Nếu user chưa tồn tại thì tạo mới
    let existingUser = await prisma.user.findUnique({
      where: { phone: encryptedPhone },
    });

    if (!existingUser) {
      existingUser = await prisma.user.create({
        data: {
          name: encryptedName,
          phone: encryptedPhone,
          hasSpun: false,
        },
      });
    }

    return NextResponse.json({ allowed: true });
  } catch (error) {
    console.error('Lỗi khi kiểm tra user:', error);
    return NextResponse.json({ allowed: false, message: 'Lỗi server!' }, { status: 500 });
  }
}
