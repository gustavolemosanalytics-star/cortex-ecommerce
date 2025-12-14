import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import type { Alert } from '../../types';

interface AlertCardProps {
  alert: Alert;
  onDismiss?: (id: string) => void;
}

export function AlertCard({ alert, onDismiss }: AlertCardProps) {
  const typeConfig = {
    danger: {
      icon: AlertCircle,
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      iconColor: 'text-red-400',
      textColor: 'text-red-400',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-400',
      textColor: 'text-amber-400',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
      textColor: 'text-blue-400',
    },
  };

  const config = typeConfig[alert.alert_type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={clsx(
        'flex items-start gap-3 p-4 rounded-lg border',
        config.bgColor,
        config.borderColor
      )}
    >
      <Icon className={clsx('w-5 h-5 mt-0.5 flex-shrink-0', config.iconColor)} />
      <div className="flex-1 min-w-0">
        <h4 className={clsx('font-medium', config.textColor)}>{alert.title}</h4>
        <p className="text-sm text-dark-300 mt-1">{alert.message}</p>
        {alert.change_percent !== null && alert.change_percent !== undefined && (
          <p className="text-xs text-dark-400 mt-2">
            Variação: {alert.change_percent > 0 ? '+' : ''}
            {alert.change_percent.toFixed(1)}%
          </p>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={() => onDismiss(alert.alert_id)}
          className="text-dark-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}

// Alerts container
interface AlertsListProps {
  alerts: Alert[];
  onDismiss?: (id: string) => void;
  className?: string;
}

export function AlertsList({ alerts, onDismiss, className = '' }: AlertsListProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className={clsx('space-y-3', className)}>
      {alerts.map((alert) => (
        <AlertCard key={alert.alert_id} alert={alert} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// Compact alert badge for header
interface AlertBadgeProps {
  count: number;
  hasWarning?: boolean;
  hasDanger?: boolean;
}

export function AlertBadge({ count, hasWarning, hasDanger }: AlertBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full',
        hasDanger
          ? 'bg-red-500 text-white'
          : hasWarning
          ? 'bg-amber-500 text-white'
          : 'bg-blue-500 text-white'
      )}
    >
      {count}
    </span>
  );
}
