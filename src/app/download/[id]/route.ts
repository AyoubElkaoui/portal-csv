import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditActions } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const upload = await prisma.upload.findUnique({
      where: { id },
      select: {
        id: true,
        filename: true,
        status: true,
        reviewedData: true,
        comments: true,
        userId: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!upload) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      );
    }

    if (upload.status !== 'reviewed') {
      return NextResponse.json(
        { error: 'Upload is not yet reviewed' },
        { status: 400 }
      );
    }

    // Parse the reviewed data and comments
    const reviewedData = JSON.parse(upload.reviewedData || '[]');
    const comments = upload.comments || '';

    // Create CSV content with reviewer comments
    let csvContent = '';

    // Add reviewer comments at the top if any
    if (comments.trim()) {
      csvContent += `# Algemene Reviewer Opmerkingen:\n# ${comments.replace(/\n/g, '\n# ')}\n\n`;
    }

    // Add the reviewed data
    if (reviewedData.length > 0) {
      // Get headers from first row, excluding internal fields, Akkoord/Afgewezen columns, and adding review columns
      const originalHeaders = Object.keys(reviewedData[0]).filter(key =>
        !key.startsWith('_') && !['Akkoord', 'Afgewezen'].includes(key)
      );
      const headers = [...originalHeaders, 'Review_Status', 'Review_Opmerkingen'];
      csvContent += headers.join(',') + '\n';

      // Add data rows
      reviewedData.forEach((row: Record<string, string | number | boolean | null>) => {
        const originalValues = originalHeaders.map(header => {
          const value = String(row[header] ?? '');
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return '"' + value.replace(/"/g, '""') + '"';
          }
          return value;
        });

        const status = row._status === 'issue' ? 'Probleem' : 'Goedgekeurd';
        const rowComments = String(row._comments || '');

        // Escape row comments if needed
        const escapedComments = rowComments.includes(',') || rowComments.includes('"') || rowComments.includes('\n')
          ? '"' + rowComments.replace(/"/g, '""') + '"'
          : rowComments;

        csvContent += [...originalValues, status, escapedComments].join(',') + '\n';
      });
    }

    // Create audit log
    if (upload.userId) {
      await auditActions.uploadDownloaded(upload.userId, upload.id);
    }

    // Return CSV file
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="reviewed_${upload.filename}"`,
      },
    });

    return response;
  } catch (error) {
    console.error('Error downloading upload:', error);
    return NextResponse.json(
      { error: 'Failed to download upload' },
      { status: 500 }
    );
  }
}