'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsConfig {
  onSearch?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onEscape?: () => void;
  onToggleFilters?: () => void;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, ctrlKey, metaKey, shiftKey } = event;
    const isCtrlOrCmd = ctrlKey || metaKey;

    // Prevent default browser behavior for our shortcuts
    const shouldPreventDefault = (
      (isCtrlOrCmd && key === 'f') || // Ctrl/Cmd + F
      key === ' ' || // Space
      key === 'r' || // R
      key === 'n' || // N
      key === 'p' || // P
      key === 'Escape' || // Escape
      key === 'f' // F (for filters)
    );

    if (shouldPreventDefault) {
      event.preventDefault();
    }

    // Handle shortcuts
    if (isCtrlOrCmd && key === 'f' && config.onSearch) {
      config.onSearch();
    } else if (key === ' ' && config.onApprove) {
      config.onApprove();
    } else if (key === 'r' && config.onReject) {
      config.onReject();
    } else if (key === 'n' && config.onNext) {
      config.onNext();
    } else if (key === 'p' && config.onPrevious) {
      config.onPrevious();
    } else if (key === 'Escape' && config.onEscape) {
      config.onEscape();
    } else if (key === 'f' && !isCtrlOrCmd && config.onToggleFilters) {
      config.onToggleFilters();
    }
  }, [config]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Helper component to show keyboard shortcuts
export function KeyboardShortcutsHelp() {
  return (
    <div className="fixed bottom-4 right-4 z-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 max-w-xs">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Keyboard Shortcuts
      </h4>
      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex justify-between">
          <span>Zoeken</span>
          <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+F</kbd>
        </div>
        <div className="flex justify-between">
          <span>Goedkeuren</span>
          <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Space</kbd>
        </div>
        <div className="flex justify-between">
          <span>Afkeuren</span>
          <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">R</kbd>
        </div>
        <div className="flex justify-between">
          <span>Volgende</span>
          <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">N</kbd>
        </div>
        <div className="flex justify-between">
          <span>Vorige</span>
          <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">P</kbd>
        </div>
        <div className="flex justify-between">
          <span>Filters</span>
          <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">F</kbd>
        </div>
        <div className="flex justify-between">
          <span>Sluiten</span>
          <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd>
        </div>
      </div>
    </div>
  );
}