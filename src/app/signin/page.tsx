"use client";

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't show signin form if already authenticated
  if (status === 'authenticated') {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password
      });

      if (result?.error) {
        setError('Login mislukt. Controleer je gegevens.');
        setLoading(false);
      } else {
        // Authentication successful, redirect immediately
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Er is een fout opgetreden bij het inloggen.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">Inloggen</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">Wachtwoord</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Inloggen...' : 'Inloggen'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
