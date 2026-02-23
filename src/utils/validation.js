// ============== Form Validation Utilities ==============

/**
 * Validate required field
 */
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} مطلوب`;
  }
  return null;
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (!email) return 'البريد الإلكتروني مطلوب';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'البريد الإلكتروني غير صحيح';
  }
  return null;
};

/**
 * Validate Egyptian phone number
 */
export const validatePhone = (phone) => {
  if (!phone) return 'رقم الهاتف مطلوب';
  const phoneRegex = /^01[0-2,5]{1}[0-9]{8}$/;
  if (!phoneRegex.test(phone)) {
    return 'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 01 ويتكون من 11 رقم)';
  }
  return null;
};

/**
 * Validate number (positive)
 */
export const validateNumber = (value, fieldName, min = 0, max = null) => {
  if (value === '' || value === null || value === undefined) {
    return `${fieldName} مطلوب`;
  }
  
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return `${fieldName} يجب أن يكون رقماً`;
  }
  
  if (num < min) {
    return `${fieldName} يجب أن يكون ${min} على الأقل`;
  }
  
  if (max !== null && num > max) {
    return `${fieldName} يجب ألا يتجاوز ${max}`;
  }
  
  return null;
};

/**
 * Validate age
 */
export const validateAge = (age) => {
  return validateNumber(age, 'العمر', 0, 120);
};

/**
 * Validate salary/amount
 */
export const validateAmount = (amount, fieldName = 'المبلغ') => {
  return validateNumber(amount, fieldName, 1);
};

/**
 * Validate string length
 */
export const validateLength = (value, fieldName, min = 0, max = null) => {
  if (!value) return `${fieldName} مطلوب`;
  
  const length = value.trim().length;
  
  if (length < min) {
    return `${fieldName} يجب أن يحتوي على ${min} أحرف على الأقل`;
  }
  
  if (max !== null && length > max) {
    return `${fieldName} يجب ألا يتجاوز ${max} حرف`;
  }
  
  return null;
};

/**
 * Validate name (Arabic/English letters only)
 */
export const validateName = (name, fieldName = 'الاسم') => {
  if (!name || name.trim() === '') {
    return `${fieldName} مطلوب`;
  }
  
  const nameRegex = /^[\u0600-\u06FFa-zA-Z\s]+$/;
  if (!nameRegex.test(name)) {
    return `${fieldName} يجب أن يحتوي على حروف عربية أو إنجليزية فقط`;
  }
  
  if (name.trim().length < 2) {
    return `${fieldName} يجب أن يحتوي على حرفين على الأقل`;
  }
  
  return null;
};

/**
 * Validate select/dropdown
 */
export const validateSelect = (value, fieldName) => {
  if (!value || value === '' || value === 'select') {
    return `يرجى اختيار ${fieldName}`;
  }
  return null;
};

/**
 * Validate month (1-12)
 */
export const validateMonth = (month) => {
  return validateNumber(month, 'الشهر', 1, 12);
};

/**
 * Validate year
 */
export const validateYear = (year) => {
  const currentYear = new Date().getFullYear();
  return validateNumber(year, 'السنة', 2020, currentYear + 5);
};

/**
 * Validate form - returns object with errors
 */
export const validateForm = (fields) => {
  const errors = {};
  
  Object.keys(fields).forEach(key => {
    const field = fields[key];
    const { value, validator, fieldName } = field;
    
    if (validator) {
      const error = validator(value, fieldName);
      if (error) {
        errors[key] = error;
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitize input (prevent XSS)
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Trim all string values in object
 */
export const trimFormData = (data) => {
  const trimmed = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    trimmed[key] = typeof value === 'string' ? value.trim() : value;
  });
  
  return trimmed;
};

export default {
  validateRequired,
  validateEmail,
  validatePhone,
  validateNumber,
  validateAge,
  validateAmount,
  validateLength,
  validateName,
  validateSelect,
  validateMonth,
  validateYear,
  validateForm,
  sanitizeInput,
  trimFormData
};
