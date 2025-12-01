import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { auditActions } from '@/lib/audit';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand geüpload' }, { status: 400 });
    }

    // Get client information for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    let parsedData: Record<string, unknown>[] = [];
    let fileType = 'csv';

    // Detect file type and parse accordingly
    if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
      fileType = 'excel';
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { 
          type: 'array',
          cellDates: true  // Convert Excel dates to JavaScript Date objects
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          raw: false  // Ensure numbers are parsed properly
        }) as unknown[][];

        if (jsonData.length === 0) {
          return NextResponse.json({ error: 'Excel bestand is leeg' }, { status: 400 });
        }

        // Convert to object format with first row as headers
        const headers = jsonData[0] as string[];
        parsedData = jsonData.slice(1).map((row) => {
          const obj: Record<string, unknown> = {};
          headers.forEach((header, index) => {
            const value = row[index];
            // Convert Date objects to ISO strings for JSON storage
            if (value instanceof Date) {
              obj[header] = value.toISOString().split('T')[0]; // YYYY-MM-DD format
            } else {
              obj[header] = value || '';
            }
          });
          return obj;
        });
      } catch (error) {
        console.error('Excel parsing error:', error);
        return NextResponse.json({ error: 'Excel bestand kon niet worden gelezen' }, { status: 400 });
      }
    } else {
      // Handle CSV files
      try {
        const fileContent = await file.text();
        const parsed = Papa.parse(fileContent, {
          header: true,
          delimiter: ',',
          skipEmptyLines: true,
          dynamicTyping: true
        });

        if (parsed.errors.length > 0) {
          console.error('CSV parsing errors:', parsed.errors);
          return NextResponse.json({
            error: 'CSV parsing mislukt: ' + parsed.errors.map(e => e.message).join(', ')
          }, { status: 400 });
        }

        parsedData = parsed.data as Record<string, unknown>[];
      } catch (error) {
        console.error('CSV parsing error:', error);
        return NextResponse.json({ error: 'CSV bestand kon niet worden gelezen' }, { status: 400 });
      }
    }

    if (parsedData.length === 0) {
      return NextResponse.json({ error: 'Bestand bevat geen data' }, { status: 400 });
    }

    // Process the data to add titel column if needed
    const processedData = parsedData.map((row) => {
      const processedRow = { ...row };

      // Add titel column after relatie if it doesn't exist
      if (row['relatie'] && !row['titel']) {
        processedRow['titel'] = '';
      }

      return processedRow;
    });

    // Create default uploader user if not exists
    const uploaderId = 'default-uploader';
    await prisma.user.upsert({
      where: { id: uploaderId },
      update: {},
      create: {
        id: uploaderId,
        email: 'elkaoui.a@gmail.com',
        name: 'Default Uploader',
        role: 'uploader',
      },
    });

    // Create upload record - simplified, no sheetNames for now
    const upload = await prisma.upload.create({
      data: {
        userId: uploaderId,
        filename: file.name,
        status: 'uploaded',
        reviewedData: JSON.stringify(processedData),
      },
    });

    // Log the upload action
    await auditActions.uploadCreated(uploaderId, upload.id, file.name, ipAddress, userAgent);

    // Send emails using settings from database
    try {
      // Get email addresses from settings
      const settings = await prisma.settings.findFirst();
      const reviewerEmail = settings?.reviewerEmail || 'info@akwebsolutions.nl';
      const uploaderEmail = settings?.uploaderEmail || 'elkaoui.a@gmail.com';

      // Email to reviewer
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@company.com',
        to: reviewerEmail,
        subject: `Nieuwe ${fileType.toUpperCase()} upload klaar voor review: ${file.name}`,
        html: `
          <h2>Nieuwe ${fileType.toUpperCase()} upload beschikbaar</h2>
          <p>Er is een nieuwe ${fileType.toUpperCase()} upload beschikbaar voor review:</p>
          <ul>
            <li><strong>Bestand:</strong> ${file.name}</li>
            <li><strong>Type:</strong> ${fileType.toUpperCase()}</li>
            <li><strong>Aantal rijen:</strong> ${processedData.length}</li>
            <li><strong>Uploader:</strong> ${uploaderEmail}</li>
            <li><strong>Upload tijd:</strong> ${new Date().toLocaleString('nl-NL')}</li>
          </ul>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/review/${upload.id}">Klik hier om te reviewen</a></p>
        `,
      });

      // Confirmation email to uploader
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@company.com',
        to: uploaderEmail,
        subject: `${fileType.toUpperCase()} upload bevestiging: ${file.name}`,
        html: `
          <h2>${fileType.toUpperCase()} Upload Bevestiging</h2>
          <p>Je ${fileType.toUpperCase()} bestand is succesvol geüpload:</p>
          <ul>
            <li><strong>Bestand:</strong> ${file.name}</li>
            <li><strong>Type:</strong> ${fileType.toUpperCase()}</li>
            <li><strong>Aantal rijen:</strong> ${processedData.length}</li>
            <li><strong>Status:</strong> Wachtend op review</li>
          </ul>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard">Bekijk je uploads</a></p>
        `,
      });

      await auditActions.emailSent(uploaderId, upload.id, reviewerEmail, ipAddress, userAgent);
      await auditActions.emailSent(uploaderId, upload.id, uploaderEmail, ipAddress, userAgent);

    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail upload if email fails
    }

    return NextResponse.json({
      success: true,
      uploadId: upload.id,
      message: `${fileType.toUpperCase()} bestand succesvol geüpload!`,
      fileType: fileType,
      rowCount: processedData.length
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden bij het uploaden'
    }, { status: 500 });
  }
}