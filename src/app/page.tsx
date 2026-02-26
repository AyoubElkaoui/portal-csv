'use client';

import Link from 'next/link';
import { Upload, BarChart3, Settings, ArrowRight, Shield, Clock, FileText } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 text-sm font-medium mb-6">
            Factuur Review Platform
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
            Elmar Services Portal
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Upload, review en beheer factuurbestanden in een centraal platform.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-20">
          <Link href="/upload" className="group card-modern p-8 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center mb-5 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
              <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Upload</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Upload factuurbestanden voor review
            </p>
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              Bestand uploaden <ArrowRight size={14} />
            </span>
          </Link>

          <Link href="/dashboard" className="group card-modern p-8 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center mb-5 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors">
              <BarChart3 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Dashboard</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Bekijk uploads en reviews
            </p>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              Openen <ArrowRight size={14} />
            </span>
          </Link>

          <Link href="/settings" className="group card-modern p-8 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-5 group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors">
              <Settings className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Instellingen</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Configureer email en account
            </p>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              Configureren <ArrowRight size={14} />
            </span>
          </Link>
        </div>

        {/* How it works */}
        <div className="card-modern p-10 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Hoe werkt het?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-start">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">1. Upload</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Upload CSV of Excel bestanden. Maximaal 5 bestanden tegelijk.
              </p>
            </div>
            <div className="flex flex-col items-start">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">2. Review</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                De reviewer beoordeelt elke factuur, markeert problemen en voegt opmerkingen toe.
              </p>
            </div>
            <div className="flex flex-col items-start">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">3. Download</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Download het gereviewde bestand als Excel of PDF. Automatische opschoning na download.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
