import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/storage';

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ 
      uploaderEmail: settings.uploaderEmail,
      reviewerEmail: settings.reviewerEmail
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

    const settings = await updateSettings({
      ...(uploaderEmail && { uploaderEmail }),
      ...(reviewerEmail && { reviewerEmail }),
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