'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Home, Upload, BarChart3, Settings, LogOut, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Navbar() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isUploader = session?.user?.role === 'uploader';
  const isReviewer = session?.user?.role === 'reviewer';
  const isAuthenticated = status === 'authenticated';

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await signOut({ callbackUrl: '/signin' });
  };

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center" onClick={closeMobile}>
            <div className="mr-3">
              <Image
                src="/elmar-logo.png"
                alt="Elmar Services Logo"
                width={200}
                height={60}
                className="h-9 w-auto"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">CSV Portal</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Factuurbeheer Systeem</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" className="px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium flex items-center transition-all text-sm">
              <Home className="mr-1.5" size={16} />
              Home
            </Link>
            {isUploader && (
              <Link href="/upload" className="px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium flex items-center transition-all text-sm">
                <Upload className="mr-1.5" size={16} />
                Upload
              </Link>
            )}
            {isAuthenticated && (
              <Link href="/dashboard" className="px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium flex items-center transition-all text-sm">
                <BarChart3 className="mr-1.5" size={16} />
                Dashboard
              </Link>
            )}
            {isUploader && (
              <Link href="/settings" className="px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium flex items-center transition-all text-sm">
                <Settings className="mr-1.5" size={16} />
                Instellingen
              </Link>
            )}

            <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1"></div>

            {isAuthenticated && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  {session?.user?.name || session?.user?.email}
                  {isReviewer && <span className="ml-1 text-blue-600 dark:text-blue-400">(reviewer)</span>}
                  {isUploader && <span className="ml-1 text-blue-600 dark:text-blue-400">(uploader)</span>}
                </span>
              </div>
            )}

            <ThemeToggle />

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium flex items-center transition-all text-sm"
                title="Uitloggen"
              >
                <LogOut className="mr-1.5" size={16} />
                Uitloggen
              </button>
            )}
          </nav>

          {/* Mobile: Theme toggle + Hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="px-4 py-3 space-y-1">
            {isAuthenticated && (
              <div className="px-3 py-2 mb-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg">
                Ingelogd als <strong className="text-slate-900 dark:text-white">{session?.user?.name || session?.user?.email}</strong>
                {isReviewer && <span className="ml-1 text-blue-600 dark:text-blue-400">(reviewer)</span>}
                {isUploader && <span className="ml-1 text-blue-600 dark:text-blue-400">(uploader)</span>}
              </div>
            )}

            <Link href="/" onClick={closeMobile} className="flex items-center px-3 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 transition-all">
              <Home className="mr-3" size={18} />
              Home
            </Link>
            {isUploader && (
              <Link href="/upload" onClick={closeMobile} className="flex items-center px-3 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 transition-all">
                <Upload className="mr-3" size={18} />
                Upload Bestand
              </Link>
            )}
            {isAuthenticated && (
              <Link href="/dashboard" onClick={closeMobile} className="flex items-center px-3 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 transition-all">
                <BarChart3 className="mr-3" size={18} />
                Dashboard
              </Link>
            )}
            {isUploader && (
              <Link href="/settings" onClick={closeMobile} className="flex items-center px-3 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 transition-all">
                <Settings className="mr-3" size={18} />
                Instellingen
              </Link>
            )}
            {isAuthenticated && (
              <>
                <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <LogOut className="mr-3" size={18} />
                  Uitloggen
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
