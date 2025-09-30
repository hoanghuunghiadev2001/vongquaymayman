/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    // 👉 Lấy tất cả lịch sử quay có prize
    const histories = await prisma.spinHistory.findMany({
      where: { prize: { not: "" } },
      orderBy: { createdAt: "desc" },
    });

    // 👉 Map sang winners (join User qua licensePlate2)
    const winners = await Promise.all(
      histories.map(async (h) => {
        // Giải mã phone trong spinHistory (để hiển thị nếu có)
        let phone = "Không đọc được";
        try {
          if (h.phone) {
            phone = decrypt(h.phone);
          }
        } catch (err) {
          console.warn(`❗ Không giải mã được phone spinHistory ID ${h.id}`);
        }

        // 🔹 Luôn join user theo biển số
        let user = null;
        if (h.plateNumber) {
          user = await prisma.user.findFirst({
            where: { licensePlate2: h.plateNumber },
            select: { id: true, name: true, phone: true, licensePlate2: true },
          });
        }

        // Giải mã name
        let name = "Không rõ";
        try {
          if (user?.name) {
            name = decrypt(user.name);
          }
        } catch (err) {
          console.warn(`❗ Không giải mã được name user ID ${user?.id}`);
        }

        // Giải mã phone từ user (ưu tiên user.phone, fallback sang spinHistory.phone)
        let displayPhone = phone;
        try {
          if (user?.phone) {
            displayPhone = decrypt(user.phone);
          }
        } catch {
          // fallback đã có
        }

        return {
          id: h.id,
          name,
          phone: displayPhone,
          licensePlate: h.plateNumber ?? user?.licensePlate2 ?? "—",
          prize: h.prize,
          createdAt: h.createdAt,
        };
      })
    );

    // 👉 Thống kê giải thưởng
    const prizeCounts = await prisma.spinHistory.groupBy({
      by: ["prize"],
      where: { prize: { not: "" } },
      _count: { prize: true },
    });

    const prizeConfigs = await prisma.prizeConfig.findMany();

    const detailedPrizes = prizeConfigs.map((config) => {
      const matched = prizeCounts.find((p) => p.prize === config.name);
      const used = matched?._count.prize ?? 0;

      return {
        name: config.name,
        ratio: config.ratio,
        total: config.quantity,
        used,
        remaining: config.quantity - used,
      };
    });

    // 👉 Tạo workbook Excel
    const workbook = new ExcelJS.Workbook();
    const winnerSheet = workbook.addWorksheet("Danh sách trúng thưởng");
    const prizeSheet = workbook.addWorksheet("Thống kê giải thưởng");

    // Sheet winners
    winnerSheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Tên", key: "name", width: 25 },
      { header: "SĐT", key: "phone", width: 20 },
      { header: "Biển số xe", key: "licensePlate", width: 20 },
      { header: "Phần thưởng", key: "prize", width: 25 },
      { header: "Ngày tham gia", key: "createdAt", width: 25 },
    ];

    winners.forEach((w) =>
      winnerSheet.addRow({
        id: w.id,
        name: w.name,
        phone: w.phone,
        licensePlate: w.licensePlate,
        prize: w.prize,
        createdAt: new Date(w.createdAt).toLocaleString("vi-VN"),
      })
    );

    // Sheet thống kê prize
    prizeSheet.columns = [
      { header: "Tên", key: "name", width: 25 },
      { header: "Tỷ lệ (%)", key: "ratio", width: 15 },
      { header: "Tổng số", key: "total", width: 15 },
      { header: "Đã trúng", key: "used", width: 15 },
      { header: "Còn lại", key: "remaining", width: 15 },
    ];
    detailedPrizes.forEach((p) => prizeSheet.addRow(p));

    // 👉 Xuất file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="winners.xlsx"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error: any) {
    console.error("❌ Lỗi khi export Excel:", error);
    return NextResponse.json(
      { error: "Server error", details: String(error) },
      { status: 500 }
    );
  }
}
