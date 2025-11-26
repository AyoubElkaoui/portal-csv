'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { LoadingSpinner } from '@/components/Skeleton';
import { Navbar } from '@/components/Navbar';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage('Selecteer een bestand.');
      return;
    }
    setUploading(true);
    setMessage('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Upload succesvol!');
        setFile(null);
      } else {
        setMessage('Upload mislukt: ' + data.error);
      }
    } catch {
      setMessage('Er is een fout opgetreden.');
    }
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar />

      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-4">
        <div className="card-modern w-full max-w-lg p-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Upload Bestand</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Selecteer uw CSV of Excel bestand om te uploaden
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Bestand selecteren
              </label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-4 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full btn-primary text-lg py-4 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <LoadingSpinner className="mr-3" size={20} />
                  Bezig met uploaden...
                </>
              ) : (
                <>
                  <Upload className="mr-3" size={20} />
                  Upload Bestand
                </>
              )}
            </button>
          </form>

          {message && (
            <div className={`mt-8 p-4 rounded-lg text-center font-medium ${
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