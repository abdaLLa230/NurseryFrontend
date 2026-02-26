import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { validateEmail, validatePassword, validatePasswordMatch, validateName, showErrorAlert } from '../utils/helpers';
import { motion } from 'framer-motion';
import { Lock, Mail, User, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://nurserybackend-production.up.railway.app/api';

const Register = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'User',
    secretCode: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // التحقق من الكود السري أولاً
    if (formData.secretCode.toLowerCase() !== 'abdallah') {
      setError(t('register.incorrectCode'));
      return;
    }

    // Validate username
    const usernameValidation = validateName(formData.username, t('register.username'));
    if (!usernameValidation.valid) {
      setError(usernameValidation.error);
      return;
    }

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      setError(emailValidation.error);
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password, 6);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error);
      return;
    }

    // Validate password match
    const passwordMatchValidation = validatePasswordMatch(formData.password, formData.confirmPassword);
    if (!passwordMatchValidation.valid) {
      setError(passwordMatchValidation.error);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError(t('register.unauthorized'));
        setLoading(false);
        return;
      }

      await axios.post(
        `${API_URL}/api/auth/register`,
        {
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setSuccess(true);
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'User',
        secretCode: ''
      });
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      if (err.response?.status === 401) {
        setError(t('register.unauthorized'));
      } else if (err.response?.status === 400) {
        setError(err.response.data.message || t('register.dataError'));
      } else {
        setError(t('messages.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen py-20 flex justify-center relative bg-cover bg-center"
      
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-sm"></div>

      {/* Register Card */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-xl md:px-8 px-4 py-5 mt-10 mx-2"
      >
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img src="/NurseryLogo.png" alt={t('print.nurseryName')} className="w-24 h-24 object-cover rounded-full" />
        </div>
        
        <h2 className="text-3xl font-bold text-center text-blue-700 pb-8">{t('register.title') || 'إنشاء مستخدم جديد'}</h2>

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center text-sm gap-2"
          >
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p>{t('register.success') || 'تم إنشاء المستخدم بنجاح!'}</p>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center text-sm gap-2"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        {/* Form Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-2 md:gap-4">
          {/* Username */}
          <div className="mb-2 md:mb-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('register.username')}
            </label>
            <div className="flex items-center gap-3 bg-blue-50 px-3 py-3 rounded-lg border border-blue-100">
              <User className="text-blue-400 w-5 h-5 shrink-0" />
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder={t('register.enterUsername')}
                className="bg-transparent outline-none w-full text-sm text-gray-800 cursor-text"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-2 md:mb-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('register.email')}
            </label>
            <div className="flex items-center gap-3 bg-blue-50 px-3 py-3 rounded-lg border border-blue-100">
              <Mail className="text-blue-400 w-5 h-5 shrink-0" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@gmail.com"
                className="bg-transparent outline-none w-full text-sm text-gray-800 cursor-text"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-2 md:mb-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('register.password')}
            </label>
            <div className="flex items-center gap-3 bg-blue-50 px-3 py-3 rounded-lg border border-blue-100">
              <Lock className="text-blue-400 w-5 h-5 shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t('register.passwordPlaceholder')}
                className="bg-transparent outline-none w-full text-sm text-gray-800 cursor-text"
                required
                minLength={6}
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

          {/* Confirm Password */}
          <div className="mb-2 md:mb-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('register.confirmPassword')}
            </label>
            <div className="flex items-center gap-3 bg-blue-50 px-3 py-3 rounded-lg border border-blue-100">
              <Lock className="text-blue-400 w-5 h-5 shrink-0" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={t('register.confirmPasswordPlaceholder')}
                className="bg-transparent outline-none w-full text-sm text-gray-800 cursor-text"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-gray-400 hover:text-gray-600 transition shrink-0 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="mb-2 md:mb-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('register.role')}
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full bg-blue-50 border border-blue-100 rounded-lg px-3 py-3 text-sm text-gray-800 outline-none cursor-pointer"
            >
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {/* Secret Code */}
          <div className="mb-2 md:mb-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('register.secretCode')} <span className="text-xs text-gray-500">{t('register.secretCodeVerify')}</span>
            </label>
            <div className="flex items-center gap-3 bg-amber-50 px-3 py-3 rounded-lg border border-amber-200">
              <Lock className="text-amber-500 w-5 h-5 shrink-0" />
              <input
                type="text"
                name="secretCode"
                value={formData.secretCode}
                onChange={handleChange}
                placeholder={t('register.enterSecretCode')}
                className="bg-transparent outline-none w-full text-sm text-gray-800 cursor-text"
                required
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-lg text-white font-semibold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition mt-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {t('status.creating')}
            </div>
          ) : (
            t('register.createUser')
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full py-3 rounded-lg text-gray-700 font-semibold text-sm bg-gray-100 hover:bg-gray-200 transition mt-3 cursor-pointer"
        >
          {t('register.backToDashboard')}
        </button>

       
      </motion.div>
    </div>
  );
};

export default Register;
