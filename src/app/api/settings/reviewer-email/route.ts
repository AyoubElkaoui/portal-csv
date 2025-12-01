import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();
    return NextResponse.json({ 
      uploaderEmail: settings?.uploaderEmail || 'anissa@example.com',
      reviewerEmail: settings?.reviewerEmail || 'reviewer@example.com'
    });
  } catch (error) {
    console.error('Failed to get settings:', error);
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uploaderEmail, reviewerEmail } = body;

    if (uploaderEmail && !uploaderEmail.includes('@')) {
      return NextResponse.json({ error: 'Invalid uploader email address' }, { status: 400 });
    }

    if (reviewerEmail && !reviewerEmail.includes('@')) {
      return NextResponse.json({ error: 'Invalid reviewer email address' }, { status: 400 });
    }

    // Upsert settings (create if doesn't exist, update if it does)
    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      update: {
        ...(uploaderEmail && { uploaderEmail }),
        ...(reviewerEmail && { reviewerEmail }),
      },
      create: {
        id: 'default',
        uploaderEmail: uploaderEmail || 'anissa@example.com',
        reviewerEmail: reviewerEmail || 'reviewer@example.com',
      },
    });

    return NextResponse.json({ 
      success: true, 
      uploaderEmail: settings.uploaderEmail,
      reviewerEmail: settings.reviewerEmail
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}