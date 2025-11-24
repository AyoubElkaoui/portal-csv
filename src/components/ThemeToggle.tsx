'use client';

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, actualTheme, toggleTheme } = useTheme();

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor size={18} />;
    }
    return actualTheme === 'dark' ? <Moon size={18} /> : <Sun size={18} />;
  };

  const getLabel = () => {
    if (theme === 'system') {
      return 'Systeem';
    }
    return actualTheme === 'dark' ? 'Donker' : 'Licht';
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
      title={`Thema: ${getLabel()}. Klik om te wisselen.`}
    >
      {getIcon()}
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {getLabel()}
      </span>
    </button>
  );
}