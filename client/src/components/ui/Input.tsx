// src/components/ui/Input.tsx
import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; // Optional label text
  id: string; // Required for label association
  error?: string | null; // Optional error message
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  id,
  error = null,
  type = 'text',
  className = '', // Allow passing additional classes to the wrapper
  labelClassName = '',
  inputClassName = '',
  errorClassName = '',
  ...props // Pass remaining input props (value, onChange, placeholder, etc.)
}) => {
  const baseInputClasses =
    'relative block w-full appearance-none rounded-md border px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:outline-none sm:text-sm';
  const errorInputClasses = 'border-red-500 focus:border-red-500 focus:ring-red-500';
  const normalInputClasses = 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500';
  const finalInputClassName = `${baseInputClasses} ${error ? errorInputClasses : normalInputClasses} ${inputClassName}`;

  const finalLabelClassName = `block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`;
  const finalErrorClassName = `mt-1 text-xs text-red-600 ${errorClassName}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className={finalLabelClassName}>
          {label}
        </label>
      )}
      <input
        id={id}
        name={id} // Often useful to have name match id
        type={type}
        className={finalInputClassName}
        aria-invalid={error ? 'true' : 'false'} // Accessibility for errors
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className={finalErrorClassName}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;