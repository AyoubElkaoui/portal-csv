import { NextRequest, NextResponse } from 'next/server';
import { createUpload, getSettings, getUserByEmail } from '@/lib/storage';
import { Resend } from 'resend';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const resend = new Resend(process.env.RESEND_API_KEY);

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Upload request started');
    
    // Get session to get real user ID
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.error('[API] No session found');
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    // Get user from database to get real ID
    const user = await getUserByEmail(session.user.email);
    
    if (!user) {
      console.error('[API] User not found in database');
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    console.log('[API] User found:', { id: user.id, email: user.email });
    
    const body = await request.json();
    const { filename, fileType, data } = body;

    console.log('[API] Request data:', { filename, fileType, dataLength: data?.length, userId: user.id });

    if (!filename || !data || !Array.isArray(data)) {
      console.error('[API] Invalid data:', { filename: !!filename, data: !!data, isArray: Array.isArray(data) });
      return NextResponse.json({ error: 'Ongeldige data' }, { status: 400 });
    }

    if (data.length === 0) {
      console.error('[API] Empty data');
      return NextResponse.json({ error: 'Bestand bevat geen data' }, { status: 400 });
    }

    // Process the data to add titel column if needed
    const processedData = data.map((row: Record<string, unknown>) => {
      const processedRow = { ...row };
      if (row['relatie'] && !row['titel']) {
        processedRow['titel'] = '';
      }
      return processedRow;
    });

    console.log('[API] Creating upload in database...');
    
    // Create upload with real user ID
    const upload = await createUpload({
      userId: user.id,
      filename,
      fileData: processedData
    });
    
    console.log('[API] Upload created:', upload.id);

    // Send emails
    try {
      const settings = await getSettings();
      const reviewerEmail = settings.reviewerEmail;
      const uploaderEmail = settings.uploaderEmail;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal-cvs.vercel.app';

      // Email to reviewer
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'info@akwebsolutions.nl',
        to: reviewerEmail,
        subject: `Nieuwe upload klaar voor review: ${filename}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; background: #fff; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
              .logo { max-width: 200px; margin-bottom: 20px; }
              .content { padding: 30px; }
              .info-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://elmarservices.com/wp-content/uploads/2024/12/LOGO-ELMAR-766x226-1-400x118.png" alt="Elmar Services" class="logo">
                <h1 style="color: white; margin: 0;">Nieuwe Upload</h1>
              </div>
              <div class="content">
                <p>Hallo,</p>
                <p>Er is een nieuwe upload beschikbaar voor review:</p>
                <div class="info-box">
                  <p><strong>Bestand:</strong> ${filename}</p>
                  <p><strong>Type:</strong> ${(fileType || 'CSV').toUpperCase()}</p>
                  <p><strong>Aantal rijen:</strong> ${processedData.length}</p>
                  <p><strong>Uploader:</strong> ${uploaderEmail}</p>
                  <p><strong>Upload tijd:</strong> ${new Date().toLocaleString('nl-NL')}</p>
                </div>
                <a href="${appUrl}/review/${upload.id}" class="button">Start Review</a>
              </div>
              <div class=\"footer\">
                <p>&copy; ${new Date().getFullYear()} Elmar Services | CSV Portal</p>
                <p><a href=\"${appUrl}\" style=\"color: #667eea;\">Portal openen</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      // Confirmation email to uploader
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'info@akwebsolutions.nl',
        to: uploaderEmail,
        subject: `Upload bevestiging: ${filename}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; background: #fff; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; }
              .logo { max-width: 200px; margin-bottom: 20px; }
              .content { padding: 30px; }
              .info-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://elmarservices.com/wp-content/uploads/2024/12/LOGO-ELMAR-766x226-1-400x118.png" alt="Elmar Services" class="logo">
                <h1 style="color: white; margin: 0;">Upload Succesvol</h1>
              </div>
              <div class="content">
                <p>Beste gebruiker,</p>
                <p>Je bestand is succesvol geüpload en wordt binnenkort gereviewed:</p>
                <div class="info-box">
                  <p><strong>Bestand:</strong> ${filename}</p>
                  <p><strong>Type:</strong> ${(fileType || 'CSV').toUpperCase()}</p>
                  <p><strong>Aantal rijen:</strong> ${processedData.length}</p>
                  <p><strong>Status:</strong> Wachtend op review</p>
                </div>
                <p>Je ontvangt een nieuwe email zodra de review voltooid is.</p>
                <a href="${appUrl}/dashboard" class="button">Bekijk Dashboard</a>
              </div>
              <div class=\"footer\">
                <p>&copy; ${new Date().getFullYear()} Elmar Services | CSV Portal</p>
                <p><a href=\"${appUrl}\" style=\"color: #10b981;\">Portal openen</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      
      console.log('[API] Emails sent successfully');
    } catch (emailError) {
      console.error('[API] Email error:', emailError);
    }

    console.log('[API] Upload completed successfully');

    return NextResponse.json({
      success: true,
      uploadId: upload.id,
      message: `${(fileType || 'CSV').toUpperCase()} bestand succesvol geüpload!`,
      fileType: fileType || 'csv',
      rowCount: processedData.length
    });

  } catch (error) {
    console.error('[API] Upload error:', error);
    console.error('[API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    
    return NextResponse.json({
      error: 'Er is een fout opgetreden bij het uploaden'
    }, { status: 500 });
  }
}