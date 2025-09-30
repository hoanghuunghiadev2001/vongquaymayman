/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    // 👉 Chỉ lấy những lượt quay có prize (không rỗng)
    const prizeFilter = { prize: { not: "" } };

    // 👉 Tổng số winners
    const totalWinners = await prisma.spinHistory.count({
      where: prizeFilter,
    });

    // 👉 Lấy danh sách spinHistory theo phân trang
    const histories = await prisma.spinHistory.findMany({
      where: prizeFilter,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    // 👉 Ghép thêm thông tin User cho từng lịch sử quay (theo biển số)
    const users = await Promise.all(
      histories.map(async (h) => {
        let phone = "Không đọc được";
        try {
          phone = decrypt(h.phone);
        } catch (err) {
          console.warn(`❗ Không decrypt được phone ở spinHistory ID ${h.id}`);
        }

        // 🔹 Luôn tìm user theo biển số
        let user = null;
        if (h.plateNumber) {
          user = await prisma.user.findFirst({
            where: { licensePlate2: h.plateNumber },
          });
        }

        return {
          id: h.id,
          name: user?.name ? decrypt(user.name) : "Không rõ",
          phone: user?.phone ? decrypt(user.phone) : phone,
          licensePlate: h.plateNumber ?? user?.licensePlate2 ?? "",
          prize: h.prize,
          hasSpun: user?.hasSpun ?? false,
          createdAt: h.createdAt,
        };
      })
    );

    // 👉 Thống kê số lượng từng loại prize
    const prizeCounts = await prisma.spinHistory.groupBy({
      by: ["prize"],
      where: prizeFilter,
      _count: { prize: true },
    });

    const prizeConfigs = await prisma.prizeConfig.findMany();

    const detailedPrizes = prizeConfigs.map((config) => {
      const matched = prizeCounts.find((p) => p.prize === config.name);
      const used = matched?._count.prize ?? 0;
      return {
        name: config.name,
        ratio: config.ratio,
        total: config.quantity, // tổng số giải ban đầu từ config
        used,
        remaining: (config.quantity ?? 0) - used,
      };
    });

    // 👉 Trả kết quả JSON
    return NextResponse.json({
      pagination: {
        page,
        limit,
        totalUsers: totalWinners,
        totalPages: Math.ceil(totalWinners / limit),
      },
      winners: totalWinners,
      percent: totalWinners > 0 ? 100 : 0,
      prizeStats: detailedPrizes,
      users,
    });
  } catch (error) {
    console.error("❌ Lỗi khi thống kê winners:", error);
    return NextResponse.json(
      { error: "Server error", details: String(error) },
      { status: 500 }
    );
  }
}
