'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Settings, Mail, Lock } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [uploaderEmail, setUploaderEmail] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Credential update states
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [credentialMessage, setCredentialMessage] = useState('');
  const [updatingCredentials, setUpdatingCredentials] = useState(false);

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
    
    // Load current user email
    if (session?.user?.email) {
      setNewEmail(session.user.email);
    }
  }, [session]);

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

  const handleCredentialUpdate = async () => {
    setCredentialMessage('');
    
    // Validation
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

    setUpdatingCredentials(true);
    try {
      const response = await fetch('/api/settings/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newEmail !== session?.user?.email ? newEmail : undefined,
          password: newPassword || undefined,
          currentPassword: currentPassword || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCredentialMessage('Login gegevens succesvol bijgewerkt. Log opnieuw in met je nieuwe gegevens.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Sign out after 2 seconds if email or password changed
        if (newEmail !== session?.user?.email || newPassword) {
          setTimeout(() => {
            window.location.href = '/api/auth/signout';
          }, 2000);
        }
      } else {
        setCredentialMessage(data.error || 'Bijwerken mislukt');
      }
    } catch (error) {
      console.error('Failed to update credentials:', error);
      setCredentialMessage('Bijwerken mislukt');
    } finally {
      setUpdatingCredentials(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="card-modern p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Settings className="w-6 h-6 text-blue-700 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Instellingen</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Email notificaties en account configureren
            </p>
          </div>

          <div className="space-y-6">
            {/* Login Credentials Section */}
            <div className="pb-6 border-b-2 border-slate-200 dark:border-slate-600">
              <div className="flex items-center mb-4">
                <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Mijn Login Gegevens
                </h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                Wijzig je email en wachtwoord voor inloggen
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="newEmail" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Email Adres
                  </label>
                  <input
                    type="email"
                    id="newEmail"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="jouw@email.nl"
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Huidig Wachtwoord (optioneel)
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Nieuw Wachtwoord (laat leeg om niet te wijzigen)
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Bevestig Nieuw Wachtwoord
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {credentialMessage && (
                  <div className={`p-3 rounded-md text-sm font-medium ${
                    credentialMessage.includes('succesvol')
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
                  }`}>
                    {credentialMessage}
                  </div>
                )}

                <button
                  onClick={handleCredentialUpdate}
                  disabled={updatingCredentials}
                  className="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingCredentials ? 'Bijwerken...' : 'Login Gegevens Bijwerken'}
                </button>
              </div>
            </div>

            {/* Email Notifications Section */}
            <div className="pb-6 border-b-2 border-slate-200 dark:border-slate-600">
              <div className="flex items-center mb-4">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Email Notificaties
                </h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                Configureer waar notificaties naartoe gestuurd worden
              </p>
            </div>

            <div className="pb-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center mb-3">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <label htmlFor="uploaderEmail" className="block text-sm font-medium text-slate-900 dark:text-white">
                  Uploader Email (Anissa)
                </label>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                Ontvangt notificatie wanneer review voltooid is
              </p>
              <input
                type="email"
                id="uploaderEmail"
                value={uploaderEmail}
                onChange={(e) => setUploaderEmail(e.target.value)}
                placeholder="anissa@bedrijf.nl"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="pb-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center mb-3">
                <Mail className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                <label htmlFor="reviewerEmail" className="block text-sm font-medium text-slate-900 dark:text-white">
                  Reviewer Email
                </label>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                Ontvangt notificatie bij nieuwe uploads
              </p>
              <input
                type="email"
                id="reviewerEmail"
                value={reviewerEmail}
                onChange={(e) => setReviewerEmail(e.target.value)}
                placeholder="reviewer@bedrijf.nl"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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