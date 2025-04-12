// components/Card.tsx
import React from 'react';
import clsx from 'clsx';

type Padding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
}

const paddingMap: Record<Padding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const Card: React.FC<CardProps> = ({ children, className = '', padding = 'md', ...props }) => {
  return (
    <div
      className={clsx('bg-white rounded-lg shadow', paddingMap[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
