import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled = false,
  ...props
}) => {
  // Base styles
  let baseStyle = 'inline-flex items-center justify-center border border-transparent rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Variant styles
  let variantStyle = '';
  switch (variant) {
    case 'secondary':
      variantStyle = 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:ring-indigo-500';
      break;
    case 'danger':
      variantStyle = 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500';
      break;
    case 'primary':
    default:
      variantStyle = 'text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500';
      break;
  }

  // Size styles
  let sizeStyle = '';
  switch (size) {
    case 'sm':
      sizeStyle = 'px-3 py-1.5 text-sm';
      break;
    case 'lg':
      sizeStyle = 'px-6 py-3 text-lg';
      break;
    case 'md':
    default:
      sizeStyle = 'px-4 py-2 text-base';
      break;
  }

  // Full width style
  const widthStyle = fullWidth ? 'w-full' : '';

  // Disabled style
  const disabledStyle = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type="button" // Default type
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${widthStyle} ${disabledStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;