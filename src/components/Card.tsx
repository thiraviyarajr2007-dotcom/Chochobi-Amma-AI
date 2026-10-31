import React, { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'surface' | 'cream' | 'accent' | 'warmGold' | 'danger';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'surface',
  interactive = false,
  className = '',
  ...props
}) => {
  const base =
    'rounded-3xl p-5 sm:p-6 transition-all duration-200 border relative overflow-hidden';

  const variants = {
    surface: 'bg-white border-[#EFEBE9] shadow-warm-md text-warmBrown',
    cream: 'bg-[#FFFDF9] border-[#EFEBE9] shadow-warm-sm text-warmBrown',
    accent: 'bg-kumkum-50 border-kumkum-200 shadow-warm-sm text-warmBrown',
    warmGold: 'bg-turmeric-50 border-turmeric-100 shadow-warm-sm text-warmBrown',
    danger: 'bg-red-50 border-red-200 shadow-warm-sm text-warmBrown',
  };

  const interactiveStyles = interactive
    ? 'cursor-pointer hover:shadow-warm-lg active:scale-[0.99] touch-manipulation'
    : '';

  return (
    <div
      className={`${base} ${variants[variant]} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

