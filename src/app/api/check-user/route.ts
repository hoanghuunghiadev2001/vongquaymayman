
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
    const { name, phone, licensePlate } = await req.json();

    // Bắt buộc phải có ít nhất phone hoặc biển số xe
    if (!phone && !licensePlate) {
      return NextResponse.json(
        { allowed: false, message: 'Phải nhập số điện thoại hoặc biển số xe!' },
        { status: 400 }
      );
    }

    // Mã hóa phone và name, chuẩn hóa biển số xe thành chữ hoa
    const encryptedPhone = phone ? encrypt(phone) : null;
    const encryptedName = name ? encrypt(name) : null;
    const normalizedPlate = licensePlate ? licensePlate.toUpperCase() : null;

    // Ngày hôm nay theo múi giờ VN
    const startOfDay = dayjs().tz('Asia/Ho_Chi_Minh').startOf('day').toDate();
    const endOfDay = dayjs().tz('Asia/Ho_Chi_Minh').endOf('day').toDate();

    // Kiểm tra lịch sử quay hôm nay
    const spunToday = await prisma.spinHistory.findFirst({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        OR: [
          ...(encryptedPhone ? [{ phone: encryptedPhone }] : []),
          ...(normalizedPlate
            ? [{ plateNumber: { equals: normalizedPlate } }]
            : []),
        ],
      },
    });

    if (spunToday) {
      return NextResponse.json(
        {
          allowed: false,
          message: 'Số điện thoại hoặc biển số xe đã quay thưởng hôm nay!',
        },
        { status: 400 }
      );
    }

    // Kiểm tra biển số xe đã tồn tại chưa
    if (normalizedPlate) {
      const plateExists = await prisma.user.findUnique({
        where: { licensePlate2: normalizedPlate },
      });
      if (plateExists) {
        return NextResponse.json(
          { allowed: false, message: 'Biển số xe đã tồn tại!' },
          { status: 400 }
        );
      }
    }

    // Kiểm tra số điện thoại đã tồn tại chưa
    if (encryptedPhone) {
      const phoneExists = await prisma.user.findUnique({
        where: { phone: encryptedPhone },
      });
      if (phoneExists) {
        return NextResponse.json(
          { allowed: false, message: 'Số điện thoại đã tồn tại!' },
          { status: 400 }
        );
      }
    }

    // Nếu không trùng => tạo mới user
    await prisma.user.create({
      data: {
        name: encryptedName ?? 'Người dùng',
        phone: encryptedPhone ?? '',
        licensePlate2: normalizedPlate ?? '',
        hasSpun: false,
      },
    });

    // Cho phép tham gia
    return NextResponse.json({ allowed: true });
  } catch (error) {
    console.error('Lỗi khi kiểm tra user:', error);
    return NextResponse.json(
      { allowed: false, message: 'Lỗi server!' },
      { status: 500 }
    );
  }
}

