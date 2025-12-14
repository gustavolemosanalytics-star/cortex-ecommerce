import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, RefreshCw, Menu, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../services/api';
import { AlertsList, AlertBadge } from '../dashboard';
import { StatusIndicator } from '../ui';
import { PeriodSelector } from '../ui/Select';

interface HeaderProps {
  title: string;
  subtitle?: string;
  period: string;
  onPeriodChange: (period: string) => void;
  onMobileMenuToggle?: () => void;
}

export function Header({
  title,
  subtitle,
  period,
  onPeriodChange,
  onMobileMenuToggle,
}: HeaderProps) {
  const [showAlerts, setShowAlerts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: alerts = [], refetch, isFetching } = useQuery({
    queryKey: ['alerts'],
    queryFn: dashboardApi.getAlerts,
    refetchInterval: 60000, // Refetch every minute
  });

  const hasDanger = alerts.some((a) => a.alert_type === 'danger');
  const hasWarning = alerts.some((a) => a.alert_type === 'warning');

  return (
    <header className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-lg md:text-xl font-semibold text-white">{title}</h1>
            {subtitle && (
              <p className="text-sm text-dark-400 hidden md:block">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Search - Hidden on mobile */}
          <div className="hidden md:flex items-center relative">
            <Search className="absolute left-3 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 lg:w-64 pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-sm text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Period selector - Hidden on small screens */}
          <div className="hidden lg:block">
            <PeriodSelector value={period} onChange={onPeriodChange} />
          </div>

          {/* Status indicator */}
          <StatusIndicator status="online" label="Live" pulse />

          {/* Refresh button */}
          <button
            onClick={() => refetch()}
            className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
            disabled={isFetching}
          >
            <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          {/* Alerts button */}
          <div className="relative">
            <button
              onClick={() => setShowAlerts(!showAlerts)}
              className="relative p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {alerts.length > 0 && (
                <span className="absolute top-1 right-1">
                  <AlertBadge
                    count={alerts.length}
                    hasDanger={hasDanger}
                    hasWarning={hasWarning}
                  />
                </span>
              )}
            </button>

            {/* Alerts dropdown */}
            <AnimatePresence>
              {showAlerts && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowAlerts(false)}
                  />

                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 md:w-96 bg-dark-800 border border-dark-700 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-dark-700">
                      <h3 className="font-medium text-white">Alertas</h3>
                      <button
                        onClick={() => setShowAlerts(false)}
                        className="text-dark-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4 max-h-96 overflow-y-auto">
                      {alerts.length > 0 ? (
                        <AlertsList alerts={alerts} />
                      ) : (
                        <p className="text-center text-dark-400 py-8">
                          Nenhum alerta no momento
                        </p>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User avatar */}
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            CA
          </div>
        </div>
      </div>

      {/* Mobile period selector */}
      <div className="lg:hidden px-4 pb-3">
        <PeriodSelector value={period} onChange={onPeriodChange} className="w-full" />
      </div>
    </header>
  );
}
