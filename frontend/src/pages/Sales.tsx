import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { salesApi } from '../services/api';
import { Layout } from '../components/layout';
import { Card, CardHeader, TabSelector } from '../components/ui';
import { KPICard, KPIGrid } from '../components/dashboard';
import { formatCurrency, formatNumber, formatDate, formatCompact } from '../utils/formatters';
import { channelColors, chartColorsArray } from '../utils/colors';
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
} from 'lucide-react';

export function Sales() {
  const [period, setPeriod] = useState('30d');
  const [groupBy, setGroupBy] = useState('day');

  const { data: overview } = useQuery({
    queryKey: ['sales-overview', period],
    queryFn: () => salesApi.getOverview(period),
  });

  const { data: byChannel } = useQuery({
    queryKey: ['sales-by-channel', period],
    queryFn: () => salesApi.getByChannel(period),
  });

  const { data: byPeriod } = useQuery({
    queryKey: ['sales-by-period', groupBy, period],
    queryFn: () => salesApi.getByPeriod(groupBy, period),
  });

  const { data: funnel } = useQuery({
    queryKey: ['sales-funnel', period],
    queryFn: () => salesApi.getFunnel(period),
  });

  const { data: comparison } = useQuery({
    queryKey: ['sales-comparison'],
    queryFn: salesApi.getComparison,
  });

  const tabs = [
    { id: 'day', label: 'Diário' },
    { id: 'week', label: 'Semanal' },
    { id: 'month', label: 'Mensal' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="text-sm font-medium text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'revenue' ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Layout
      title="Vendas"
      subtitle="Análise detalhada de vendas"
      period={period}
      onPeriodChange={setPeriod}
    >
      <div className="space-y-6">
        {/* KPIs */}
        <KPIGrid>
          <KPICard
            title="Receita"
            value={overview?.current?.revenue || 0}
            change={overview?.changes?.revenue}
            icon={<DollarSign className="w-5 h-5" />}
            format="currency"
            iconColor="bg-emerald-500/20 text-emerald-400"
          />
          <KPICard
            title="Pedidos"
            value={overview?.current?.orders || 0}
            change={overview?.changes?.orders}
            icon={<ShoppingCart className="w-5 h-5" />}
            format="number"
            iconColor="bg-blue-500/20 text-blue-400"
          />
          <KPICard
            title="Clientes"
            value={overview?.current?.customers || 0}
            change={overview?.changes?.customers}
            icon={<Users className="w-5 h-5" />}
            format="number"
            iconColor="bg-purple-500/20 text-purple-400"
          />
          <KPICard
            title="Ticket Médio"
            value={overview?.current?.aov || 0}
            change={overview?.changes?.aov}
            icon={<TrendingUp className="w-5 h-5" />}
            format="currency"
            iconColor="bg-amber-500/20 text-amber-400"
          />
        </KPIGrid>

        {/* Period comparison */}
        {comparison && (
          <Card>
            <CardHeader title="Comparativo de Períodos" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(comparison).map(([key, data]: [string, any]) => (
                <div key={key} className="p-4 bg-dark-700/50 rounded-lg">
                  <p className="text-xs text-dark-400 mb-1">
                    {key === 'today' && 'Hoje'}
                    {key === 'yesterday' && 'Ontem'}
                    {key === 'last_7_days' && '7 dias'}
                    {key === 'last_30_days' && '30 dias'}
                    {key === 'this_month' && 'Este mês'}
                    {key === 'last_month' && 'Mês passado'}
                  </p>
                  <p className="text-lg font-bold text-white">
                    {formatCurrency(data.revenue)}
                  </p>
                  <p className="text-xs text-dark-400">
                    {data.orders} pedidos
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Revenue over time */}
        <Card>
          <CardHeader
            title="Receita ao Longo do Tempo"
            action={
              <TabSelector
                tabs={tabs}
                activeTab={groupBy}
                onChange={setGroupBy}
              />
            }
          />
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={byPeriod || []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="period"
                tickFormatter={(v) => formatDate(v)}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis
                tickFormatter={formatCompact}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales by Channel */}
          <Card>
            <CardHeader title="Vendas por Canal" subtitle="Distribuição de receita" />
            <div className="space-y-4">
              {byChannel?.map((channel, index) => (
                <motion.div
                  key={channel.channel}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: channelColors[channel.channel] || chartColorsArray[index] }}
                      />
                      <span className="text-sm text-white">{channel.channel}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-white">
                        {formatCurrency(channel.revenue)}
                      </span>
                      <span className="text-xs text-dark-400 ml-2">
                        ({channel.percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: channelColors[channel.channel] || chartColorsArray[index] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${channel.percentage}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader title="Funil de Conversão" subtitle="Jornada do cliente" />
            <div className="space-y-4 py-4">
              {funnel?.map((stage: any, index: number) => {
                const widthPercent = Math.max(20, stage.percentage);
                return (
                  <motion.div
                    key={stage.stage}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.15 }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-28 text-sm text-dark-400">{stage.stage}</div>
                    <div className="flex-1">
                      <div
                        className="h-10 rounded-lg flex items-center justify-center relative overflow-hidden"
                        style={{
                          width: `${widthPercent}%`,
                          background: `linear-gradient(90deg, ${chartColorsArray[index]}, ${chartColorsArray[index]}88)`,
                        }}
                      >
                        <span className="text-sm font-medium text-white z-10">
                          {formatNumber(stage.count)}
                        </span>
                      </div>
                    </div>
                    <div className="w-20 text-right">
                      <span className="text-sm text-dark-400">
                        {stage.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
