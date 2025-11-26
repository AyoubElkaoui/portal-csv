'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Home, Upload, BarChart3, Settings, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Navbar() {
  const { data: session, status } = useSession();

  const isUploader = session?.user?.role === 'uploader';
  const isAuthenticated = status === 'authenticated';

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/signin' });
  };

  return (
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
            {isUploader && (
              <Link href="/upload" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center transition-colors">
                <Upload className="mr-2" size={18} />
                Upload Bestand
              </Link>
            )}
            {isAuthenticated && (
              <Link href="/dashboard" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center transition-colors">
                <BarChart3 className="mr-2" size={18} />
                Dashboard
              </Link>
            )}
            {isUploader && (
              <Link href="/settings" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center transition-colors">
                <Settings className="mr-2" size={18} />
                Instellingen
              </Link>
            )}
            <ThemeToggle />
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-medium flex items-center transition-colors"
                title="Uitloggen"
              >
                <LogOut className="mr-2" size={18} />
                Uitloggen
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}