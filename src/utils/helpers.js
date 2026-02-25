import Swal from 'sweetalert2';

// ============== 🎨 SweetAlert2 Design System ==============
// Font: Cairo (Arabic) | Direction: RTL | Library: SweetAlert2 v11

const isMobile = () => window.innerWidth < 640;

// SVG Icons
const SVG = {
  success: `<svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11.5 14.5 16 9.5"/></svg>`,
  error: `<svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="0.5" fill="#d97706"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="8" r="0.5" fill="#2563eb"/><line x1="12" y1="12" x2="12" y2="16"/></svg>`,
  delete: `<svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14M10 11v6M14 11v6"/></svg>`
};

// ============== 📦 1. TOAST (إشعار صغير) ==============
/**
 * makeToast - إنشاء toast notification بتصميم زجاجي أسود
 * @param {string} type - نوع الإشعار: 'success' | 'error' | 'warning' | 'info'
 * @param {string} label - التصنيف العلوي (uppercase)
 * @param {string} title - العنوان الرئيسي
 * @param {string} msg - الرسالة التوضيحية (اختياري)
 * @param {string} timerClass - class للـ timer bar
 */
export const makeToast = (type, label, title, msg, timerClass) => {
  // تحديد الأيقونة حسب النوع - SVG icons
  const iconMap = {
    success: SVG.success,
    error: SVG.error,
    warning: SVG.warning,
    info: SVG.info
  };
  
  return Swal.mixin({
    toast: true,
    position: isMobile() ? 'bottom-center' : 'top-end',
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    width: isMobile() ? '95%' : '346px',
    padding: '0',
    backdrop: false,
    customClass: {
      popup: isMobile() ? 'swal-toast-mobile' : 'swal-toast-desktop',
      timerProgressBar: timerClass
    }
  }).fire({
    html: `
      <div class="toast-wrap t-${type}">
        <div class="toast-icon">${iconMap[type] || SVG.info}</div>
        <div class="toast-content">
          <div class="toast-title">${title}</div>
          ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
        </div>
      </div>`
  });
};

// Toast Shortcuts
export const showSuccessAlert = (title, msg = null) => {
  return makeToast('success', 'SUCCESS', title, msg, 'swal-timer-success');
};

export const showErrorAlert = (title, msg = null) => {
  return makeToast('error', 'ERROR', title, msg, 'swal-timer-error');
};

export const showWarningAlert = (title, msg = null) => {
  return makeToast('warning', 'WARNING', title, msg, 'swal-timer-warning');
};

export const showInfoAlert = (title, msg = null) => {
  return makeToast('info', 'INFO', title, msg, 'swal-timer-info');
};

// Legacy compatibility
export const Toast = {
  fire: ({ title, html, icon }) => {
    const msg = html?.replace(/<[^>]*>/g, '') || null;
    const typeMap = { success: 'success', error: 'error', warning: 'warning', info: 'info' };
    const type = typeMap[icon] || 'info';
    const timerMap = { 
      success: 'swal-timer-success', 
      error: 'swal-timer-error', 
      warning: 'swal-timer-warning', 
      info: 'swal-timer-info' 
    };
    const iconMap = {
      success: SVG.success,
      error: SVG.error,
      warning: SVG.warning,
      info: SVG.info
    };
    
    return Swal.mixin({
      toast: true,
      position: isMobile() ? 'bottom-center' : 'top-end',
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
      width: isMobile() ? '95%' : '346px',
      padding: '0',
      backdrop: false,
      customClass: {
        popup: isMobile() ? 'swal-toast-mobile' : 'swal-toast-desktop',
        timerProgressBar: timerMap[type]
      }
    }).fire({
      html: `
        <div class="toast-wrap t-${type}">
          <div class="toast-icon">${iconMap[type]}</div>
          <div class="toast-content">
            <div class="toast-title">${title}</div>
            ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
          </div>
        </div>`
    });
  }
};

// ============== 📦 2. CONFIRM DIALOG (تأكيد) ==============
/**
 * showConfirmDialog - نافذة تأكيد بتصميم زجاجي أسود
 * @param {string} title - العنوان
 * @param {string} text - النص التوضيحي
 * @param {string} icon - الأيقونة: '🗑️' للحذف | '⚠️' للتحذير | 'ℹ️' للمعلومة
 * @param {string} confirmButtonText - نص زر التأكيد
 * @param {string} cancelButtonText - نص زر الإلغاء
 */
export const showConfirmDialog = async (
  title, 
  text, 
  icon = '🗑️', 
  confirmButtonText = 'نعم، تأكيد', 
  cancelButtonText = 'إلغاء'
) => {
  // تحديد لون الأيقونة حسب النوع
  const iconColors = {
    '🗑️': { bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.3)' },
    '🗑': { bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.3)' },
    '⚠️': { bg: 'rgba(180,83,9,0.15)', border: 'rgba(180,83,9,0.3)' },
    'ℹ️': { bg: 'rgba(29,78,216,0.15)', border: 'rgba(29,78,216,0.3)' }
  };
  const colors = iconColors[icon] || iconColors['🗑️'];

  return Swal.fire({
    title: title,
    html: `
      <div class="swal-confirm-dot" style="background: ${colors.bg}; border: 1px solid ${colors.border}">
        ${icon === '🗑️' || icon === '🗑' ? SVG.delete : icon}
      </div>
      <div class="swal-confirm-text">${text}</div>
    `,
    showCancelButton: true,
    confirmButtonText: `<span class="swal-btn-text">${confirmButtonText}</span>`,
    cancelButtonText: `<span class="swal-btn-text">${cancelButtonText}</span>`,
    width: isMobile() ? '92%' : '380px',
    customClass: {
      popup: isMobile() ? 'swal-confirm-mobile' : 'swal-confirm-desktop',
      title: 'swal-confirm-title',
      htmlContainer: 'swal-confirm-container',
      confirmButton: 'swal-btn-confirm',
      cancelButton: 'swal-btn-cancel',
      actions: 'swal-actions'
    },
    buttonsStyling: false,
    reverseButtons: true,
    backdrop: 'rgba(0,0,0,0.85)',
    allowOutsideClick: false
  });
};

// ============== 📦 3. LOADING DIALOG (تحميل) ==============
/**
 * showLoadingAlert - نافذة تحميل بتصميم زجاجي أسود
 * @param {string} title - العنوان
 * @param {string} text - النص التوضيحي
 */
export const showLoadingAlert = (title = 'جاري التحميل...', text = 'الرجاء الانتظار') => {
  return Swal.fire({
    title: title,
    html: `<div class="swal-loading-text">${text}</div>`,
    allowOutsideClick: false,
    allowEscapeKey: false,
    width: isMobile() ? '85%' : '300px',
    customClass: {
      popup: isMobile() ? 'swal-loading-mobile' : 'swal-loading-desktop',
      title: 'swal-loading-title'
    },
    backdrop: 'rgba(0,0,0,0.85)',
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

// ============== Date Utilities ==============

export const formatDate = (date, locale = 'ar-EG') => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatShortDate = (date, locale = 'ar-EG') => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (date, locale = 'ar-EG') => {
  if (!date) return '-';
  return new Date(date).toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getCurrentMonth = () => new Date().getMonth() + 1;
export const getCurrentYear = () => new Date().getFullYear();

// ============== Number Utilities ==============

export const formatCurrency = (amount, currency = 'EGP', locale = 'ar-EG') => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ` ${currency}`;
};

export const formatNumber = (number, locale = 'ar-EG') => {
  if (number === null || number === undefined) return '-';
  return new Intl.NumberFormat(locale).format(number);
};

// ============== Validation Utilities ==============

export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const isValidPhone = (phone) => {
  const re = /^01[0-2,5]{1}[0-9]{8}$/;
  return re.test(phone);
};

export const isValidNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

// Validation for text fields
export const validateRequired = (value, fieldName) => {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return { valid: false, error: `${fieldName} مطلوب` };
  }
  return { valid: true };
};

// Validation for name fields (min 2 chars, max 100)
export const validateName = (value, fieldName = 'الاسم') => {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return { valid: false, error: `${fieldName} مطلوب` };
  }
  if (trimmed.length < 2) {
    return { valid: false, error: `${fieldName} يجب أن يكون حرفين على الأقل` };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: `${fieldName} طويل جداً (الحد الأقصى 100 حرف)` };
  }
  return { valid: true };
};

// Validation for age (1-120)
export const validateAge = (value) => {
  const age = parseInt(value, 10);
  if (isNaN(age)) {
    return { valid: false, error: 'العمر يجب أن يكون رقماً' };
  }
  if (age < 1 || age > 120) {
    return { valid: false, error: 'العمر يجب أن يكون بين 1 و 120' };
  }
  return { valid: true };
};

// Validation for positive numbers
export const validatePositiveNumber = (value, fieldName = 'القيمة') => {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} يجب أن يكون رقماً` };
  }
  if (num <= 0) {
    return { valid: false, error: `${fieldName} يجب أن يكون أكبر من صفر` };
  }
  return { valid: true };
};

// Validation for salary/price (min 1, max 1000000)
export const validateMoney = (value, fieldName = 'المبلغ') => {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} يجب أن يكون رقماً` };
  }
  if (num < 1) {
    return { valid: false, error: `${fieldName} يجب أن يكون 1 على الأقل` };
  }
  if (num > 1000000) {
    return { valid: false, error: `${fieldName} كبير جداً (الحد الأقصى 1,000,000)` };
  }
  return { valid: true };
};

// Validation for phone number
export const validatePhone = (value) => {
  if (!value || value.trim() === '') {
    return { valid: true }; // Optional field
  }
  const trimmed = value.trim();
  if (!/^01[0-2,5]{1}[0-9]{8}$/.test(trimmed)) {
    return { valid: false, error: 'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 01 ويتكون من 11 رقم)' };
  }
  return { valid: true };
};

// Validation for email
export const validateEmail = (value) => {
  if (!value || value.trim() === '') {
    return { valid: false, error: 'البريد الإلكتروني مطلوب' };
  }
  const trimmed = value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { valid: false, error: 'البريد الإلكتروني غير صحيح' };
  }
  return { valid: true };
};

// Validation for password
export const validatePassword = (value, minLength = 6) => {
  if (!value || value.trim() === '') {
    return { valid: false, error: 'كلمة المرور مطلوبة' };
  }
  if (value.length < minLength) {
    return { valid: false, error: `كلمة المرور يجب أن تكون ${minLength} أحرف على الأقل` };
  }
  return { valid: true };
};

// Validation for password confirmation
export const validatePasswordMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return { valid: false, error: 'كلمات المرور غير متطابقة' };
  }
  return { valid: true };
};

// ============== String Utilities ==============

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// ============== Array Utilities ==============

export const sortByKey = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    if (order === 'asc') {
      return a[key] > b[key] ? 1 : -1;
    } else {
      return a[key] < b[key] ? 1 : -1;
    }
  });
};

export const filterBySearch = (array, searchTerm, keys) => {
  if (!searchTerm) return array;
  const term = searchTerm.toLowerCase();
  return array.filter(item =>
    keys.some(key => {
      const value = item[key];
      return value && value.toString().toLowerCase().includes(term);
    })
  );
};

// ============== Local Storage Utilities ==============

export const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error setting localStorage:', error);
    return false;
  }
};

export const getLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error getting localStorage:', error);
    return defaultValue;
  }
};

export const removeLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing localStorage:', error);
    return false;
  }
};

// ============== API Error Handler ==============

export const handleApiError = (error, t) => {
  if (error.response) {
    const data = error.response.data || {};
    let message = data.message || data.error;
    if (!message && typeof data === 'string') message = data;
    if (!message && data.errors) {
      const parts = Object.entries(data.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
      message = parts.length ? parts.join('; ') : 'Validation error';
    }
    if (!message) message = 'Server error';
    if (data.message && data.error && data.message !== data.error) message = `${data.message}: ${data.error}`;
    showErrorAlert(message);
  } else if (error.request) {
    // Request made but no response
    showErrorAlert(t('messages.networkError'));
  } else {
    // Something else happened
    showErrorAlert(error.message || t('messages.error'));
  }
  console.error('API Error:', error.response?.data ?? error);
  console.log("API ERROR DATA:", error?.response?.data);
console.log("API ERROR STATUS:", error?.response?.status);
console.log("API ERROR RAW:", error);
};

// ============== Status Badge Helper ==============

export const getStatusColor = (status) => {
  const colors = {
    'Paid': 'success',
    'NotPaid': 'danger',
    'Pending': 'warning',
    'Active': 'success',
    'Inactive': 'danger',
    'Nursery': 'info',
    'Course': 'warning',
  };
  return colors[status] || 'info';
};

// ============== Month Names ==============

export const getMonthName = (monthNumber, locale = 'ar') => {
  const months = {
    ar: [
      'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ],
    en: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
  };
  return months[locale][monthNumber - 1] || '';
};

// ============== Debounce ==============

export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// ============== Copy to Clipboard ==============

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    showSuccessAlert('Copied to clipboard');
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    showErrorAlert('Failed to copy');
    return false;
  }
};

// ============== Download File ==============

export const downloadFile = (data, filename, type = 'text/plain') => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// ============== Print ==============

export const printElement = (elementId) => {
  const printContent = document.getElementById(elementId);
  if (!printContent) {
    showErrorAlert('Element not found');
    return;
  }
  
  const windowPrint = window.open('', '', 'width=800,height=600');
  windowPrint.document.write('<html><head><title>Print</title>');
  windowPrint.document.write('<link rel="stylesheet" href="/print.css">');
  windowPrint.document.write('</head><body>');
  windowPrint.document.write(printContent.innerHTML);
  windowPrint.document.write('</body></html>');
  windowPrint.document.close();
  windowPrint.focus();
  windowPrint.print();
  windowPrint.close();
};

export default {
  Toast,
  showSuccessAlert,
  showErrorAlert,
  showWarningAlert,
  showInfoAlert,
  showConfirmDialog,
  showLoadingAlert,
  formatDate,
  formatShortDate,
  formatDateTime,
  getCurrentMonth,
  getCurrentYear,
  formatCurrency,
  formatNumber,
  isValidEmail,
  isValidPhone,
  isValidNumber,
  validateRequired,
  validateName,
  validateAge,
  validatePositiveNumber,
  validateMoney,
  validatePhone,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  truncateText,
  capitalizeFirst,
  sortByKey,
  filterBySearch,
  setLocalStorage,
  getLocalStorage,
  removeLocalStorage,
  handleApiError,
  getStatusColor,
  getMonthName,
  debounce,
  copyToClipboard,
  downloadFile,
  printElement
};
