import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { tsrTopup } from '@/lib/tsr'; // nhớ import

export async function POST(req: Request) {
  try {
    const { phone, cardCode, cardSerial } = await req.json();
    if (!phone) {
      return NextResponse.json({ success: false, message: 'Thiếu số điện thoại' }, { status: 400 });
    }

    const encryptedPhone = encrypt(phone);
    const user = await prisma.user.findUnique({ where: { phone: encryptedPhone } });

    if (!user) {
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
    const weighted: { id: number; name: string }[] = [];
    prizes.forEach(p => {
      for (let i = 0; i < p.ratio; i++) {
        weighted.push({ id: p.id, name: p.name });
      }
    });

    if (weighted.length === 0) {
      return NextResponse.json({ success: false, message: 'Chưa cấu hình phần thưởng.' }, { status: 500 });
    }

    const selected = weighted[Math.floor(Math.random() * weighted.length)];

    await prisma.user.update({
      where: { phone: encryptedPhone },
      data: {
        hasSpun: true,
        prize: selected.name,
      },
    });

    // 🔁 Nếu phần thưởng là thẻ → tự động nạp
    console.log(selected);

    if (selected.name.includes('Card')) {
      console.log('aaaaaaaaaaaaa');

      const telco = /VIETTEL|MOBIFONE|VINAPHONE/.exec(selected.name.toUpperCase())?.[0] || '';
      const amount = parseInt(selected.name.match(/\d+/)?.[0] || '0');

      const requestId = `${Date.now()}-${phone}`;
      const result = await tsrTopup({
        requestId,
        phone,
        telco,
        amount,
      });

      console.log('Nạp thẻ kết quả:', result);
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const userAgent = req.headers.get('user-agent') || '';

    await prisma.spinHistory.create({
      data: {
        phone: encryptedPhone,
        deviceKey: user.deviceKey || '',
        prize: selected.name,
        ip: String(ip),
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      prize: selected.name,
      prizeId: selected.id,
      message: 'Chúc mừng bạn đã quay thành công!',
    });

  } catch (error) {
    console.error('Lỗi khi xử lý quay thưởng:', error);
    return NextResponse.json({ success: false, message: 'Lỗi máy chủ' }, { status: 500 });
  }
}
