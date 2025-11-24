import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, action, opmerkingen } = await request.json();

    if (!resend) {
      console.log('Email not sent: RESEND_API_KEY not configured');
      return NextResponse.json({ success: true });
    }

    // Hier zou je de factuur details ophalen uit de database
    // Voor nu, een placeholder email

    const emailHtml = `
      <h1>Factuur ${action}</h1>
      <p>Factuur ID: ${invoiceId}</p>
      <p>Actie: ${action}</p>
      ${opmerkingen ? `<p>Opmerkingen: ${opmerkingen}</p>` : ''}
    `;

    await resend.emails.send({
      from: 'noreply@elmar-services.nl',
      to: 'admin@elmar-services.nl', // Of haal op uit database
      subject: `Factuur ${action}`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}