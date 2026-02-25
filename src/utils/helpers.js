import Swal from 'sweetalert2';

// ============== SweetAlert2 Utilities ==============

const isMobile = () => window.innerWidth < 640;

export const Toast = Swal.mixin({
  toast: true,
  position: isMobile() ? 'bottom-center' : 'top-end',
  showConfirmButton: false,
  timer: 4000,
  timerProgressBar: true,
  width: isMobile() ? '95%' : '480px',
  padding: '0',
  backdrop: false,
  customClass: {
    popup: isMobile() ? 'swal-toast-mobile' : 'swal-toast-desktop',
    timerProgressBar: 'swal-timer-bar'
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export const showSuccessAlert = (message, title = null) => {
  return Toast.fire({
    icon: 'success',
    title: title || message,
    html: title ? `<div class="swal-message">${message}</div>` : null,
    iconColor: '#10b981',
  });
};

export const showErrorAlert = (message, title = null) => {
  return Toast.fire({
    icon: 'error',
    title: title || message,
    html: title ? `<div class="swal-message">${message}</div>` : null,
    iconColor: '#ef4444',
  });
};

export const showWarningAlert = (message, title = null) => {
  return Toast.fire({
    icon: 'warning',
    title: title || message,
    html: title ? `<div class="swal-message">${message}</div>` : null,
    iconColor: '#f59e0b',
  });
};

export const showInfoAlert = (message, title = null) => {
  return Toast.fire({
    icon: 'info',
    title: title || message,
    html: title ? `<div class="swal-message">${message}</div>` : null,
    iconColor: '#3b82f6',
  });
};

export const showConfirmDialog = async (title, text, confirmButtonText = 'تأكيد', cancelButtonText = 'إلغاء') => {
  return Swal.fire({
    title: title,
    html: `<div class="swal-confirm-text">${text}</div>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: `<span class="swal-btn-text">${confirmButtonText}</span>`,
    cancelButtonText: `<span class="swal-btn-text">${cancelButtonText}</span>`,
    width: isMobile() ? '92%' : '600px',
    padding: isMobile() ? '28px 24px' : '48px 40px',
    customClass: {
      popup: isMobile() ? 'swal-confirm-mobile' : 'swal-confirm-desktop',
      title: 'swal-confirm-title',
      htmlContainer: 'swal-confirm-container',
      confirmButton: 'swal-btn-confirm',
      cancelButton: 'swal-btn-cancel',
      actions: 'swal-actions',
      icon: 'swal-icon'
    },
    buttonsStyling: false,
    reverseButtons: true,
    backdrop: 'rgba(0, 0, 0, 0.45)',
    allowOutsideClick: false
  });
};

export const showLoadingAlert = (title = 'جاري التحميل...', text = 'الرجاء الانتظار') => {
  return Swal.fire({
    title: title,
    html: `<div class="swal-loading-text">${text}</div>`,
    allowOutsideClick: false,
    allowEscapeKey: false,
    width: isMobile() ? '85%' : '480px',
    padding: isMobile() ? '28px' : '40px',
    customClass: {
      popup: isMobile() ? 'swal-loading-mobile' : 'swal-loading-desktop',
      title: 'swal-loading-title'
    },
    backdrop: 'rgba(0, 0, 0, 0.5)',
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
