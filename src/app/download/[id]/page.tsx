'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, FileText } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function DownloadPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'pdf'>('excel');

  const handleDownload = async () => {
    if (!params.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/download/${params.id}?format=${selectedFormat}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download mislukt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const contentDisposition = response.headers.get('content-disposition');
      let filename = `reviewed_file.${selectedFormat === 'excel' ? 'xlsx' : 'pdf'}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Download mislukt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="card-modern p-10 text-center">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Download className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Download Bestand
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Je bestand is gereviewed en klaar voor download.
            <strong className="block mt-2 text-slate-700 dark:text-slate-300">
              Let op: het bestand wordt automatisch verwijderd na download.
            </strong>
          </p>

          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Kies formaat
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedFormat('excel')}
                className={`p-4 border rounded-xl text-center transition-all ${
                  selectedFormat === 'excel'
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <FileText className="w-7 h-7 mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
                <div className="font-medium text-slate-900 dark:text-white text-sm">Excel</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">.xlsx spreadsheet</div>
              </button>
              <button
                onClick={() => setSelectedFormat('pdf')}
                className={`p-4 border rounded-xl text-center transition-all ${
                  selectedFormat === 'pdf'
                    ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <FileText className="w-7 h-7 mx-auto mb-2 text-red-600 dark:text-red-400" />
                <div className="font-medium text-slate-900 dark:text-white text-sm">PDF</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Portable document</div>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleDownload}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Downloaden...
              </>
            ) : (
              <>
                <Download className="mr-2" size={18} />
                Download {selectedFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
