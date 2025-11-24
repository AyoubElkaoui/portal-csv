'use client';

import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">
          Test Email Verzending
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Test Email Adres:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jouw@email.nl"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={sendTestEmail}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Bezig met verzenden...' : 'Verstuur Test Email'}
          </button>
        </div>

        {result && (
          <div className="mt-6 p-4 rounded-lg border">
            {result.success ? (
              <div className="text-green-600">
                <h3 className="font-semibold flex items-center">
                  <CheckCircle className="mr-2" size={20} />
                  Email verzonden!
                </h3>
                <p className="text-sm mt-2">
                  Van: <strong>{result.from}</strong><br/>
                  Naar: <strong>{result.to}</strong><br/>
                  Email ID: <code className="text-xs bg-gray-100 p-1 rounded">{result.emailId}</code>
                </p>
              </div>
            ) : (
              <div className="text-red-600">
                <h3 className="font-semibold flex items-center">
                  <XCircle className="mr-2" size={20} />
                  Fout bij verzenden
                </h3>
                <p className="text-sm mt-2">{result.error}</p>
                {result.details && (
                  <p className="text-xs text-gray-600 mt-1">{result.details}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <p><strong>Configuratie:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li className="flex items-center">
              API Key: {process.env.NEXT_PUBLIC_RESEND_API_KEY ? (
                <>
                  <CheckCircle className="mr-1 text-green-600" size={14} />
                  Ingesteld
                </>
              ) : (
                <>
                  <XCircle className="mr-1 text-red-600" size={14} />
                  Niet ingesteld
                </>
              )}
            </li>
            <li>From Email: {process.env.NEXT_PUBLIC_FROM_EMAIL || 'onboarding@resend.dev'}</li>
            <li className="flex items-center">
              Domein: akwebsolutions.nl (
              <CheckCircle className="mr-1 text-green-600" size={14} />
              geverifieerd)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}