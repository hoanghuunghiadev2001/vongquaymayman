// /app/api/topup-callback/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  console.log('Callback từ Thesieure:', body);

  // Xử lý callback nếu muốn lưu log hoặc cập nhật trạng thái

  return NextResponse.json({ success: true });
}
