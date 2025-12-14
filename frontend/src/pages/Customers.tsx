import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { customersApi } from '../services/api';
import { Layout } from '../components/layout';
import { Card, CardHeader, Badge } from '../components/ui';
import { KPICard, KPIGrid } from '../components/dashboard';
import { CustomPieChart } from '../components/charts';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { rfmSegmentColors, channelColors } from '../utils/colors';
import {
  Users,
  UserPlus,
  Repeat,
  AlertTriangle,
  Crown,
  UserX,
} from 'lucide-react';

export function Customers() {
  const [period, setPeriod] = useState('30d');

  const { data: distribution } = useQuery({
    queryKey: ['customers-distribution'],
    queryFn: customersApi.getDistribution,
  });

  const { data: rfmSegments } = useQuery({
    queryKey: ['customers-rfm'],
    queryFn: customersApi.getRFMSegments,
  });

  const { data: cohortData } = useQuery({
    queryKey: ['customers-cohort'],
    queryFn: customersApi.getCohortAnalysis,
  });

  const { data: ltvByCohort } = useQuery({
    queryKey: ['customers-ltv-cohort'],
    queryFn: customersApi.getLTVByCohort,
  });

  // Prepare RFM chart data
  const rfmChartData = rfmSegments?.map((s) => ({
    name: s.segment,
    value: s.count,
    color: rfmSegmentColors[s.segment],
  })) || [];

  // Get unique cohort months for the heatmap
  const cohortMonths = [...new Set(cohortData?.map((c: any) => c.cohort_month) || [])].slice(0, 6);

  return (
    <Layout
      title="Clientes"
      subtitle="Análise de clientes e segmentação"
      period={period}
      onPeriodChange={setPeriod}
    >
      <div className="space-y-6">
        {/* KPIs */}
        <KPIGrid columns={3}>
          <KPICard
            title="Total de Clientes"
            value={distribution?.total_customers || 0}
            icon={<Users className="w-5 h-5" />}
            format="number"
            iconColor="bg-blue-500/20 text-blue-400"
          />
          <KPICard
            title="Novos (30d)"
            value={distribution?.new_customers_30d || 0}
            icon={<UserPlus className="w-5 h-5" />}
            format="number"
            iconColor="bg-emerald-500/20 text-emerald-400"
          />
          <KPICard
            title="Taxa de Recompra"
            value={distribution?.repeat_rate || 0}
            icon={<Repeat className="w-5 h-5" />}
            format="percent"
            iconColor="bg-purple-500/20 text-purple-400"
          />
        </KPIGrid>

        {/* Secondary metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-800 border border-dark-700 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 text-dark-400 mb-2">
              <Repeat className="w-4 h-4" />
              <span className="text-xs">Clientes Recorrentes</span>
            </div>
            <p className="text-xl font-bold text-white">
              {formatNumber(distribution?.repeat_customers || 0)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-dark-800 border border-dark-700 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 text-dark-400 mb-2">
              <Crown className="w-4 h-4" />
              <span className="text-xs">Clientes VIP</span>
            </div>
            <p className="text-xl font-bold text-white">
              {formatNumber(distribution?.vip_customers || 0)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-dark-800 border border-dark-700 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 text-dark-400 mb-2">
              <UserX className="w-4 h-4" />
              <span className="text-xs">Churned</span>
            </div>
            <p className="text-xl font-bold text-white">
              {formatNumber(distribution?.churned_customers || 0)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-dark-800 border border-dark-700 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 text-dark-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs">Taxa de Churn</span>
            </div>
            <p className="text-xl font-bold text-amber-400">
              {formatPercent(distribution?.churn_rate || 0)}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RFM Segmentation */}
          <Card>
            <CardHeader
              title="Segmentação RFM"
              subtitle="Distribuição de clientes por segmento"
            />
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <CustomPieChart
                  data={rfmChartData}
                  height={250}
                  innerRadius={50}
                  outerRadius={90}
                  showLegend={false}
                />
              </div>
              <div className="flex-1 space-y-2">
                {rfmSegments?.map((segment) => (
                  <div
                    key={segment.segment}
                    className="flex items-center justify-between p-2 bg-dark-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: rfmSegmentColors[segment.segment] }}
                      />
                      <span className="text-sm text-white">{segment.segment}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-dark-400">
                        {segment.count} ({segment.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Customers by Channel */}
          <Card>
            <CardHeader
              title="Aquisição por Canal"
              subtitle="Origem dos clientes"
            />
            <div className="space-y-3">
              {distribution?.by_channel?.map((channel: any, index: number) => (
                <motion.div
                  key={channel.channel}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: channelColors[channel.channel] }}
                      />
                      <span className="text-sm text-white">{channel.channel}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-dark-400">
                        {channel.count} clientes
                      </span>
                      <span className="text-sm font-medium text-white">
                        {formatCurrency(channel.revenue)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: channelColors[channel.channel] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${channel.percentage}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* Cohort Analysis */}
        <Card>
          <CardHeader
            title="Análise de Cohort"
            subtitle="Retenção de clientes por mês de aquisição"
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-dark-400 pb-3">
                    Cohort
                  </th>
                  <th className="text-center text-xs font-medium text-dark-400 pb-3">
                    Tamanho
                  </th>
                  {[...Array(6)].map((_, i) => (
                    <th
                      key={i}
                      className="text-center text-xs font-medium text-dark-400 pb-3"
                    >
                      Mês {i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortMonths.map((month) => {
                  const cohortRows = cohortData?.filter(
                    (c: any) => c.cohort_month === month
                  ) || [];
                  const firstRow = cohortRows[0];

                  return (
                    <tr key={month} className="border-t border-dark-700">
                      <td className="py-3 text-sm text-white">{month}</td>
                      <td className="py-3 text-center text-sm text-dark-400">
                        {firstRow?.cohort_size || 0}
                      </td>
                      {[...Array(6)].map((_, monthIndex) => {
                        const data = cohortRows.find(
                          (c: any) => c.months_since_acquisition === monthIndex
                        );
                        const retention = data?.retention_rate || 0;

                        return (
                          <td key={monthIndex} className="py-3 text-center">
                            <span
                              className="inline-block w-12 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: `rgba(99, 102, 241, ${retention / 100})`,
                                color: retention > 50 ? 'white' : '#94a3b8',
                              }}
                            >
                              {retention.toFixed(0)}%
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* LTV by Cohort */}
        <Card>
          <CardHeader
            title="LTV por Cohort e Canal"
            subtitle="Valor vitalício por mês de aquisição"
          />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left text-xs font-medium text-dark-400 py-3">
                    Cohort
                  </th>
                  <th className="text-left text-xs font-medium text-dark-400 py-3">
                    Canal
                  </th>
                  <th className="text-right text-xs font-medium text-dark-400 py-3">
                    Clientes
                  </th>
                  <th className="text-right text-xs font-medium text-dark-400 py-3">
                    LTV Médio
                  </th>
                  <th className="text-right text-xs font-medium text-dark-400 py-3">
                    Pedidos Médios
                  </th>
                </tr>
              </thead>
              <tbody>
                {ltvByCohort?.slice(0, 10).map((row: any, index: number) => (
                  <tr key={index} className="border-b border-dark-700/50">
                    <td className="py-3 text-sm text-white">{row.cohort_month}</td>
                    <td className="py-3">
                      <Badge
                        variant={row.acquisition_channel?.includes('Paid') ? 'primary' : 'default'}
                        size="sm"
                      >
                        {row.acquisition_channel || 'N/A'}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-sm text-dark-400">
                      {row.cohort_size}
                    </td>
                    <td className="py-3 text-right text-sm font-medium text-white">
                      {formatCurrency(row.avg_ltv)}
                    </td>
                    <td className="py-3 text-right text-sm text-dark-400">
                      {row.avg_orders?.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
