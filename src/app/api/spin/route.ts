/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { tsrTopup } from '@/lib/tsr'; // API nạp thẻ tự động

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      console.error('⛔ Thiếu số điện thoại');
      return NextResponse.json({ success: false, message: 'Thiếu số điện thoại' }, { status: 400 });
    }

    const encryptedPhone = encrypt(phone);
    console.log('📞 Phone:', phone);
    console.log('🔐 Encrypted phone:', encryptedPhone);

    const user = await prisma.user.findUnique({ where: { phone: encryptedPhone } });

    if (!user) {
      console.error('⛔ Người dùng không tồn tại');
      return NextResponse.json({ success: false, message: 'Người dùng không tồn tại' }, { status: 404 });
    }

    // Nếu đã quay rồi
    if (user.hasSpun) {
      const existingPrize = await prisma.prizeConfig.findFirst({ where: { name: user.prize ?? '' } });
      return NextResponse.json({
        success: true,
        prize: user.prize,
        prizeId: existingPrize?.id ?? null,
        message: 'Bạn đã quay trước đó rồi.',
        alreadySpun: true,
      });
    }

    // Danh sách phần thưởng theo tỉ lệ
    const prizes = await prisma.prizeConfig.findMany({ orderBy: { id: 'asc' } });
    const weighted: { id: number; name: string }[] = [];

    prizes.forEach(p => {
      for (let i = 0; i < p.ratio; i++) {
        weighted.push({ id: p.id, name: p.name });
      }
    });

    if (weighted.length === 0) {
      console.error('⛔ Chưa cấu hình phần thưởng nào');
      return NextResponse.json({ success: false, message: 'Chưa cấu hình phần thưởng.' }, { status: 500 });
    }

    const selected = weighted[Math.floor(Math.random() * weighted.length)];
    console.log('🎯 Trúng phần thưởng:', selected);

    await prisma.user.update({
      where: { phone: encryptedPhone },
      data: {
        hasSpun: true,
        prize: selected.name,
      },
    });

    // 🔁 Nạp thẻ nếu phần thưởng là thẻ
    if (selected.name.toLowerCase().includes('card')) {
      try {
        const telcoMatch = /(viettel|mobifone|vinaphone)/i.exec(selected.name);
        const amountMatch = selected.name.match(/\d+/);

        if (!telcoMatch || !amountMatch) {
          throw new Error('Không xác định được telco hoặc mệnh giá từ phần thưởng');
        }

        const telco = telcoMatch[0].toUpperCase();
        const amount = parseInt(amountMatch[0], 10);
        const requestId = `${Date.now()}-${phone}`;

        console.log('📤 Gửi yêu cầu nạp thẻ:', { telco, amount, requestId });

        const topupResult = await tsrTopup({ requestId, phone, telco, amount });

        console.log('✅ Kết quả nạp thẻ:', topupResult);
      } catch (err: any) {
        console.error('❌ Lỗi khi nạp thẻ:', err.message || err);
      }
    }

    // Ghi lại lịch sử quay
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const userAgent = req.headers.get('user-agent') || '';

    await prisma.spinHistory.create({
      data: {
        phone: encryptedPhone,
        prize: selected.name,
        deviceKey: user.deviceKey || '',
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

  } catch (error: any) {
    console.error('🔥 Lỗi khi xử lý quay thưởng:', error.message || error);
    return NextResponse.json({ success: false, message: 'Lỗi máy chủ' }, { status: 500 });
  }
}
