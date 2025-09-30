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

    // Tìm user theo biển số hoặc phone
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(encryptedPhone ? [{ phone: encryptedPhone }] : []),
          ...(normalizedPlate ? [{ licensePlate2: normalizedPlate }] : []),
        ],
      },
    });

    // Ngày hôm nay theo múi giờ VN
    const startOfDay = dayjs().tz('Asia/Ho_Chi_Minh').startOf('day').toDate();
    const endOfDay = dayjs().tz('Asia/Ho_Chi_Minh').endOf('day').toDate();

    // Nếu user đã tồn tại → kiểm tra đã quay trong ngày chưa
    if (user) {
      const spunToday = await prisma.spinHistory.findFirst({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
          OR: [
            ...(user.phone ? [{ phone: user.phone }] : []),
            ...(user.licensePlate2 ? [{ plateNumber: user.licensePlate2 }] : []),
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
    } else {
      // Nếu chưa có user thì tạo mới
      user = await prisma.user.create({
        data: {
          name: encryptedName ?? 'Người dùng',
          phone: encryptedPhone ?? '',
          licensePlate2: normalizedPlate ?? '',
          hasSpun: false,
        },
      });
    }

    // Nếu tới đây thì user chưa quay hôm nay → cho phép tham gia
    return NextResponse.json({ allowed: true, userId: user.id });
  } catch (error) {
    console.error('Lỗi khi kiểm tra/tạo user:', error);
    return NextResponse.json(
      { allowed: false, message: 'Lỗi server!' },
      { status: 500 }
    );
  }
}
