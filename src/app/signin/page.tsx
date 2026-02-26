"use client";

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
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
        setError('Login mislukt. Controleer je email en wachtwoord.');
        setLoading(false);
      } else {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Er is een fout opgetreden bij het inloggen.');
      setLoading(false);
    }
  };

  const quickLogin = (loginEmail: string) => {
    setEmail(loginEmail);
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 dark:bg-purple-900/20 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="/elmar-logo.png"
              alt="Elmar Services"
              width={200}
              height={60}
              className="h-12 w-auto"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CSV Portal</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Factuurbeheer Systeem</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-8">
          <h2 className="text-xl font-semibold mb-6 text-slate-900 dark:text-white">Inloggen</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="naam@elmarservices.com"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Wachtwoord</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Voer je wachtwoord in"
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Inloggen...
                </>
              ) : (
                <>
                  Inloggen
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick login hints */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium uppercase tracking-wider">Snel inloggen als:</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => quickLogin('anissa@elmarservices.com')}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Anissa</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">Uploader</span>
                  </div>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">upload</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => quickLogin('brahim@elmarservices.com')}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Brahim</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">Reviewer</span>
                  </div>
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full">review</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          &copy; {new Date().getFullYear()} Elmar Services
        </p>
      </div>
    </div>
  );
}
