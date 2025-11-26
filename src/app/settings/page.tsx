'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Home, Settings, Upload } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function SettingsPage() {
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load current reviewer email
    fetch('/api/settings/reviewer-email')
      .then(res => res.json())
      .then(data => {
        if (data.email) {
          setReviewerEmail(data.email);
        }
      })
      .catch(err => console.error('Failed to load reviewer email:', err));
  }, []);

  const handleSave = async () => {
    if (!reviewerEmail || !reviewerEmail.includes('@')) {
      setMessage('Voer een geldig email adres in');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/settings/reviewer-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: reviewerEmail }),
      });

      if (response.ok) {
        setMessage('Reviewer email opgeslagen');
      } else {
        setMessage('Opslaan mislukt');
      }
    } catch (error) {
      console.error('Failed to save reviewer email:', error);
      setMessage('Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
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
              <Link href="/" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center transition-colors">
                <Home className="mr-2" size={18} />
                Home
              </Link>
              <Link href="/upload" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center transition-colors">
                <Upload className="mr-2" size={18} />
                Upload Bestand
              </Link>
              <Link href="/dashboard" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center transition-colors">
                Dashboard
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="card-modern p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Instellingen</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Configureer de systeem instellingen voor het factuurbeheer systeem
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <label htmlFor="reviewerEmail" className="block text-lg font-semibold text-slate-900 dark:text-white mb-3">
                Reviewer Email Adres
              </label>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Dit email adres ontvangt notificaties wanneer nieuwe bestanden worden geupload voor review.
              </p>
              <input
                type="email"
                id="reviewerEmail"
                value={reviewerEmail}
                onChange={(e) => setReviewerEmail(e.target.value)}
                placeholder="reviewer@bedrijf.nl"
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {message && (
              <div className={`p-4 rounded-lg text-center font-medium ${
                message.includes('opgeslagen')
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
              }`}>
                {message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary text-lg py-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Opslaan...' : 'Opslaan'}
              </button>

              <Link
                href="/dashboard"
                className="btn-secondary text-lg py-3 flex items-center justify-center text-center"
              >
                Terug naar Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}