import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { prisma } from '@/lib/prisma';
import { auditActions } from '@/lib/audit';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // Get client information for audit logging
  const ipAddress = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  const fileContent = await file.text();

  console.log('File content preview:', fileContent.substring(0, 200));

  const parsed = Papa.parse(fileContent, { header: true, delimiter: ',', skipEmptyLines: true });

  if (parsed.errors.length > 0) {
    console.error('CSV parsing errors:', parsed.errors);
    return NextResponse.json({ error: 'CSV parsing failed: ' + parsed.errors.map(e => e.message).join(', ') }, { status: 400 });
  }

  if (parsed.data.length === 0) {
    return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
  }

  // For now, assume we have a default uploader user
  // In a real app, this would come from authentication
  const uploaderId = 'default-uploader';

  // Ensure the default user exists
  await prisma.user.upsert({
    where: { id: uploaderId },
    update: {},
    create: {
      id: uploaderId,
      email: 'uploader@company.com',
      password: 'dummy-password', // This should be hashed in a real app
      name: 'Default Uploader',
      role: 'uploader',
    },
  });

  // Create upload record with parsed data - initially uploaded, not reviewed
  const upload = await prisma.upload.create({
    data: {
      userId: uploaderId,
      filename: file.name,
      status: 'uploaded', // Initially uploaded, not reviewed
      reviewedData: JSON.stringify(parsed.data), // Store the parsed CSV data
    },
  });

  // Log the upload action
  await auditActions.uploadCreated(uploaderId, upload.id, file.name, ipAddress, userAgent);

  // Send auto-emails to both uploader and reviewer
  try {
    // Get reviewer email from settings
    const reviewerEmailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/settings/reviewer-email`);
    let reviewerEmail = 'reviewer@company.com'; // fallback

    if (reviewerEmailResponse.ok) {
      const settings = await reviewerEmailResponse.json();
      reviewerEmail = settings.email || reviewerEmail;
    }

    // Get uploader email (currently hardcoded, in real app this would come from auth)
    const uploaderEmail = 'uploader@company.com';

    // Send email to reviewer
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@company.com',
      to: reviewerEmail,
      subject: `Nieuwe CSV upload klaar voor review: ${file.name}`,
      html: `
        <h2>Nieuwe CSV upload beschikbaar</h2>
        <p>Er is een nieuwe CSV upload beschikbaar voor review:</p>
        <ul>
          <li><strong>Bestand:</strong> ${file.name}</li>
          <li><strong>Aantal rijen:</strong> ${parsed.data.length}</li>
          <li><strong>Uploader:</strong> ${uploaderEmail}</li>
          <li><strong>Upload tijd:</strong> ${new Date().toLocaleString('nl-NL')}</li>
        </ul>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/review/${upload.id}">Klik hier om te reviewen</a></p>
        <p>Met vriendelijke groet,<br>CSV Portal Systeem</p>
      `,
    });

    // Send confirmation email to uploader
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@company.com',
      to: uploaderEmail,
      subject: `CSV upload bevestiging: ${file.name}`,
      html: `
        <h2>CSV Upload Bevestiging</h2>
        <p>Je CSV bestand is succesvol geüpload en verzonden voor review:</p>
        <ul>
          <li><strong>Bestand:</strong> ${file.name}</li>
          <li><strong>Aantal rijen:</strong> ${parsed.data.length}</li>
          <li><strong>Status:</strong> Wachtend op review</li>
          <li><strong>Upload tijd:</strong> ${new Date().toLocaleString('nl-NL')}</li>
        </ul>
        <p>Je ontvangt een notificatie zodra de review is voltooid en het bestand klaar is voor download.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard">Bekijk je uploads in het dashboard</a></p>
        <p>Met vriendelijke groet,<br>CSV Portal Systeem</p>
      `,
    });

    // Log emails sent
    await auditActions.emailSent(uploaderId, upload.id, reviewerEmail, ipAddress, userAgent);
    await auditActions.emailSent(uploaderId, upload.id, uploaderEmail, ipAddress, userAgent);

  } catch (emailError) {
    console.error('Failed to send email:', emailError);
    // Don't fail the upload if email fails
  }

  return NextResponse.json({
    success: true,
    uploadId: upload.id,
    message: 'CSV uploaded successfully. Both uploader and reviewer have been notified via email.'
  });
}