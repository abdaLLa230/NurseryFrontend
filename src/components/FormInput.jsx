import React from 'react';
import { AlertCircle } from 'lucide-react';

const FormInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  disabled = false,
  min,
  max,
  step,
  autoComplete = 'off',
  className = '',
  inputClassName = '',
  ...props
}) => {
  const inputId = `input-${name}`;
  const errorId = `error-${name}`;
  
  return (
    <div className={className}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="label"
        >
          {label}
        </label>
      )}
      
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        min={min}
        max={max}
        step={step}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        aria-required={required}
        className={`input ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${inputClassName}`}
        {...props}
      />
      
      {error && (
        <div 
          id={errorId}
          className="flex items-center gap-1 mt-1 text-xs text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FormInput;
