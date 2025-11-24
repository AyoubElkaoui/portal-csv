import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
  const { akkoord, opmerkingen } = await request.json();
  const data: { akkoord?: boolean; afgewezen?: boolean; opmerkingen?: string } = {};
  if (akkoord !== undefined) {
    data.akkoord = akkoord;
    data.afgewezen = !akkoord;
  }
  if (opmerkingen !== undefined) {
    data.opmerkingen = opmerkingen;
  }
  await prisma.invoice.update({
    where: { id },
    data,
  });
  return NextResponse.json({ success: true });
}