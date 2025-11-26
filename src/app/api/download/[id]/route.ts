import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditActions } from '@/lib/audit';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'excel'; // Default to excel

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

    // Create audit log
    if (upload.userId) {
      await auditActions.uploadDownloaded(upload.userId, upload.id);
    }

    if (format === 'excel') {
      return generateExcelFile(reviewedData, comments, upload.filename);
    } else if (format === 'pdf') {
      return generatePDFFile(reviewedData, comments, upload.filename);
    } else {
      return NextResponse.json(
        { error: 'Unsupported format' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error downloading upload:', error);
    return NextResponse.json(
      { error: 'Failed to download upload' },
      { status: 500 }
    );
  }
}

function generateExcelFile(reviewedData: Record<string, unknown>[], comments: string, filename: string) {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Prepare data for Excel
  const excelData: (string | number | boolean)[][] = [];

  // Add reviewer comments at the top if any
  if (comments.trim()) {
    excelData.push(['Algemene Reviewer Opmerkingen:']);
    comments.split('\n').forEach(line => {
      excelData.push([line]);
    });
    excelData.push([]); // Empty row
  }

  // Add the reviewed data
  if (reviewedData.length > 0) {
    // Get headers from first row, excluding internal fields, Akkoord/Afgewezen columns, and adding review columns
    const originalHeaders = Object.keys(reviewedData[0]).filter(key =>
      !key.startsWith('_') && !['Akkoord', 'Afgewezen'].includes(key)
    );
    const headers = [...originalHeaders, 'Review_Status', 'Review_Opmerkingen'];
    excelData.push(headers);

    // Add data rows
    reviewedData.forEach((row: Record<string, unknown>) => {
      const originalValues = originalHeaders.map(header => String(row[header] ?? ''));
      const status = row._status === 'issue' ? 'Probleem' : 'Goedgekeurd';
      const rowComments = String(row._comments || '');
      excelData.push([...originalValues, status, rowComments]);
    });

    // Auto-size columns
    const colWidths = headers.map((header: string) => ({ wch: Math.max(header.length, 15) }));
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Reviewed Data');
  } else {
    // Create empty worksheet if no data
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'Reviewed Data');
  }

  // Generate buffer
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  // Return Excel file
  const response = new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="reviewed_${filename.replace('.csv', '')}.xlsx"`,
    },
  });

  return response;
}

function generatePDFFile(reviewedData: Record<string, unknown>[], comments: string, filename: string) {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(16);
  doc.text('Reviewed Data Report', 20, 20);

  // Add filename
  doc.setFontSize(12);
  doc.text(`Source: ${filename}`, 20, 35);

  let yPosition = 50;

  // Add reviewer comments if any
  if (comments.trim()) {
    doc.setFontSize(14);
    doc.text('Algemene Reviewer Opmerkingen:', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    const commentLines = doc.splitTextToSize(comments, 170);
    doc.text(commentLines, 20, yPosition);
    yPosition += commentLines.length * 5 + 10;
  }

  // Add the reviewed data table
  if (reviewedData.length > 0) {
    // Get headers from first row, excluding internal fields, Akkoord/Afgewezen columns, and adding review columns
    const originalHeaders = Object.keys(reviewedData[0]).filter(key =>
      !key.startsWith('_') && !['Akkoord', 'Afgewezen'].includes(key)
    );
    const headers = [...originalHeaders, 'Review Status', 'Review Opmerkingen'];

    // Prepare table data
    const tableData = reviewedData.map((row: Record<string, unknown>) => {
      const originalValues = originalHeaders.map(header => String(row[header] ?? ''));
      const status = row._status === 'issue' ? 'Probleem' : 'Goedgekeurd';
      const rowComments = String(row._comments || '');
      return [...originalValues, status, rowComments];
    });

    // Add table
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [30, 64, 175], // Elmar blue
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Light gray
      },
      margin: { top: 10 },
    });
  }

  // Generate PDF buffer
  const pdfBuffer = doc.output('arraybuffer');

  // Return PDF file
  const response = new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reviewed_${filename.replace('.csv', '')}.pdf"`,
    },
  });

  return response;
}