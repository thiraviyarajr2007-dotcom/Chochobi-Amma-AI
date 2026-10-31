import React, { ReactNode } from 'react';

interface StatTileProps {
  label: string;
  value: string;
  sublabel?: string;
  icon?: ReactNode;
  variant?: 'primary' | 'turmeric' | 'success' | 'danger' | 'neutral';
  trend?: 'up' | 'down' | 'neutral';
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  sublabel,
  icon,
  variant = 'neutral',
}) => {
  const borderVariants = {
    primary: 'border-kumkum-200 bg-white hover:border-kumkum',
    turmeric: 'border-turmeric-200 bg-white hover:border-turmeric',
    success: 'border-leafGreen/20 bg-white hover:border-leafGreen',
    danger: 'border-red-200 bg-white hover:border-red-500',
    neutral: 'border-[#EFEBE9] bg-white',
  };

  const iconBgVariants = {
    primary: 'bg-kumkum-100 text-kumkum',
    turmeric: 'bg-turmeric-100 text-warmBrown',
    success: 'bg-leafGreen-light text-leafGreen',
    danger: 'bg-red-100 text-danger',
    neutral: 'bg-cream-dark text-warmBrown-muted',
  };

  return (
    <div
      className={`rounded-3xl p-4 border shadow-warm-sm flex flex-col justify-between transition-all duration-200 ${borderVariants[variant]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs sm:text-sm font-semibold text-warmBrown-subtle">
          {label}
        </span>
        {icon && (
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBgVariants[variant]}`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2">
        <div className="text-xl sm:text-2xl font-extrabold text-warmBrown tracking-tight">
          {value}
        </div>
        {sublabel && (
          <div className="text-xs font-medium text-warmBrown-subtle mt-0.5">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
};

