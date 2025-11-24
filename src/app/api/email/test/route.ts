import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json();

    if (!resend) {
      return NextResponse.json({ error: 'Resend not configured' }, { status: 500 });
    }

    if (!to) {
      return NextResponse.json({ error: 'Recipient email required' }, { status: 400 });
    }

    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

    // Send test email
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: to,
      subject: 'Test Email - Elmar Services Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Test Email Verzonden! ✅</h2>
          <p>Deze test email is succesvol verzonden vanaf <strong>${fromEmail}</strong></p>
          <p>Je applicatie draait op: <strong>portal-csv.vercel.app</strong></p>
          <p>Emails worden verstuurd vanaf je geverifieerde domein: <strong>akwebsolutions.nl</strong></p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 14px;">
            Dit is een automatische test email van het Elmar Services Portal.
          </p>
        </div>
      `,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      from: fromEmail,
      to: to,
      emailId: data?.id
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}