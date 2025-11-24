import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const uploads = await prisma.upload.findMany({
    include: {
      invoices: true,
    },
  });
  return NextResponse.json(uploads);
}