import { NextRequest, NextResponse } from 'next/server';
import { getUpload, getUploadData, deleteUpload } from '@/lib/storage';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function calculateDaysOpen(row: Record<string, unknown>) {
  const invoiceDate = row['Factuurdatum'] || row['factuurdatum'];
  const paymentTerm = row['Betalingstermijn'] || row['betalingstermijn'] || row['Termijn'] || row['termijn'];

  if (!invoiceDate || !paymentTerm) return null;

  try {
    const invoiceDateObj = new Date(invoiceDate as string);
    const currentDate = new Date();
    const paymentTermDays = parseInt(paymentTerm as string);

    if (isNaN(paymentTermDays)) return null;

    // Calculate due date
    const dueDate = new Date(invoiceDateObj);
    dueDate.setDate(dueDate.getDate() + paymentTermDays);

    // Calculate days remaining until due date (positive) or days overdue (negative)
    const timeDiff = dueDate.getTime() - currentDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return daysDiff;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'excel';

    const upload = await getUpload(id);

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

    // Get the reviewed data
    const reviewedData = await getUploadData(id);
    const comments = upload.comments || '';

    // Delete the upload after download (automatic cleanup)
    await deleteUpload(id);

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
    // Get headers from first row, excluding internal fields, Akkoord/Afgewezen columns, and unwanted columns
    const originalHeaders = Object.keys(reviewedData[0]).filter(key =>
      !key.startsWith('_') && !['Akkoord', 'Afgewezen', 'Achterstallige dagen', 'Aantal dagen open'].includes(key)
    );
    const headers = [...originalHeaders, 'Dagen open', 'Review_Status', 'Review_Opmerkingen'];
    excelData.push(headers);

    // Add data rows
    reviewedData.forEach((row: Record<string, unknown>) => {
      const originalValues = originalHeaders.map(header => String(row[header] ?? ''));

      // Calculate days open using the same logic as review page
      const daysOpen = calculateDaysOpen(row);
      const daysOpenStr = daysOpen !== null ? (daysOpen > 0 ? `+${daysOpen}` : daysOpen.toString()) : '-';

      const status = row._status === 'issue' ? 'Probleem' : 'Goedgekeurd';
      const rowComments = String(row._comments || '');
      excelData.push([...originalValues, daysOpenStr, status, rowComments]);
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
  const doc = new jsPDF('landscape');

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
    const commentLines = doc.splitTextToSize(comments, 250); // Wider for landscape
    doc.text(commentLines, 20, yPosition);
    yPosition += commentLines.length * 5 + 10;
  }

  // Add the reviewed data table
  if (reviewedData.length > 0) {
    // Get headers from first row, excluding internal fields, Akkoord/Afgewezen columns, and unwanted columns
    const originalHeaders = Object.keys(reviewedData[0]).filter(key =>
      !key.startsWith('_') && !['Akkoord', 'Afgewezen', 'Achterstallige dagen', 'Aantal dagen open'].includes(key)
    );
    const headers = [...originalHeaders, 'Dagen open', 'Review Status', 'Review Opmerkingen'];

    // Prepare table data
    const tableData = reviewedData.map((row: Record<string, unknown>) => {
      const originalValues = originalHeaders.map(header => String(row[header] ?? ''));

      // Calculate days open using the same logic as review page
      const daysOpen = calculateDaysOpen(row);
      const daysOpenStr = daysOpen !== null ? (daysOpen > 0 ? `+${daysOpen}` : daysOpen.toString()) : '-';

      const status = row._status === 'issue' ? 'Probleem' : 'Goedgekeurd';
      const rowComments = String(row._comments || '');
      return [...originalValues, daysOpenStr, status, rowComments];
    });

    // Add table
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 7, // Smaller font for landscape
        cellPadding: 1,
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
      columnStyles: {
        [headers.length - 3]: { cellWidth: 20 }, // Dagen open column
        [headers.length - 2]: { cellWidth: 25 }, // Review Status column
        [headers.length - 1]: { cellWidth: 40 }, // Review Opmerkingen column
      },
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