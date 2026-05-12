import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  style,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center gap-1.5 rounded-[6px] border font-[var(--font-mono)] tracking-[-0.01em] transition-all duration-150 ease-in-out';
  const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'text-[var(--text-xs)] px-[10px] py-[4px]',
    md: 'text-[var(--text-sm)] px-[16px] py-[7px]',
    lg: 'text-[var(--text-lg)] px-[24px] py-[10px]',
  };
  const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-[var(--bg-tertiary)] text-[var(--text)] border-[var(--border)]',
    ghost: 'bg-transparent text-[var(--text-muted)] border-transparent',
    danger: 'bg-[color-mix(in_srgb,var(--status-error),transparent_90%)] text-[var(--status-error)] border-[color-mix(in_srgb,var(--status-error),transparent_80%)]',
  };
  const stateClasses = disabled || loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer';
  const combinedClassName = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    stateClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={combinedClassName}
      style={style}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="animate-pulse-slow">⏳</span>}
      {children}
    </button>
  );
}
