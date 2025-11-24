import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditActions } from '@/lib/audit';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface ReviewedRow extends Record<string, unknown> {
  _status?: 'approved' | 'issue';
  _comments?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const upload = await prisma.upload.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }

    // Parse the stored CSV data (this should be the original uploaded data)
    const csvData = upload.reviewedData ? JSON.parse(upload.reviewedData) : [];

    return NextResponse.json({
      upload: {
        id: upload.id,
        filename: upload.filename,
        status: upload.status,
        uploadedAt: upload.uploadedAt,
        comments: upload.comments,
      },
      data: csvData,
    });
  } catch (error) {
    console.error('Failed to fetch upload:', error);
    return NextResponse.json({ error: 'Failed to fetch upload' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { comments, reviewedData } = body;

    // Get client information for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Update the upload with review results
    const upload = await prisma.upload.update({
      where: { id },
      data: {
        status: 'reviewed',
        reviewedAt: new Date(),
        comments: comments,
        reviewedData: JSON.stringify(reviewedData),
      },
      include: {
        user: true,
      },
    });

    // Log the review action using the uploader's user ID
    if (upload.userId) {
      await auditActions.uploadReviewed(upload.userId, upload.id, comments, ipAddress, userAgent);
    }

    // Send email notification to uploader
    try {
      const uploaderEmail = upload.user?.email || 'uploader@company.com';

      // Count issues
      const issuesCount = reviewedData.filter((row: ReviewedRow) => row._status === 'issue').length;

      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@company.com',
        to: uploaderEmail,
        subject: `CSV review voltooid: ${upload.filename}`,
        html: `
          <h2>CSV Review Voltooid</h2>
          <p>Je geüploade CSV bestand is gereviewed en klaar voor download:</p>
          <ul>
            <li><strong>Bestand:</strong> ${upload.filename}</li>
            <li><strong>Aantal rijen:</strong> ${reviewedData.length}</li>
            <li><strong>Rijen met problemen:</strong> ${issuesCount}</li>
            <li><strong>Review tijd:</strong> ${new Date().toLocaleString('nl-NL')}</li>
          </ul>
          ${comments ? `<p><strong>Algemene opmerkingen:</strong> ${comments}</p>` : ''}
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/download/${upload.id}">Klik hier om het reviewed bestand te downloaden</a></p>
          <p>Met vriendelijke groet,<br>CSV Portal Systeem</p>
        `,
      });

      // Log email sent
      if (upload.userId) {
        await auditActions.emailSent(upload.userId, upload.id, uploaderEmail, ipAddress, userAgent);
      }

    } catch (emailError) {
      console.error('Failed to send completion email:', emailError);
      // Don't fail the review if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Upload reviewed successfully',
    });
  } catch (error) {
    console.error('Failed to review upload:', error);
    return NextResponse.json({ error: 'Failed to review upload' }, { status: 500 });
  }
}