import Swal from 'sweetalert2';

// ============== SweetAlert2 Utilities ==============

export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export const showSuccessAlert = (message, title = 'Success') => {
  return Toast.fire({
    icon: 'success',
    title: title,
    text: message
  });
};

export const showErrorAlert = (message, title = 'Error') => {
  return Toast.fire({
    icon: 'error',
    title: title,
    text: message
  });
};

export const showWarningAlert = (message, title = 'Warning') => {
  return Toast.fire({
    icon: 'warning',
    title: title,
    text: message
  });
};

export const showInfoAlert = (message, title = 'Info') => {
  return Toast.fire({
    icon: 'info',
    title: title,
    text: message
  });
};

export const showConfirmDialog = async (title, text, confirmButtonText = 'Confirm', cancelButtonText = 'Cancel') => {
  return Swal.fire({
    title: title,
    text: text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: confirmButtonText,
    cancelButtonText: cancelButtonText
  });
};

export const showLoadingAlert = (title = 'Loading...', text = 'Please wait') => {
  return Swal.fire({
    title: title,
    text: text,
    allowOutsideClick: false,
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
