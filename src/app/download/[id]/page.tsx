'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Home, Download, FileText, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

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
        throw new Error(errorData.error || 'Download failed');
      }

      // Create a blob from the response
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Get filename from content-disposition header
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

      // Redirect back to dashboard after successful download
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-full px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Image
                src="/LOGO-ELMAR-766x226-1-400x118-2204245369.png"
                alt="Elmar Services Logo"
                width={120}
                height={37}
                className="h-9 w-auto"
              />
            </div>
            <nav className="flex space-x-6 items-center">
              <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center">
                <Home className="mr-1" size={18} />
                Home
              </Link>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center">
                <ArrowLeft className="mr-1" size={18} />
                Back to Dashboard
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="card-modern">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
              <Download className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Download Gereviewed Bestand
            </h1>

            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Je bestand is gereviewed en klaar voor download. 
              <strong className="block mt-2 text-gray-900 dark:text-white">
                Let op: Het bestand wordt automatisch verwijderd zodra je het hebt gedownload.
              </strong>
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Kies je download formaat
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
                <button
                  onClick={() => setSelectedFormat('excel')}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    selectedFormat === 'excel'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <FileText className="w-8 h-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                  <div className="font-medium text-gray-900 dark:text-white">Excel</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">.xlsx spreadsheet</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Bewerkbaar formaat</div>
                </button>
                <button
                  onClick={() => setSelectedFormat('pdf')}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    selectedFormat === 'pdf'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <FileText className="w-8 h-8 mx-auto mb-2 text-red-600 dark:text-red-400" />
                  <div className="font-medium text-gray-900 dark:text-white">PDF</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Portable document</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Clean & professioneel</div>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-red-500 dark:text-red-400 mr-2" />
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
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
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2" size={20} />
                  Download {selectedFormat.toUpperCase()}
                </>
              )}
            </button>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              After downloading, the original upload data will be automatically deleted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}