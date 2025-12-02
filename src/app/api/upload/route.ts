import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditActions } from '@/lib/audit';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Configuratie voor Vercel - maximale body size voor file uploads
export const maxDuration = 60; // seconds
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Ontvang geparsede data van client (niet het hele bestand!)
    const body = await request.json();
    const { filename, fileType, data } = body;

    if (!filename || !data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Ongeldige data' }, { status: 400 });
    }

    if (data.length === 0) {
      return NextResponse.json({ error: 'Bestand bevat geen data' }, { status: 400 });
    }

    // Get client information for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Process the data to add titel column if needed
    const processedData = data.map((row: Record<string, unknown>) => {
      const processedRow = { ...row };

      // Add titel column after relatie if it doesn't exist
      if (row['relatie'] && !row['titel']) {
        processedRow['titel'] = '';
      }

      return processedRow;
    });

    // Create default uploader user if not exists
    const uploaderId = 'default-uploader';
    await prisma.user.upsert({
      where: { id: uploaderId },
      update: {},
      create: {
        id: uploaderId,
        email: 'elkaoui.a@gmail.com',
        name: 'Default Uploader',
        role: 'uploader',
      },
    });

    // Create upload record - simplified, no sheetNames for now
    const upload = await prisma.upload.create({
      data: {
        userId: uploaderId,
        filename: filename,
        status: 'uploaded',
        reviewedData: JSON.stringify(processedData),
      },
    });

    // Log the upload action
    await auditActions.uploadCreated(uploaderId, upload.id, filename, ipAddress, userAgent);

    // Send emails using settings from database
    try {
      // Get email addresses from settings
      const settings = await prisma.settings.findFirst();
      const reviewerEmail = settings?.reviewerEmail || 'info@akwebsolutions.nl';
      const uploaderEmail = settings?.uploaderEmail || 'elkaoui.a@gmail.com';

      // Email to reviewer
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@company.com',
        to: reviewerEmail,
        subject: `Nieuwe ${fileType || 'CSV'} upload klaar voor review: ${filename}`,
        html: `
          <h2>Nieuwe ${fileType || 'CSV'} upload beschikbaar</h2>
          <p>Er is een nieuwe ${fileType || 'CSV'} upload beschikbaar voor review:</p>
          <ul>
            <li><strong>Bestand:</strong> ${filename}</li>
            <li><strong>Type:</strong> ${(fileType || 'CSV').toUpperCase()}</li>
            <li><strong>Aantal rijen:</strong> ${processedData.length}</li>
            <li><strong>Uploader:</strong> ${uploaderEmail}</li>
            <li><strong>Upload tijd:</strong> ${new Date().toLocaleString('nl-NL')}</li>
          </ul>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/review/${upload.id}">Klik hier om te reviewen</a></p>
        `,
      });

      // Confirmation email to uploader
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@company.com',
        to: uploaderEmail,
        subject: `${(fileType || 'CSV').toUpperCase()} upload bevestiging: ${filename}`,
        html: `
          <h2>${(fileType || 'CSV').toUpperCase()} Upload Bevestiging</h2>
          <p>Je ${(fileType || 'CSV').toUpperCase()} bestand is succesvol geüpload:</p>
          <ul>
            <li><strong>Bestand:</strong> ${filename}</li>
            <li><strong>Type:</strong> ${(fileType || 'CSV').toUpperCase()}</li>
            <li><strong>Aantal rijen:</strong> ${processedData.length}</li>
            <li><strong>Status:</strong> Wachtend op review</li>
          </ul>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard">Bekijk je uploads</a></p>
        `,
      });

      await auditActions.emailSent(uploaderId, upload.id, reviewerEmail, ipAddress, userAgent);
      await auditActions.emailSent(uploaderId, upload.id, uploaderEmail, ipAddress, userAgent);

    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail upload if email fails
    }

    return NextResponse.json({
      success: true,
      uploadId: upload.id,
      message: `${(fileType || 'CSV').toUpperCase()} bestand succesvol geüpload!`,
      fileType: fileType || 'csv',
      rowCount: processedData.length
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden bij het uploaden'
    }, { status: 500 });
  }
}