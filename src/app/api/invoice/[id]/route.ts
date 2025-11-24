import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditActions } from '@/lib/audit';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
  const { akkoord, opmerkingen } = await request.json();

  // Get client information for audit logging
  const ipAddress = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

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

  // Log the action
  if (akkoord !== undefined) {
    if (akkoord) {
      await auditActions.invoiceApproved('system', id, {
        previousStatus: !akkoord,
        comment: opmerkingen,
        ipAddress,
        userAgent,
      });
    } else {
      await auditActions.invoiceRejected('system', id, {
        previousStatus: !akkoord,
        comment: opmerkingen,
        ipAddress,
        userAgent,
      });
    }
  }

  if (opmerkingen !== undefined && akkoord === undefined) {
    await auditActions.invoiceCommented('system', id, opmerkingen);
  }

  return NextResponse.json({ success: true });
}