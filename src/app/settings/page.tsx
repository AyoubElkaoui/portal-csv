'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [uploaderEmail, setUploaderEmail] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load current emails
    fetch('/api/settings/reviewer-email')
      .then(res => res.json())
      .then(data => {
        if (data.uploaderEmail) {
          setUploaderEmail(data.uploaderEmail);
        }
        if (data.reviewerEmail) {
          setReviewerEmail(data.reviewerEmail);
        }
      })
      .catch(err => console.error('Failed to load settings:', err));
  }, []);

  const handleSave = async () => {
    if (!uploaderEmail || !uploaderEmail.includes('@')) {
      setMessage('Voer een geldig uploader email adres in');
      return;
    }
    if (!reviewerEmail || !reviewerEmail.includes('@')) {
      setMessage('Voer een geldig reviewer email adres in');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/settings/reviewer-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uploaderEmail, reviewerEmail }),
      });

      if (response.ok) {
        setMessage('Email adressen succesvol opgeslagen');
      } else {
        setMessage('Opslaan mislukt');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage('Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };
    if (newPassword && newPassword !== confirmPassword) {
      setCredentialMessage('Wachtwoorden komen niet overeen');
      return;
    }
    
    if (newPassword && newPassword.length < 6) {
      setCredentialMessage('Wachtwoord moet minimaal 6 karakters zijn');
      return;
    }
    
    if (!newEmail || !newEmail.includes('@')) {
      setCredentialMessage('Voer een geldig email adres in');
      return;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="card-modern p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Email Instellingen</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Configureer waar notificaties naartoe gestuurd worden
            </p>
          </div>

          <div className="space-y-6">

            <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-3">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <label htmlFor="uploaderEmail" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Uploader Email (Anissa)
                </label>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                Ontvangt notificatie wanneer review voltooid is
              </p>
              <input
                type="email"
                id="uploaderEmail"
                value={uploaderEmail}
                onChange={(e) => setUploaderEmail(e.target.value)}
                placeholder="anissa@bedrijf.nl"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-3">
                <Mail className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                <label htmlFor="reviewerEmail" className="block text-sm font-medium text-gray-900 dark:text-white">
                  Reviewer Email
                </label>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                Ontvangt notificatie bij nieuwe uploads
              </p>
              <input
                type="email"
                id="reviewerEmail"
                value={reviewerEmail}
                onChange={(e) => setReviewerEmail(e.target.value)}
                placeholder="reviewer@bedrijf.nl"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            {message && (
              <div className={`p-3 rounded-md text-sm font-medium ${
                message.includes('succesvol')
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
              }`}>
                {message}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Opslaan...' : 'Opslaan'}
              </button>

              <Link
                href="/dashboard"
                className="flex-1 btn-secondary py-2.5 text-center"
              >
                Annuleren
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}