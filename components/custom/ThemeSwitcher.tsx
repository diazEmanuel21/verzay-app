'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react'; // o react-icons si prefieres

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // On mount, check the preferred theme
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme') || 'light';
      setTheme(storedTheme);
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
    >
      {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  );
}
