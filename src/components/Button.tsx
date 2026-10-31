import React, { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'lg',
  fullWidth = true,
  icon,
  children,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'min-h-[40px] px-3.5 py-1.5 text-sm rounded-xl',
    md: 'min-h-[48px] px-5 py-2.5 text-base rounded-2xl',
    lg: 'min-h-[56px] px-6 py-3.5 text-lg rounded-2xl',
  };

  const baseStyles =
    'font-semibold flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-4 select-none touch-manipulation disabled:opacity-60 disabled:pointer-events-none disabled:active:scale-100 shadow-warm-sm';

  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-kumkum hover:bg-kumkum-dark text-white focus:ring-kumkum/30 active:bg-kumkum-dark shadow-kumkum-glow/40 border border-kumkum-dark/20',
    secondary:
      'bg-turmeric hover:bg-turmeric-dark text-warmBrown font-bold focus:ring-turmeric/40 active:bg-turmeric-dark border border-turmeric-dark/30',
    success:
      'bg-leafGreen hover:bg-leafGreen-dark text-white focus:ring-leafGreen/30 active:bg-leafGreen-dark',
    danger:
      'bg-danger hover:bg-red-700 text-white focus:ring-danger/30 active:bg-red-800',
    ghost:
      'bg-white hover:bg-cream-dark text-warmBrown border-2 border-warmBrown-light focus:ring-warmBrown/20 shadow-none',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${
        fullWidth ? 'w-full' : 'w-auto'
      } ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-6 h-6 border-3 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon && <span className="flex-shrink-0 text-xl">{icon}</span>
      )}
      <span className="leading-tight text-center">{children}</span>
    </button>
  );
};
