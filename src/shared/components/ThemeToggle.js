// src/shared/components/ThemeToggle.js
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
        bg-gray-100 hover:bg-gray-200 text-gray-700
        dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-200
        transition-colors duration-200 flex-shrink-0"
    >
      {isDarkMode ? (
        <>
          <Sun size={16} />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon size={16} />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  );
}