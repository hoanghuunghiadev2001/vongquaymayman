/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

export async function GET(req: Request) {
  try {
    // Lấy query params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Lấy tổng số user
    const totalUsers = await prisma.user.count();

    // Lấy danh sách user theo trang
    const users = await prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        licensePlate2: true,
        prize: true,
        hasSpun: true,
        createdAt: true,
      },
    });

    

    // Giải mã dữ liệu
    const decryptedUsers = users.map(user => {
      let name = 'Không đọc được';
      let phone = 'Không đọc được';
      let licensePlate = 'Không đọc được';
      
      try {
        if (user.name) name = decrypt(user.name);
        if (user.phone) phone = decrypt(user.phone);
        if (user.licensePlate2) licensePlate = user.licensePlate2;
      } catch (err) {
        console.warn(`❗ Không giải mã được user ID ${user.id}:`, err);
      }

    console.log("📌 Raw licensePlate2:", user.licensePlate2);


      return {
        id: user.id,
        name,
        phone,
        licensePlate,
        prize: user.prize,
        hasSpun: user.hasSpun,
        createdAt: user.createdAt,
      };
    });

    // Thống kê winners
    const winners = await prisma.user.count({
      where: { prize: { not: null } },
    });
    const percent = totalUsers > 0 ? (winners / totalUsers) * 100 : 0;

    // Thống kê prize
    const prizeCounts = await prisma.user.groupBy({
      by: ['prize'],
      where: { prize: { not: null } },
      _count: true,
    });

    const prizeConfigs = await prisma.prizeConfig.findMany();

    const detailedPrizes = prizeConfigs.map(config => {
      const matched = prizeCounts.find(p => p.prize === config.name);
      const used = matched?._count ?? 0;
      return {
        name: config.name,
        ratio: config.ratio,
        total: used + config.quantity, // tổng ban đầu = đã dùng + còn lại
        used,
        remaining: config.quantity, // còn lại
      };
    });


    return NextResponse.json({
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
      winners,
      percent: Math.round(percent * 100) / 100,
      prizeStats: detailedPrizes,
      users: decryptedUsers,
    });
  } catch (error) {
    console.error('❌ Lỗi khi thống kê:', error);
    return NextResponse.json(
      { error: 'Server error', details: String(error) },
      { status: 500 }
    );
  }
}
