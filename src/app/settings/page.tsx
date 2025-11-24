'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Home, Settings, Upload } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
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
            <nav className="flex space-x-6">
              <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                <Home className="mr-1" size={18} />
                Home
              </Link>
              <Link href="/upload" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                <Upload className="mr-1" size={18} />
                Upload CSV
              </Link>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <Settings className="mr-3" size={24} />
            <h1 className="text-2xl font-bold">Instellingen</h1>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="reviewerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Reviewer Email Adres
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Dit email adres ontvangt notificaties wanneer nieuwe CSV bestanden worden geupload voor review.
              </p>
              <input
                type="email"
                id="reviewerEmail"
                value={reviewerEmail}
                onChange={(e) => setReviewerEmail(e.target.value)}
                placeholder="reviewer@bedrijf.nl"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {message && (
              <div className={`p-3 rounded-md ${message.includes('opgeslagen') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Opslaan...' : 'Opslaan'}
              </button>

              <Link
                href="/dashboard"
                className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 inline-block"
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