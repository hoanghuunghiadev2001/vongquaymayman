import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const admin = await prisma.admin.findUnique({ where: { username:email } });

  if (!admin) {
    return NextResponse.json({ success: false, message: 'Không tìm thấy tài khoản' }, { status: 401 });
  }

  const isValid = await compare(password, admin.passwordHash);

  if (!isValid) {
    return NextResponse.json({ success: false, message: 'Sai mật khẩu' }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set('admin_token', 'secure_token_here', {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 6, // 6h
  });

  return res;
}