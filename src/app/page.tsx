'use client';

import Link from 'next/link';
import { Upload, BarChart3, Settings } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            Elmar Services Portal
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Factuur review systeem voor uploaders en reviewers
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Link href="/upload" className="card-modern p-8 hover:shadow-lg transition-shadow group">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Upload</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Upload uw factuur bestand voor review
            </p>
          </Link>

          <Link href="/dashboard" className="card-modern p-8 hover:shadow-lg transition-shadow group">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Dashboard</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Bekijk al uw uploads en reviews
            </p>
          </Link>

          <Link href="/settings" className="card-modern p-8 hover:shadow-lg transition-shadow group">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Settings className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Instellingen</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Configureer email adressen
            </p>
          </Link>
        </div>

        {/* Info Section */}
        <div className="card-modern p-8 max-w-4xl mx-auto mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Hoe werkt het?</h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
              </div>
              <div>
                <p className="font-semibold mb-1">Upload uw bestand</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Uploaders kunnen CSV of Excel bestanden uploaden (1 bestand per keer)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 dark:text-green-400 font-bold">2</span>
              </div>
              <div>
                <p className="font-semibold mb-1">Review proces</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reviewers kunnen het bestand bekijken, filteren, rijen afwijzen en opmerkingen toevoegen</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-600 dark:text-purple-400 font-bold">3</span>
              </div>
              <div>
                <p className="font-semibold mb-1">Download resultaat</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Download het gereviewde bestand als Excel of PDF (bestand wordt automatisch verwijderd)</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
