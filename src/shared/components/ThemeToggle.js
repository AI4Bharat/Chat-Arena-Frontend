import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="relative w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300
  bg-gray-200 dark:bg-[#3a3a3a]
  border border-orange-400 hover:border-orange-500"
    >
      {/* Toggle Circle */}
      <div
        className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white dark:bg-[#2a2a2a] shadow-md
          flex items-center justify-center transition-transform duration-300
          ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}
        `}
      >
        {isDarkMode ? (
          <Moon size={14} className="text-[#ececec]" />
        ) : (
          <Sun size={14} className="text-orange-500" />
        )}
      </div>
    </button>
  );
}