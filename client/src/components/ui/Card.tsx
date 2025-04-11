// src/components/ui/Card.tsx
import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg' | 'none'; // Control padding size
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md', // Default padding
  ...props
}) => {
  const baseClasses = 'bg-white rounded-lg shadow overflow-hidden'; // Base card styles

  let paddingClasses = '';
  switch (padding) {
    case 'sm':
      paddingClasses = 'p-4';
      break;
    case 'lg':
      paddingClasses = 'p-8';
      break;
    case 'none':
      paddingClasses = '';
      break;
    case 'md':
    default:
      paddingClasses = 'p-6';
      break;
  }

  const finalClassName = `${baseClasses} ${paddingClasses} ${className}`;

  return (
    <div className={finalClassName} {...props}>
      {children}
    </div>
  );
};

export default Card;