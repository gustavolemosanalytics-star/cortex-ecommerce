import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Repeat,
  Target,
  CreditCard,
  UserPlus,
} from 'lucide-react';
import { dashboardApi } from '../services/api';
import { Layout } from '../components/layout';
import { Card, CardHeader, DashboardSkeleton } from '../components/ui';
import { KPICard, KPIGrid, AlertsList } from '../components/dashboard';
import { RevenueChart } from '../components/charts';
import { CustomBarChart, CustomPieChart } from '../components/charts';
import { GradientText } from '../components/animations';
import { formatCurrency, formatNumber, formatROAS } from '../utils/formatters';
import { channelColors } from '../utils/colors';
import { useState } from 'react';

export function Dashboard() {
  const [period, setPeriod] = useState('30d');

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis', period],
    queryFn: () => dashboardApi.getKPIs(period),
  });

  const { data: revenueChart, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard-revenue-chart', period],
    queryFn: () => dashboardApi.getRevenueChart(period),
  });

  const { data: topProducts } = useQuery({
    queryKey: ['dashboard-top-products', period],
    queryFn: () => dashboardApi.getTopProducts(5, period),
  });

  const { data: topChannels } = useQuery({
    queryKey: ['dashboard-top-channels', period],
    queryFn: () => dashboardApi.getTopChannels(period),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: dashboardApi.getAlerts,
  });

  const isLoading = kpisLoading || chartLoading;

  if (isLoading) {
    return (
      <Layout
        title="Dashboard"
        subtitle="Visão geral do seu e-commerce"
        period={period}
        onPeriodChange={setPeriod}
      >
        <DashboardSkeleton />
      </Layout>
    );
  }

  const channelChartData = topChannels?.map((c) => ({
    name: c.channel,
    value: c.revenue,
    color: channelColors[c.channel],
  })) || [];

  return (
    <Layout
      title="Dashboard"
      subtitle="Visão geral do seu e-commerce"
      period={period}
      onPeriodChange={setPeriod}
    >
      <div className="space-y-6">
        {/* Welcome message */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Bem-vindo ao <GradientText text="Cortex Analytics" />
          </h2>
          <p className="text-dark-400 mt-2">
            Aqui está o resumo do desempenho do seu e-commerce
          </p>
        </motion.div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader title="Alertas Inteligentes" subtitle="Atenção necessária" />
              <AlertsList alerts={alerts.slice(0, 3)} />
            </Card>
          </motion.div>
        )}

        {/* KPI Cards */}
        <KPIGrid>
          <KPICard
            title="Receita Total"
            value={kpis?.total_revenue || 0}
            change={kpis?.revenue_change}
            icon={<DollarSign className="w-5 h-5" />}
            format="currency"
            iconColor="bg-emerald-500/20 text-emerald-400"
            delay={0}
          />
          <KPICard
            title="Pedidos"
            value={kpis?.total_orders || 0}
            change={kpis?.orders_change}
            icon={<ShoppingCart className="w-5 h-5" />}
            format="number"
            iconColor="bg-blue-500/20 text-blue-400"
            delay={0.1}
          />
          <KPICard
            title="Clientes"
            value={kpis?.total_customers || 0}
            change={kpis?.customers_change}
            icon={<Users className="w-5 h-5" />}
            format="number"
            iconColor="bg-purple-500/20 text-purple-400"
            delay={0.2}
          />
          <KPICard
            title="Ticket Médio"
            value={kpis?.avg_order_value || 0}
            change={kpis?.aov_change}
            icon={<CreditCard className="w-5 h-5" />}
            format="currency"
            iconColor="bg-amber-500/20 text-amber-400"
            delay={0.3}
          />
        </KPIGrid>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-dark-800 border border-dark-700 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 text-dark-400 mb-2">
              <UserPlus className="w-4 h-4" />
              <span className="text-xs">Novos Clientes</span>
            </div>
            <p className="text-xl font-bold text-white">
              {formatNumber(kpis?.new_customers || 0)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-dark-800 border border-dark-700 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 text-dark-400 mb-2">
              <Repeat className="w-4 h-4" />
              <span className="text-xs">Taxa de Recompra</span>
            </div>
            <p className="text-xl font-bold text-white">
              {kpis?.repeat_rate?.toFixed(1) || 0}%
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-dark-800 border border-dark-700 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 text-dark-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">ROAS</span>
            </div>
            <p className="text-xl font-bold text-white">
              {formatROAS(kpis?.roas)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-dark-800 border border-dark-700 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 text-dark-400 mb-2">
              <Target className="w-4 h-4" />
              <span className="text-xs">CAC</span>
            </div>
            <p className="text-xl font-bold text-white">
              {kpis?.cac ? formatCurrency(kpis.cac) : '-'}
            </p>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader
                title="Receita e Pedidos"
                subtitle="Evolução no período"
              />
              <RevenueChart data={revenueChart || []} height={300} />
            </Card>
          </motion.div>

          {/* Channel Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader
                title="Receita por Canal"
                subtitle="Distribuição de vendas"
              />
              <CustomPieChart
                data={channelChartData}
                height={300}
                innerRadius={70}
                outerRadius={110}
              />
            </Card>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader title="Top Produtos" subtitle="Mais vendidos no período" />
              <div className="space-y-3">
                {topProducts?.map((product, index) => (
                  <div
                    key={product.product_id}
                    className="flex items-center gap-4 p-3 bg-dark-700/50 rounded-lg"
                  >
                    <span className="w-6 h-6 flex items-center justify-center bg-primary-500/20 text-primary-400 rounded-full text-xs font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {product.product_name}
                      </p>
                      <p className="text-xs text-dark-400">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {formatCurrency(product.revenue)}
                      </p>
                      <p className="text-xs text-dark-400">
                        {product.units_sold} vendidos
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Top Channels */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader title="Performance por Canal" subtitle="Receita e participação" />
              <CustomBarChart
                data={topChannels?.map((c) => ({
                  name: c.channel,
                  value: c.revenue,
                })) || []}
                height={280}
                horizontal
              />
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
