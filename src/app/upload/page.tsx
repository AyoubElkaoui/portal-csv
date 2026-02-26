'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '@/components/Skeleton';
import { Navbar } from '@/components/Navbar';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [canUpload, setCanUpload] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Check if user has any pending uploads
    const checkUploadStatus = async () => {
      try {
        const res = await fetch('/api/uploads');
        if (res.ok) {
          const uploads = await res.json();
          // API already returns only user's own uploads
          // User can upload up to 5 files at a time
          setCanUpload(uploads.length < 5);
        }
      } catch (error) {
        console.error('Error checking upload status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkUploadStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setMessage('Selecteer minimaal één bestand.');
      return;
    }
    if (!canUpload) {
      setMessage('Je hebt het maximum aantal bestanden (5) bereikt. Download eerst een bestand voordat je een nieuw bestand upload.');
      return;
    }
    
    setUploading(true);
    setMessage('Bestanden verwerken...');
    setUploadProgress({});

    try {
      let successCount = 0;
      let failCount = 0;

      // Process each file sequentially
      for (const file of files) {
        try {
          setUploadProgress(prev => ({ ...prev, [file.name]: 'Verwerken...' }));

          let parsedData: Record<string, unknown>[] = [];
          let fileType = 'csv';

          // Parse bestand client-side
          if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        fileType = 'excel';
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { 
          type: 'array',
          cellDates: true
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          raw: false
        }) as unknown[][];

        if (jsonData.length === 0) {
          setUploadProgress(prev => ({ ...prev, [file.name]: 'Bestand is leeg' }));
          failCount++;
          continue;
        }

        // Convert to object format
        const headers = jsonData[0] as string[];
        parsedData = jsonData.slice(1).map((row) => {
          const obj: Record<string, unknown> = {};
          headers.forEach((header, index) => {
            const value = row[index];
            if (value instanceof Date) {
              obj[header] = value.toISOString().split('T')[0];
            } else {
              obj[header] = value || '';
            }
          });
          return obj;
        });
      } else {
        // CSV parsing
        const fileContent = await file.text();
        const parsed = Papa.parse(fileContent, {
          header: true,
          delimiter: ',',
          skipEmptyLines: true,
          dynamicTyping: true
        });

        if (parsed.errors.length > 0) {
          setUploadProgress(prev => ({ ...prev, [file.name]: 'Parsing fout' }));
          failCount++;
          continue;
        }

        parsedData = parsed.data as Record<string, unknown>[];
      }

      if (parsedData.length === 0) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 'Geen data' }));
        failCount++;
        continue;
      }

      setUploadProgress(prev => ({ ...prev, [file.name]: 'Uploaden...' }));

      // Stuur alleen geparsede data naar API (niet het hele bestand!)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          fileType: fileType,
          data: parsedData
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 'Succesvol' }));
        successCount++;
      } else {
        setUploadProgress(prev => ({ ...prev, [file.name]: 'Mislukt:' + data.error }));
        failCount++;
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(prev => ({ ...prev, [file.name]: 'Fout bij verwerken' }));
      failCount++;
    }
  }

  // Show final message
  if (successCount > 0 && failCount === 0) {
    setMessage(`Alle ${successCount} bestand(en) succesvol geüpload! Je wordt doorgestuurd...`);
    setFiles([]);
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  } else if (successCount > 0 && failCount > 0) {
    setMessage(`${successCount} bestand(en) succesvol, ${failCount} mislukt. Bekijk de details hieronder.`);
  } else {
    setMessage('Alle uploads zijn mislukt. Probeer het opnieuw.');
  }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('Er is een fout opgetreden bij het verwerken van de bestanden.');
    }
    
    setUploading(false);
  };  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size={40} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="card-modern p-8">
          <div className="text-center mb-8">
            <div className={`w-14 h-14 ${canUpload ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-amber-50 dark:bg-amber-900/20'} rounded-xl flex items-center justify-center mx-auto mb-5`}>
              {canUpload ? (
                <Upload className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {canUpload ? 'Upload Bestand' : 'Upload Geblokkeerd'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {canUpload
                ? 'Selecteer je CSV of Excel bestand om te uploaden (max 5 bestanden tegelijk)'
                : 'Je hebt het maximum aantal bestanden (5) bereikt'
              }
            </p>
          </div>

          {!canUpload && (
            <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                    Upload geblokkeerd
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">
                    Maximum aantal bestanden (5) bereikt. Download eerst een bestand voordat je een nieuw bestand kunt uploaden.
                  </p>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Ga naar Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">
                Bestand selecteren
              </label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                disabled={!canUpload}
                className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 dark:file:bg-indigo-900/20 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Selecteer een of meerdere bestanden (max 5) — CSV (.csv) of Excel (.xlsx, .xls)
              </p>
              {files.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {files.length} bestand(en) geselecteerd:
                  </p>
                  {files.map((f, i) => (
                    <p key={i} className="text-xs text-slate-600 dark:text-slate-400 pl-2">
                      {f.name}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={files.length === 0 || uploading || !canUpload}
              className="w-full btn-primary py-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <LoadingSpinner className="mr-2" size={18} />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2" size={18} />
                  Upload {files.length > 0 ? `${files.length} Bestand${files.length > 1 ? 'en' : ''}` : 'Bestanden'}
                </>
              )}
            </button>

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Upload status:</p>
                {Object.entries(uploadProgress).map(([filename, status]) => (
                  <div key={filename} className="text-sm pl-2 flex items-start gap-2">
                    <span className="text-slate-800 dark:text-slate-200">{filename}:</span>
                    <span className={status.includes('Succesvol') ? 'text-emerald-600 dark:text-emerald-400' : status.includes('Mislukt') || status.includes('Fout') || status.includes('leeg') || status.includes('fout') || status.includes('data') ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </form>

          {message && (
            <div className={`mt-6 p-3 rounded-md text-sm font-medium ${
              message.includes('succesvol')
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}