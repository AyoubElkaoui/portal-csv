import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { invoiceIds } = await request.json();

    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json({ error: 'Invalid invoice IDs' }, { status: 400 });
    }

    // Update all selected invoices to approved
    await prisma.invoice.updateMany({
      where: {
        id: {
          in: invoiceIds
        }
      },
      data: {
        akkoord: true,
        afgewezen: false
      }
    });

    return NextResponse.json({ success: true, updated: invoiceIds.length });
  } catch (error) {
    console.error('Bulk approve error:', error);
    return NextResponse.json({ error: 'Failed to bulk approve invoices' }, { status: 500 });
  }
}