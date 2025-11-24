import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, invoiceId, templateId } = await request.json();

    if (!resend) {
      console.log('Email not sent: RESEND_API_KEY not configured');
      return NextResponse.json({
        success: true,
        message: 'Email not sent - Resend API key not configured'
      });
    }

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine from email based on environment
    const fromEmail = process.env.FROM_EMAIL || 'noreply@resend.dev';

    // Send email
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: to,
      subject: subject,
      html: html,
      // Optional: Add metadata for tracking
      tags: [
        {
          name: 'invoice_id',
          value: invoiceId || 'unknown'
        },
        {
          name: 'template_id',
          value: templateId || 'custom'
        }
      ]
    });

    if (error) {
      throw error;
    }

    console.log('Email sent successfully:', data?.id);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailId: data?.id
    });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json({
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}