import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SpotlightCard } from '../animations';
import { CurrencyCounter, AnimatedCounter, PercentCounter } from '../animations';
import { toNumber } from '../../utils/formatters';

interface KPICardProps {
  title: string;
  value: number | string;
  change?: number | string | null;
  changeLabel?: string;
  icon: ReactNode;
  format?: 'currency' | 'number' | 'percent';
  iconColor?: string;
  delay?: number;
}

export function KPICard({
  title,
  value,
  change,
  changeLabel = 'vs período anterior',
  icon,
  format = 'currency',
  iconColor = 'bg-primary-500/20 text-primary-400',
  delay = 0,
}: KPICardProps) {
  const numericValue = toNumber(value);
  const numericChange = toNumber(change);
  const isPositive = change !== null && change !== undefined && numericChange > 0;
  const isNegative = change !== null && change !== undefined && numericChange < 0;

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  const renderValue = () => {
    switch (format) {
      case 'currency':
        return <CurrencyCounter value={numericValue} className="text-2xl md:text-3xl font-bold text-white" />;
      case 'percent':
        return <PercentCounter value={numericValue} className="text-2xl md:text-3xl font-bold text-white" />;
      default:
        return (
          <AnimatedCounter
            value={numericValue}
            className="text-2xl md:text-3xl font-bold text-white"
          />
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <SpotlightCard className="p-4 md:p-6 h-full">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-medium text-dark-400">{title}</h3>
          <div className={clsx('p-2 rounded-lg', iconColor)}>
            {icon}
          </div>
        </div>

        <div className="mb-2">{renderValue()}</div>

        {change !== null && change !== undefined && (
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                'inline-flex items-center gap-1 text-sm font-medium',
                isPositive && 'text-emerald-400',
                isNegative && 'text-red-400',
                !isPositive && !isNegative && 'text-dark-400'
              )}
            >
              <TrendIcon className="w-4 h-4" />
              {Math.abs(numericChange).toFixed(1)}%
            </span>
            <span className="text-xs text-dark-500">{changeLabel}</span>
          </div>
        )}
      </SpotlightCard>
    </motion.div>
  );
}

// Mini KPI for inline display
interface MiniKPIProps {
  label: string;
  value: string | number;
  change?: number | string;
  className?: string;
}

export function MiniKPI({ label, value, change, className = '' }: MiniKPIProps) {
  const numericChange = toNumber(change);
  const isPositive = change !== undefined && numericChange > 0;
  const isNegative = change !== undefined && numericChange < 0;

  return (
    <div className={clsx('flex items-center justify-between', className)}>
      <span className="text-sm text-dark-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white">{value}</span>
        {change !== undefined && (
          <span
            className={clsx(
              'text-xs',
              isPositive && 'text-emerald-400',
              isNegative && 'text-red-400',
              !isPositive && !isNegative && 'text-dark-400'
            )}
          >
            {isPositive && '+'}
            {numericChange.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

// KPI Grid component
interface KPIGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function KPIGrid({ children, columns = 4, className = '' }: KPIGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={clsx('grid grid-cols-1 gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}
