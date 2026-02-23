import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

import { motion } from "framer-motion";
import { Lock, Heart, AlertCircle, User, Eye, EyeOff } from "lucide-react";
import Icon from "@mdi/react";
import { mdiHome } from "@mdi/js";

export default function Login() {
  const { t, i18n } = useTranslation();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isRTL = i18n.language === 'ar';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(credentials);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative bg-cover bg-center"
      style={{
      }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-blue-900/30 backdrop-blur-sm"></div>

    

     

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-xl md:px-8 px-4 py-8 mx-2"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <h2 className="text-3xl font-bold text-center text-blue-700">{t('auth.login')}</h2>
        <p className="text-center text-gray-500 mt-2 mb-6">
          {t('auth.loginSubtitle')}
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center text-sm gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.username')}
            </label>
            <div className="flex items-center gap-3 bg-blue-50 md:px-4 px-2 py-3 rounded-lg border border-blue-100 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 transition-all">
              <User className={`text-blue-400 w-5 h-5 shrink-0 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              <input
                type="text"
                placeholder={t('auth.enterUsername')}
                className={`w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm text-gray-800 cursor-text ${!credentials.username && isRTL ? 'text-right' : 'text-left'}`}
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                required
                disabled={loading}
                dir={!credentials.username && isRTL ? "rtl" : "ltr"}
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.password')}
            </label>
            <div className="flex items-center gap-3 bg-blue-50 md:px-4 px-2 py-3 rounded-lg border border-blue-100 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 transition-all">
              <Lock className={`text-blue-400 w-5 h-5 shrink-0 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.enterPassword')}
                className={`w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm text-gray-800 cursor-text ${!credentials.password && isRTL ? 'text-right' : 'text-left'}`}
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
                disabled={loading}
                dir={!credentials.password && isRTL ? "rtl" : "ltr"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 transition shrink-0 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className={`mb-6 flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
            <a href="#" className="text-sm text-blue-600 font-semibold hover:underline">
              {t('auth.forgotPassword')}
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg text-white font-semibold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition flex justify-center items-center shadow-md shadow-blue-500/20"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('auth.loggingIn')}
              </div>
            ) : (
              t('auth.login')
            )}
          </button>
        </form>

      </motion.div>
    </div>
  );
}
