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

    // Send email notification to uploader using settings from database
    try {
      const settings = await prisma.settings.findFirst();
      const uploaderEmail = settings?.uploaderEmail || upload.user?.email || 'uploader@company.com';

      // Count issues
      const issuesCount = reviewedData.filter((row: ReviewedRow) => row._status === 'issue').length;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal-cvs.vercel.app';
      const downloadUrl = `${appUrl}/download/${upload.id}`;
      
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@company.com',
        to: uploaderEmail,
        subject: `✅ CSV Review Voltooid - ${upload.filename}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
              <tr>
                <td style="padding: 40px 20px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    
                    <!-- Logo -->
                    <tr>
                      <td style="background-color: #ffffff; padding: 30px 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                        <img src="${appUrl}/elmar-logo.png" alt="Elmar Services" style="max-width: 220px; height: auto; display: block; margin: 0 auto;">
                      </td>
                    </tr>
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">✅ Review Voltooid</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                          Beste gebruiker,
                        </p>
                        
                        <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                          Je geüploade CSV bestand is succesvol gereviewed en staat klaar voor download.
                        </p>
                        
                        <!-- Info Box -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 6px; margin-bottom: 30px;">
                          <tr>
                            <td style="padding: 20px;">
                              <h3 style="margin: 0 0 15px; color: #495057; font-size: 16px; font-weight: 600;">📄 Bestand Details</h3>
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                  <td style="padding: 5px 0; color: #6c757d; font-size: 14px;"><strong>Bestandsnaam:</strong></td>
                                  <td style="padding: 5px 0; color: #333333; font-size: 14px; text-align: right;">${upload.filename}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 5px 0; color: #6c757d; font-size: 14px;"><strong>Aantal rijen:</strong></td>
                                  <td style="padding: 5px 0; color: #333333; font-size: 14px; text-align: right;">${reviewedData.length}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 5px 0; color: #6c757d; font-size: 14px;"><strong>Rijen met problemen:</strong></td>
                                  <td style="padding: 5px 0; color: ${issuesCount > 0 ? '#dc3545' : '#28a745'}; font-size: 14px; text-align: right; font-weight: 600;">${issuesCount}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 5px 0; color: #6c757d; font-size: 14px;"><strong>Review tijd:</strong></td>
                                  <td style="padding: 5px 0; color: #333333; font-size: 14px; text-align: right;">${new Date().toLocaleString('nl-NL', { dateStyle: 'long', timeStyle: 'short' })}</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        
                        ${comments ? `
                        <!-- Comments Box -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; margin-bottom: 30px;">
                          <tr>
                            <td style="padding: 15px 20px;">
                              <p style="margin: 0 0 8px; color: #856404; font-size: 14px; font-weight: 600;">💬 Algemene Opmerkingen:</p>
                              <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">${comments}</p>
                            </td>
                          </tr>
                        </table>
                        ` : ''}
                        
                        <!-- CTA Button -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 30px;">
                          <tr>
                            <td style="text-align: center;">
                              <a href="${downloadUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                                📥 Download Reviewed Bestand
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Warning Box -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8d7da; border-left: 4px solid #dc3545; border-radius: 4px; margin-bottom: 30px;">
                          <tr>
                            <td style="padding: 15px 20px;">
                              <p style="margin: 0; color: #721c24; font-size: 13px; line-height: 1.5;">
                                <strong>⚠️ Belangrijk:</strong> Het bestand wordt automatisch verwijderd zodra je het hebt gedownload. Download het bestand binnen 24 uur.
                              </p>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
                          Met vriendelijke groet,<br>
                          <strong style="color: #333333;">CSV Portal Team</strong>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #dee2e6;">
                        <p style="margin: 0 0 10px; color: #6c757d; font-size: 12px;">
                          <a href="${appUrl}" style="color: #667eea; text-decoration: none; font-weight: 500;">Ga naar CSV Portal</a>
                        </p>
                        <p style="margin: 0; color: #adb5bd; font-size: 11px;">
                          Deze email is automatisch gegenereerd. Beantwoord deze email niet.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
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