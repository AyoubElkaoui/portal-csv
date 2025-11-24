import { NextRequest, NextResponse } from 'next/server';

import Papa from 'papaparse';

import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {

  const formData = await request.formData();

  const file = formData.get('file') as File;

  if (!file) {

    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  }

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

  const upload = await prisma.upload.create({

    data: {

      userId,

      filename: file.name,

    },

  });

  const invoices = parsed.data.map((row) => ({

    uploadId: upload.id,

    factuurnummer: String((row as Record<string, unknown>)[columnMap.factuurnummer] || ''),

    relatienaam: String((row as Record<string, unknown>)[columnMap.relatienaam] || ''),

    factuurdatum: new Date(String((row as Record<string, unknown>)[columnMap.factuurdatum])),

    bedragExcl: parseFloat(String((row as Record<string, unknown>)[columnMap.bedragExcl])) || 0,

    btw: parseFloat(String((row as Record<string, unknown>)[columnMap.btw])) || 0,

    factuurbedrag: parseFloat(String((row as Record<string, unknown>)[columnMap.factuurbedrag])) || 0,

    openstaandeBedrag: parseFloat(String((row as Record<string, unknown>)[columnMap.openstaandeBedrag])) || 0,

    betalingstermijn: parseInt(String((row as Record<string, unknown>)[columnMap.betalingstermijn])) || 0,

    aantalDagenOpen: parseInt(String((row as Record<string, unknown>)[columnMap.aantalDagenOpen] || '0')) || 0,

  }));

  await prisma.invoice.createMany({

    data: invoices,

  });

  return NextResponse.json({ success: true, uploadId: upload.id });

}