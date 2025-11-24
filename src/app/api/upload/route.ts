import { NextRequest, NextResponse } from 'next/server';

import Papa from 'papaparse';

import { prisma } from '@/lib/prisma';
import { auditActions } from '@/lib/audit';

interface InvoiceData {
  uploadId: string;
  factuurnummer: string;
  relatienaam: string;
  factuurdatum: Date;
  bedragExcl: number;
  btw: number;
  factuurbedrag: number;
  openstaandeBedrag: number;
  betalingstermijn: number;
  aantalDagenOpen: number;
}

export async function POST(request: NextRequest) {

  const formData = await request.formData();

  const file = formData.get('file') as File;

  if (!file) {

    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  }

  // Get client information for audit logging
  const ipAddress = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  const fileContent = await file.text();

  console.log('File content preview:', fileContent.substring(0, 200));

  const parsed = Papa.parse(fileContent, { header: true, delimiter: ',', skipEmptyLines: true });

  if (parsed.errors.length > 0) {

    console.error('CSV parsing errors:', parsed.errors);

    return NextResponse.json({ error: 'CSV parsing failed: ' + parsed.errors.map(e => e.message).join(', ') }, { status: 400 });

  }

  if (parsed.data.length === 0) {

    return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });

  }

  // Check required columns - try different spellings

  const possibleColumns = {

    factuurnummer: ['Factuurnummmer', 'Factuurnummer'],

    relatienaam: ['Relatienaam'],

    factuurdatum: ['Factuurdatum'],

    bedragExcl: ['Bedrag Excl.'],

    btw: ['BTW'],

    factuurbedrag: ['Factuurdebdrag', 'Factuurbedrag'],

    openstaandeBedrag: ['Openstaande bedrag'],

    betalingstermijn: ['Betalingstermijn'],

    aantalDagenOpen: ['Aantal dagen open', 'Aantal dagen open ', 'Aantal dagen open', 'aantal dagen open', 'Aantal dagen open', 'Aantal dagen open', 'Aantal dagen open.', 'Aantal dagen open'],

  };

  const headers = Object.keys(parsed.data[0] as Record<string, unknown>);

  console.log('Headers found:', headers);

  const missingColumns: string[] = [];

  const columnMap: Record<string, string> = {};

  for (const [key, possibles] of Object.entries(possibleColumns)) {

    const found = possibles.find(p => headers.includes(p));

    if (found) {

      columnMap[key] = found;

    } else if (key !== 'aantalDagenOpen') {  // Make aantalDagenOpen optional

      missingColumns.push(key);

    }

  }

  if (missingColumns.length > 0) {

    return NextResponse.json({ error: 'Missing required columns: ' + missingColumns.join(', ') }, { status: 400 });

  }

  // Assume userId is null for now
  const userId = null;

  let upload;
  try {
    upload = await prisma.upload.create({
      data: {
        userId,
        filename: file.name,
      },
    });
  } catch (error) {
    console.error('Failed to create upload record:', error);
    return NextResponse.json({ error: 'Failed to create upload record' }, { status: 500 });
  }

  const invoices: InvoiceData[] = parsed.data.map((row) => {
    try {
      const factuurdatumStr = String((row as Record<string, unknown>)[columnMap.factuurdatum] || '');
      const factuurdatum = factuurdatumStr ? new Date(factuurdatumStr) : new Date();

      // Validate the date
      if (isNaN(factuurdatum.getTime())) {
        console.warn('Invalid date format for row:', row);
        // Use current date as fallback
      }

      return {
        uploadId: upload.id,
        factuurnummer: String((row as Record<string, unknown>)[columnMap.factuurnummer] || ''),
        relatienaam: String((row as Record<string, unknown>)[columnMap.relatienaam] || ''),
        factuurdatum: factuurdatum,
        bedragExcl: parseFloat(String((row as Record<string, unknown>)[columnMap.bedragExcl])) || 0,
        btw: parseFloat(String((row as Record<string, unknown>)[columnMap.btw])) || 0,
        factuurbedrag: parseFloat(String((row as Record<string, unknown>)[columnMap.factuurbedrag])) || 0,
        openstaandeBedrag: parseFloat(String((row as Record<string, unknown>)[columnMap.openstaandeBedrag])) || 0,
        betalingstermijn: parseInt(String((row as Record<string, unknown>)[columnMap.betalingstermijn])) || 0,
        aantalDagenOpen: parseInt(String((row as Record<string, unknown>)[columnMap.aantalDagenOpen] || '0')) || 0,
      };
    } catch (error) {
      console.error('Error processing row:', row, error);
      // Return a default invoice object for this row
      return {
        uploadId: upload.id,
        factuurnummer: 'ERROR',
        relatienaam: 'ERROR',
        factuurdatum: new Date(),
        bedragExcl: 0,
        btw: 0,
        factuurbedrag: 0,
        openstaandeBedrag: 0,
        betalingstermijn: 0,
        aantalDagenOpen: 0,
      } as InvoiceData;
    }
  });

  let validInvoices: InvoiceData[] = [];
  try {
    validInvoices = invoices.filter((invoice) => invoice.factuurnummer !== 'ERROR');
    if (validInvoices.length === 0) {
      // If no valid invoices, still create the upload but with empty invoice list
      console.warn('No valid invoices found in CSV');
    } else {
      await prisma.invoice.createMany({
        data: validInvoices,
      });
    }
  } catch (error) {
    console.error('Failed to create invoice records:', error);
    // Try to clean up the upload record
    try {
      await prisma.upload.delete({ where: { id: upload.id } });
    } catch (cleanupError) {
      console.error('Failed to cleanup upload record:', cleanupError);
    }
    return NextResponse.json({ error: 'Failed to process invoice data' }, { status: 500 });
  }

  // Log the upload action
  await auditActions.uploadCreated('system', upload.id, file.name, validInvoices.length, ipAddress, userAgent);

  return NextResponse.json({ success: true, uploadId: upload.id });

}