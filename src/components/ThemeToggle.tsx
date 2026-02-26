'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, actualTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
        title="Thema wisselen"
      >
        <Monitor size={18} />
      </button>
    );
  }

  const getIcon = () => {
    if (theme === 'system') return <Monitor size={18} />;
    return actualTheme === 'dark' ? <Moon size={18} /> : <Sun size={18} />;
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
      title={`Thema: ${theme === 'system' ? 'Systeem' : actualTheme === 'dark' ? 'Donker' : 'Licht'}`}
      suppressHydrationWarning
    >
      {getIcon()}
    </button>
  );
}
