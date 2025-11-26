'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, XCircle, Home, Upload, Mail } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface EmailResult {
  success?: boolean;
  message?: string;
  from?: string;
  to?: string;
  emailId?: string;
  error?: string;
  details?: string;
}

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailResult | null>(null);

  const sendTestEmail = async () => {
    if (!email.trim()) {
      alert('Voer een email adres in');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email.trim() }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Netwerk fout', details: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
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

      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-4">
        <div className="card-modern w-full max-w-lg p-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Test Email Verzending</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Test de email configuratie door een test email te verzenden
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-slate-900 dark:text-white mb-3">
                Test Email Adres
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jouw@email.nl"
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <button
              onClick={sendTestEmail}
              disabled={loading}
              className="w-full btn-primary text-lg py-4 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Bezig met verzenden...' : 'Verstuur Test Email'}
            </button>
          </div>

          {result && (
            <div className={`mt-8 p-6 rounded-lg border ${
              result.success
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              {result.success ? (
                <div className="text-green-800 dark:text-green-400">
                  <h3 className="font-semibold flex items-center text-lg mb-3">
                    <CheckCircle className="mr-3" size={24} />
                    Email verzonden!
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Van:</strong> {result.from}</p>
                    <p><strong>Naar:</strong> {result.to}</p>
                    <p><strong>Email ID:</strong> <code className="bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded text-xs">{result.emailId}</code></p>
                  </div>
                </div>
              ) : (
                <div className="text-red-800 dark:text-red-400">
                  <h3 className="font-semibold flex items-center text-lg mb-3">
                    <XCircle className="mr-3" size={24} />
                    Fout bij verzenden
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Fout:</strong> {result.error}</p>
                    {result.details && <p><strong>Details:</strong> {result.details}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Email Configuratie
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">API Key:</span>
                {process.env.NEXT_PUBLIC_RESEND_API_KEY ? (
                  <span className="flex items-center text-green-600 dark:text-green-400">
                    <CheckCircle className="mr-1" size={16} />
                    Ingesteld
                  </span>
                ) : (
                  <span className="flex items-center text-red-600 dark:text-red-400">
                    <XCircle className="mr-1" size={16} />
                    Niet ingesteld
                  </span>
                )}
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">From Email:</span>
                <span className="text-slate-900 dark:text-white font-mono text-xs">
                  {process.env.NEXT_PUBLIC_FROM_EMAIL || 'onboarding@resend.dev'}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">Domein:</span>
                <span className="flex items-center text-green-600 dark:text-green-400">
                  <CheckCircle className="mr-1" size={16} />
                  akwebsolutions.nl
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}