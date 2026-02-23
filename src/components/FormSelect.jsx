import React from 'react';
import { AlertCircle } from 'lucide-react';

const FormSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  required = false,
  disabled = false,
  placeholder = '',
  className = '',
  selectClassName = '',
  ...props
}) => {
  const selectId = `select-${name}`;
  const errorId = `error-${name}`;
  
  return (
    <div className={className}>
      {label && (
        <label 
          htmlFor={selectId} 
          className="label"
        >
          {label}
        </label>
      )}
      
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        aria-required={required}
        className={`input ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${selectClassName}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option, index) => (
          <option 
            key={option.value || index} 
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
      
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

export default FormSelect;
