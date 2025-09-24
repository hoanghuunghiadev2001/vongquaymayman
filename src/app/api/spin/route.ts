/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import nodemailer from 'nodemailer';

dayjs.extend(utc);
dayjs.extend(timezone);

// Hàm gửi mail
async function sendLowStockMail(prizeName: string, quantity: number) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true cho 465, false cho 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Lucky Spin" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `⚠️ Phần thưởng gần hết: ${prizeName}`,
      html: `
        <h3>Thông báo số lượng quà tặng gần hết</h3>
        <p>Phần thưởng <b>${prizeName}</b> hiện chỉ còn lại <b>${quantity}</b> phần.</p>
        <p>Hãy kiểm tra và bổ sung nếu cần.</p>
      `,
    });

    console.log(`📧 Đã gửi mail cảnh báo quà ${prizeName} còn ${quantity}`);
  } catch (err) {
    console.error('❌ Lỗi gửi mail:', err);
  }
}

export async function POST(req: Request) {
  try {
    const { phone, deviceKey } = await req.json();
    if (!phone) {
      return NextResponse.json({ success: false, message: 'Thiếu số điện thoại' }, { status: 400 });
    }

    const encryptedPhone = encrypt(phone);
    const user = await prisma.user.findUnique({ where: { phone: encryptedPhone } });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Người dùng không tồn tại' }, { status: 404 });
    }

    // Xác định ngày hiện tại theo giờ VN
    const startOfDay = dayjs().tz('Asia/Ho_Chi_Minh').startOf('day').toDate();
    const endOfDay = dayjs().tz('Asia/Ho_Chi_Minh').endOf('day').toDate();

    // Kiểm tra đã quay trong ngày chưa
    const spunToday = await prisma.spinHistory.findFirst({
      where: {
        phone: encryptedPhone,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (spunToday) {
      return NextResponse.json({
        success: true,
        prize: spunToday.prize,
        message: 'Bạn đã quay hôm nay rồi, hãy quay lại vào ngày mai!',
        alreadySpun: true,
      });
    }

    // Lấy danh sách phần thưởng còn hàng
    const prizes = await prisma.prizeConfig.findMany({
      where: { quantity: { gt: 0 } },
      orderBy: { id: 'asc' },
    });

    if (!prizes || prizes.length === 0) {
      return NextResponse.json({ success: false, message: 'Hết phần thưởng.' }, { status: 500 });
    }

    // Tạo mảng theo tỉ lệ
    const weighted: { id: number; name: string }[] = [];
    prizes.forEach((p: { ratio: number; id: any; name: any; }) => {
      for (let i = 0; i < p.ratio; i++) {
        weighted.push({ id: p.id, name: p.name });
      }
    });

    // Chọn ngẫu nhiên
    const selected = weighted[Math.floor(Math.random() * weighted.length)];

    // Giảm số lượng phần thưởng trong transaction
    const updatedPrize = await prisma.$transaction(async (tx: { prizeConfig: { findUnique: (arg0: { where: { id: number; }; }) => any; update: (arg0: { where: { id: number; }; data: { quantity: { decrement: number; }; }; }) => any; }; }) => {
      const prize = await tx.prizeConfig.findUnique({ where: { id: selected.id } });
      if (!prize || prize.quantity <= 0) {
        throw new Error("Phần thưởng đã hết");
      }

      const updated = await tx.prizeConfig.update({
        where: { id: selected.id },
        data: { quantity: { decrement: 1 } },
      });

      return updated;
    });

    // Nếu số lượng còn < 10 thì gửi mail cho admin
    if (updatedPrize.quantity < 10) {
      await sendLowStockMail(updatedPrize.name, updatedPrize.quantity);
    }

    // Cập nhật prize cho user
    await prisma.user.update({
      where: { phone: encryptedPhone },
      data: { prize: updatedPrize.name },
    });

    // Lưu lịch sử quay
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const userAgent = req.headers.get('user-agent') || '';

    await prisma.spinHistory.create({
      data: {
        phone: encryptedPhone,
        prize: updatedPrize.name,
        ip: String(ip),
        userAgent,
        ...(deviceKey ? { deviceKey } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      prize: updatedPrize.name,
      prizeId: updatedPrize.id,
      message: 'Chúc mừng bạn đã quay thành công!',
    });
  } catch (error: any) {
    console.error("🔥 Lỗi khi xử lý quay thưởng:", error);
    return NextResponse.json({ success: false, message: error.message || 'Lỗi máy chủ' }, { status: 500 });
  }
}
