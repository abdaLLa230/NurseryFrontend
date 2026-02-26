import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { Menu, Globe, Sun, Moon } from 'lucide-react';

const Header = ({ onMenuClick }) => {
  const { t } = useTranslation();
  const { language, toggleLanguage, theme, toggleTheme } = useLanguage();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-40 lg:relative">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        {/* Logo */}
        <div className="flex items-center gap-2">            
            <p className="text-md text-gray-500 dark:text-gray-400">{t('auth.welcome')}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-[18px] h-[18px] text-amber-500" />
          ) : (
            <Moon className="w-[18px] h-[18px] text-gray-500" />
          )}
        </button>

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm font-medium text-gray-600 dark:text-gray-400"
        >
          <Globe className="w-[18px] h-[18px]" />
          {language === 'ar' ? 'EN' : 'AR'}
        </button>
      </div>
    </header>
  );
};

export default Header;
