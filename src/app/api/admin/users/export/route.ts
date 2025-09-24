/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import ExcelJS from 'exceljs';

export async function GET() {
  try {
    // Lấy toàn bộ user
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const decryptedUsers = users.map((user: { name: string; phone: string; id: any; prize: any; hasSpun: any; createdAt: any; }) => {
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
        hasSpun: user.hasSpun ? '✅' : '❌',
        createdAt: user.createdAt,
      };
    });

    const prizeCounts = await prisma.user.groupBy({
      by: ['prize'],
      where: { prize: { not: null } },
      _count: true,
    });

    const prizeConfigs = await prisma.prizeConfig.findMany();

    const detailedPrizes = prizeConfigs.map((config: { name: any; quantity: number; ratio: number; }) => {
      const matched = prizeCounts.find((p: { prize: any; }) => p.prize === config.name);
      const used = matched?._count ?? 0;
      const total = config.quantity ?? Math.floor(100 / config.ratio);
      const remaining = total;

      return {
        name: config.name,
        ratio: config.ratio,
        used,
        remaining,
      };
    });

    // 👉 Tạo workbook Excel
    const workbook = new ExcelJS.Workbook();
    const userSheet = workbook.addWorksheet('Người dùng');
    const prizeSheet = workbook.addWorksheet('Thống kê giải thưởng');

    // Sheet user
    userSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Tên', key: 'name', width: 25 },
      { header: 'SĐT', key: 'phone', width: 20 },
      { header: 'Phần thưởng', key: 'prize', width: 25 },
      { header: 'Đã quay', key: 'hasSpun', width: 10 },
      { header: 'Ngày tham gia', key: 'createdAt', width: 25 },
    ];
    decryptedUsers.forEach((u: { id: any; name: any; phone: any; prize: any; hasSpun: any; createdAt: string | number | Date; }) =>
      userSheet.addRow({
        id: u.id,
        name: u.name,
        phone: u.phone,
        prize: u.prize ?? '—',
        hasSpun: u.hasSpun,
        createdAt: new Date(u.createdAt).toLocaleString('vi-VN'),
      })
    );

    // Sheet thống kê prize
    prizeSheet.columns = [
      { header: 'Tên', key: 'name', width: 25 },
      { header: 'Tỷ lệ (%)', key: 'ratio', width: 15 },
      { header: 'Đã trúng', key: 'used', width: 15 },
      { header: 'Còn lại', key: 'remaining', width: 15 },
    ];
    detailedPrizes.forEach((p: any) => prizeSheet.addRow(p));

    // Xuất file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="report.xlsx"`,
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error: any) {
    console.error('❌ Lỗi khi export Excel:', error);
    return NextResponse.json(
      { error: 'Server error', details: String(error) },
      { status: 500 }
    );
  }
}
