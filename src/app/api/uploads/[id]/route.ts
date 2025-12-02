import { NextRequest, NextResponse } from 'next/server';
import { getUpload, getUploadData, deleteUpload } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const upload = await getUpload(id);

    if (!upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }

    return NextResponse.json(upload);
  } catch (error) {
    console.error('Failed to fetch upload:', error);
    return NextResponse.json({ error: 'Failed to fetch upload' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const upload = await getUpload(id);

    if (!upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }

    await deleteUpload(id);

    return NextResponse.json({ success: true, message: 'Upload deleted successfully' });
  } catch (error) {
    console.error('Failed to delete upload:', error);
    return NextResponse.json({ error: 'Failed to delete upload' }, { status: 500 });
  }
}