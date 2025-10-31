/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";

function normalizePrizeName(name: string): string {
  return name
    .normalize("NFD") // tách dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, "") // xóa dấu
    .replace(/\s+/g, "") // bỏ toàn bộ khoảng trắng
    .toLowerCase()
    .trim();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    // 👉 Chỉ lấy những lượt quay có prize (không rỗng)
    const prizeFilter = { prize: { not: "" } };

    // 👉 Tổng số lượt trúng thưởng
    const totalWinners = await prisma.spinHistory.count({
      where: prizeFilter,
    });

    // 👉 Lấy danh sách spinHistory có prize (phân trang)
    const histories = await prisma.spinHistory.findMany({
      where: prizeFilter,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    // 👉 Ghép thêm thông tin User cho từng lượt quay
    const users = await Promise.all(
      histories.map(async (h) => {
        let phone = "Không đọc được";
        try {
          phone = decrypt(h.phone);
        } catch {
          console.warn(`❗ Không decrypt được phone ở spinHistory ID ${h.id}`);
        }

        // 🔹 Tìm user theo biển số
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

    // 👉 Lấy toàn bộ phần thưởng từng xuất hiện (để không mất phần thưởng cũ)
    const spinPrizes = await prisma.spinHistory.findMany({
      where: { prize: { not: "" } },
      select: { prize: true },
    });

    // 🔹 Chuẩn hóa (normalize) tên phần thưởng để gộp trùng
    const prizeCountsMap: Record<string, number> = {};
    const originalNamesMap: Record<string, string> = {};

    for (const { prize } of spinPrizes) {
      if (!prize) continue;
      const normalized = normalizePrizeName(prize);
      prizeCountsMap[normalized] = (prizeCountsMap[normalized] || 0) + 1;

      // Lưu tên gốc đầu tiên để hiển thị đẹp
      if (!originalNamesMap[normalized]) {
        originalNamesMap[normalized] = prize.trim();
      }
    }

    // 👉 Lấy danh sách phần thưởng hiện tại trong config
    const prizeConfigs = await prisma.prizeConfig.findMany();

    // 👉 Gộp tất cả phần thưởng (cũ + mới)
    const allPrizeNames = Array.from(
      new Set([
        ...Object.keys(prizeCountsMap),
        ...prizeConfigs.map((c) => normalizePrizeName(c.name)),
      ])
    );

    // 👉 Tạo thống kê chi tiết
    const detailedPrizes = allPrizeNames.map((normalizedName) => {
      const used = prizeCountsMap[normalizedName] ?? 0;
      const matchedConfig = prizeConfigs.find(
        (c) => normalizePrizeName(c.name) === normalizedName
      );

      const displayName =
        matchedConfig?.name ??
        originalNamesMap[normalizedName] ??
        normalizedName;

      const total = matchedConfig?.quantity ?? 0;
      const ratio = matchedConfig?.ratio ?? null;

      return {
        name: displayName,
        ratio,
        total,
        used,
        remaining: total > 0 ? total - used : null,
      };
    });

    // 👉 Sắp xếp phần thưởng theo số lượt trúng giảm dần
    detailedPrizes.sort((a, b) => (b.used ?? 0) - (a.used ?? 0));

    // 👉 Trả kết quả JSON
    return NextResponse.json({
      pagination: {
        page,
        limit,
        totalUsers: totalWinners,
        totalPages: Math.ceil(totalWinners / limit),
      },
      winners: totalWinners,
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
