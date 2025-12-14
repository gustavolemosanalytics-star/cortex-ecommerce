import { ReactNode } from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  dot?: boolean;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-dark-600 text-dark-200',
    success: 'bg-emerald-500/20 text-emerald-400',
    warning: 'bg-amber-500/20 text-amber-400',
    danger: 'bg-red-500/20 text-red-400',
    info: 'bg-blue-500/20 text-blue-400',
    primary: 'bg-primary-500/20 text-primary-400',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const dotColors = {
    default: 'bg-dark-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    info: 'bg-blue-400',
    primary: 'bg-primary-400',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])}
        />
      )}
      {children}
    </span>
  );
}

// Change badge with arrow
interface ChangeBadgeProps {
  value: number;
  className?: string;
}

export function ChangeBadge({ value, className = '' }: ChangeBadgeProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
        isPositive && 'bg-emerald-500/20 text-emerald-400',
        isNegative && 'bg-red-500/20 text-red-400',
        !isPositive && !isNegative && 'bg-dark-600 text-dark-400',
        className
      )}
    >
      {isPositive && '↑'}
      {isNegative && '↓'}
      {!isPositive && !isNegative && '→'}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

// Status indicator
interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'warning' | 'error';
  label?: string;
  pulse?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  label,
  pulse = true,
  className = '',
}: StatusIndicatorProps) {
  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-dark-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
  };

  return (
    <span className={clsx('inline-flex items-center gap-2', className)}>
      <span className="relative flex h-2.5 w-2.5">
        {pulse && status === 'online' && (
          <span
            className={clsx(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              statusColors[status]
            )}
          />
        )}
        <span
          className={clsx(
            'relative inline-flex rounded-full h-2.5 w-2.5',
            statusColors[status]
          )}
        />
      </span>
      {label && <span className="text-sm text-dark-300">{label}</span>}
    </span>
  );
}
