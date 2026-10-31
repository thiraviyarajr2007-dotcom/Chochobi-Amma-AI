import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rounded',
}) => {
  const variantStyles = {
    rectangular: 'rounded-none',
    circular: 'rounded-full',
    rounded: 'rounded-3xl',
  };

  return (
    <div
      className={`animate-pulse bg-[#EFEBE9] ${variantStyles[variant]} ${className}`}
      aria-hidden="true"
    />
  );
};

