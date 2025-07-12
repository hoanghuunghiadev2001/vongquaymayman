import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const prizes = await prisma.prizeConfig.findMany({ orderBy: { id: 'asc' } });
  return NextResponse.json(prizes);
}

export async function POST(req: Request) {
  const { name, ratio } = await req.json();

  if (!name || !ratio) {
    return NextResponse.json({ error: 'Thiếu dữ liệu' }, { status: 400 });
  }

  const prize = await prisma.prizeConfig.create({
    data: {
      name,
      ratio: parseFloat(ratio),
    },
  });

  return NextResponse.json(prize);
}

export async function PUT(req: Request) {
  const { id, name, ratio } = await req.json();

  if (!id || !name || ratio == null) {
    return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
  }

  const prize = await prisma.prizeConfig.update({
    where: { id },
    data: {
      name,
      ratio: parseFloat(ratio),
    },
  });

  return NextResponse.json(prize);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: 'Thiếu ID' }, { status: 400 });
  }

  await prisma.prizeConfig.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
