import { SelectHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: Option[];
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export function Select({
  options,
  label,
  error,
  fullWidth = false,
  className = '',
  ...props
}: SelectProps) {
  return (
    <div className={clsx(fullWidth && 'w-full')}>
      {label && (
        <label className="block text-sm font-medium text-dark-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={clsx(
            'appearance-none bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 pr-10',
            'text-sm text-white placeholder-dark-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            fullWidth && 'w-full',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}

// Period selector component
interface PeriodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function PeriodSelector({
  value,
  onChange,
  className = '',
}: PeriodSelectorProps) {
  const periods = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '60d', label: '60 dias' },
    { value: '90d', label: '90 dias' },
    { value: '1y', label: '1 ano' },
  ];

  return (
    <div className={clsx('flex items-center gap-1 bg-dark-700 rounded-lg p-1', className)}>
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={clsx(
            'px-3 py-1.5 text-sm rounded-md transition-all duration-200',
            value === period.value
              ? 'bg-primary-600 text-white'
              : 'text-dark-400 hover:text-white hover:bg-dark-600'
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

// Tab selector
interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabSelectorProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function TabSelector({
  tabs,
  activeTab,
  onChange,
  className = '',
}: TabSelectorProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-1 border-b border-dark-700',
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 -mb-px',
            activeTab === tab.id
              ? 'text-primary-400 border-primary-500'
              : 'text-dark-400 border-transparent hover:text-white hover:border-dark-500'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
