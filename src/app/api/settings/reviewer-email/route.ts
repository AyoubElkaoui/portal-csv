import { NextRequest, NextResponse } from 'next/server';

// In a real app, this would be stored in a database
// For now, we'll use environment variables or a simple in-memory store
let reviewerEmail = process.env.DEFAULT_REVIEWER_EMAIL || 'info@akwebsolutions.nl';

export async function GET() {
  return NextResponse.json({ email: reviewerEmail });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    reviewerEmail = email;

    // In a real app, you would save this to a database
    // For now, it will only persist during the server runtime

    return NextResponse.json({ success: true, email: reviewerEmail });
  } catch (error) {
    console.error('Failed to save reviewer email:', error);
    return NextResponse.json({ error: 'Failed to save reviewer email' }, { status: 500 });
  }
}