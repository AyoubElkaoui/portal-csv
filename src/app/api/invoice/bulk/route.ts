import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditActions } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const { invoiceIds, akkoord, opmerkingen, uploadId } = await request.json();

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json({ error: 'No invoice IDs provided' }, { status: 400 });
    }

    if (akkoord === undefined) {
      return NextResponse.json({ error: 'Approval status must be specified' }, { status: 400 });
    }

    // Get client information for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Update all invoices
    const data: { akkoord: boolean; afgewezen: boolean; opmerkingen?: string } = {
      akkoord,
      afgewezen: !akkoord,
    };

    if (opmerkingen !== undefined) {
      data.opmerkingen = opmerkingen;
    }

    await prisma.invoice.updateMany({
      where: {
        id: {
          in: invoiceIds
        }
      },
      data,
    });

    // Log the bulk action
    if (uploadId) {
      if (akkoord) {
        await auditActions.bulkApproved('system', uploadId, invoiceIds, ipAddress, userAgent);
      } else {
        await auditActions.bulkRejected('system', uploadId, invoiceIds, ipAddress, userAgent);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${akkoord ? 'approved' : 'rejected'} ${invoiceIds.length} invoices`
    });
  } catch (error) {
    console.error('Bulk invoice update error:', error);
    return NextResponse.json({
      error: 'Failed to update invoices',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}