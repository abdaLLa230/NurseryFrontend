import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, UserCog, DollarSign, Wallet, ShoppingCart, School, TrendingUp, LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { logout, user } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/' },
    { icon: Users, label: t('nav.students'), path: '/students' },
    { icon: UserCog, label: t('nav.employees'), path: '/employees' },
    { icon: DollarSign, label: t('nav.fees'), path: '/fees' },
    { icon: Wallet, label: t('nav.salaries'), path: '/salaries' },
    { icon: ShoppingCart, label: t('nav.supplies'), path: '/supplies' },
    { icon: School, label: t('nav.classes'), path: '/classes' },
    { icon: TrendingUp, label: t('nav.reports'), path: '/reports' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />}

      <aside className={`fixed lg:static inset-y-0 right-0 z-50 w-60 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-200 ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <img src="/NurseryLogo.png" alt={t('print.nurseryName')} className="w-12 h-12 object-cover rounded-full" />
            <div>
              <span className="font-bold text-gray-900 dark:text-white text-sm block">{t('print.nurseryName')}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('app.title')}</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          {user && (
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user.username || user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.role || 'Admin'}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t('auth.logout')}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
