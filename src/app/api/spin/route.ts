/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';

export async function POST(req: Request) {
  try {
    const { phone, deviceKey } = await req.json();
    if (!phone) {
      console.warn("⚠️ Không có số điện thoại trong body");
      return NextResponse.json({ success: false, message: 'Thiếu số điện thoại' }, { status: 400 });
    }

    const encryptedPhone = encrypt(phone);
    console.log("📞 Số điện thoại:", phone);
    console.log("🔐 Đã mã hóa:", encryptedPhone);

    const user = await prisma.user.findUnique({ where: { phone: encryptedPhone } });
    if (!user) {
      console.warn("❌ Không tìm thấy người dùng");
      return NextResponse.json({ success: false, message: 'Người dùng không tồn tại' }, { status: 404 });
    }

    if (user.hasSpun) {
      const existingPrize = await prisma.prizeConfig.findFirst({ where: { name: user.prize ?? '' } });
      return NextResponse.json({
        success: true,
        prize: user.prize,
        prizeId: existingPrize?.id ?? null,
        message: 'Bạn đã quay trước đó rồi.',
        alreadySpun: true
      });
    }

    const prizes = await prisma.prizeConfig.findMany({ orderBy: { id: 'asc' } });
    if (!prizes || prizes.length === 0) {
      console.error("❌ Không có phần thưởng nào được cấu hình");
      return NextResponse.json({ success: false, message: 'Chưa cấu hình phần thưởng.' }, { status: 500 });
    }

    const weighted: { id: number; name: string }[] = [];
    prizes.forEach(p => {
      for (let i = 0; i < p.ratio; i++) {
        weighted.push({ id: p.id, name: p.name });
      }
    });

    const selected = weighted[Math.floor(Math.random() * weighted.length)];
    console.log("🎁 Phần thưởng đã chọn:", selected);

    await prisma.user.update({
      where: { phone: encryptedPhone },
      data: {
        hasSpun: true,
        prize: selected.name,
      },
    });

    // if (selected.name.toLowerCase().includes('card')) {
    //   const telco = /viettel|mobifone|vinaphone/i.exec(selected.name)?.[0] || '';
    //   const amount = parseInt(selected.name.match(/\d+/)?.[0] || '0');
    //   const requestId = `${Date.now()}-${phone}`;
    //   console.log("🔌 Đang gọi API TSR:", { telco, amount });
    //   const result = await tsrTopup({ requestId, phone, telco, amount });
    //   console.log("✅ Kết quả nạp:", result);
    // }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const userAgent = req.headers.get('user-agent') || '';

await prisma.spinHistory.create({
  data: {
    phone: encryptedPhone,
    prize: selected.name,
    ip: String(ip),
    userAgent,
    ...(deviceKey ? { deviceKey: deviceKey } : {}), // tránh gán ''
  },
});

    return NextResponse.json({
      success: true,
      prize: selected.name,
      prizeId: selected.id,
      message: 'Chúc mừng bạn đã quay thành công!',
    });
  } catch (error) {
    console.error("🔥 Lỗi khi xử lý quay thưởng:", error);
    return NextResponse.json({ success: false, message: 'Lỗi máy chủ' }, { status: 500 });
  }
}

