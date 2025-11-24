'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, BarChart3 } from 'lucide-react';
import { LoadingSpinner } from '@/components/Skeleton';
import { ThemeToggle } from '@/components/ThemeToggle';

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                <Home className="mr-1" size={18} />
                Home
              </Link>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                <BarChart3 className="mr-1" size={18} />
                Dashboard
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>
      <div className="flex items-center justify-center py-12">
        <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-lg border border-gray-200">
          <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">Upload CSV Bestand</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-3">
                Selecteer CSV bestand
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center"
            >
              {uploading ? (
                <>
                  <LoadingSpinner className="mr-2" size={18} />
                  Bezig met uploaden...
                </>
              ) : (
                'Upload'
              )}
            </button>
          </form>
          {message && (
            <p className={`mt-6 text-center font-medium ${message.includes('succesvol') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}