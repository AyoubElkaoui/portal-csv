'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Upload, BarChart3, FileUp } from 'lucide-react';
import { useState } from 'react';
import { LoadingSpinner } from '@/components/Skeleton';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
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
        setMessage('Upload succesvol! Ga naar Dashboard om te controleren.');
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
      {/* Debug: Show current theme */}
      <div className="fixed top-0 left-0 bg-black text-white p-2 text-xs z-50">
        Theme Debug: Check if dark class is applied to html
      </div>
      <header className="bg-white dark:bg-slate-900 shadow-lg border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg mr-4">
                <Image
                  src="/LOGO-ELMAR-766x226-1-400x118-2204245369.png"
                  alt="Elmar Services Logo"
                  width={120}
                  height={37}
                  className="h-9 w-auto brightness-0 invert dark:brightness-100 dark:invert-0"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Elmar Services</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Factuurbeheer Systeem</p>
              </div>
            </div>
            <nav className="flex space-x-8 items-center">
              <Link href="/upload" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center transition-colors">
                <Upload className="mr-2" size={18} />
                Upload Bestand
              </Link>
              <Link href="/dashboard" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center transition-colors">
                <BarChart3 className="mr-2" size={18} />
                Dashboard
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
            Welkom bij het Elmar Services Portal
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-12">
            Beheer eenvoudig uw facturen met onze intuïtieve interface. Upload uw bestanden en review ze professioneel.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/upload" className="btn-primary flex items-center justify-center text-lg px-8 py-4">
              <Upload className="mr-3" size={24} />
              Upload Bestand
            </Link>
            <Link href="/dashboard" className="btn-secondary flex items-center justify-center text-lg px-8 py-4">
              <BarChart3 className="mr-3" size={24} />
              Bekijk Dashboard
            </Link>
          </div>
        </div>

        <div className="card-modern p-12 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Snelle Upload</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Upload uw CSV of Excel bestand om direct te beginnen met het review proces
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Selecteer CSV of Excel bestand
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
                  Upload & Ga naar Dashboard
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
      </main>
    </div>
  );
}
