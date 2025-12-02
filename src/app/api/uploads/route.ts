import { NextResponse } from 'next/server';
import { getAllUploads } from '@/lib/storage';

export async function GET() {
  try {
    const uploads = await getAllUploads();
    // Sort by uploadedAt descending
    const sorted = uploads.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return NextResponse.json(sorted);
  } catch (error) {
    console.error('Error fetching uploads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch uploads' },
      { status: 500 }
    );
  }
}