import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { marketingApi } from '../services/api';
import { Layout } from '../components/layout';
import { Card, CardHeader, Badge } from '../components/ui';
import { CustomPieChart, CustomBarChart } from '../components/charts';
import { AnimatedCounter } from '../components/animations';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { channelColors, chartColorsArray } from '../utils/colors';
import {
  Megaphone,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  BarChart3,
  Zap,
} from 'lucide-react';

export function Marketing() {
  const [period, setPeriod] = useState('30d');

  const { data: campaigns } = useQuery({
    queryKey: ['marketing-campaigns', period],
    queryFn: () => marketingApi.getCampaignPerformance(period),
  });

  const { data: roasByPlatform } = useQuery({
    queryKey: ['marketing-roas', period],
    queryFn: () => marketingApi.getROASByPlatform(period),
  });

  const { data: spendRevenue } = useQuery({
    queryKey: ['marketing-spend-revenue', period],
    queryFn: () => marketingApi.getSpendRevenue(period),
  });

  const { data: attribution } = useQuery({
    queryKey: ['marketing-attribution', period],
    queryFn: () => marketingApi.getAttribution(period),
  });

  // Platform performance chart data
  const platformChartData = roasByPlatform?.map((p: any) => ({
    name: p.platform,
    value: Number(p.revenue),
  })) || [];

  // Attribution chart data
  const attributionChartData = attribution?.map((a: any) => ({
    name: a.channel,
    value: a.conversions,
  })) || [];

  // Calculate totals
  const totals = campaigns?.reduce(
    (acc: any, c: any) => ({
      spend: acc.spend + Number(c.total_spend),
      revenue: acc.revenue + Number(c.total_revenue),
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      conversions: acc.conversions + c.conversions,
    }),
    { spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0 }
  ) || { spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0 };

  const overallROAS = totals.spend > 0 ? totals.revenue / totals.spend : 0;
  const overallCTR = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const overallCVR = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;

  return (
    <Layout
      title="Marketing"
      subtitle="Performance de campanhas e ROI"
      period={period}
      onPeriodChange={setPeriod}
    >
      <div className="space-y-6">
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-800 border border-dark-700 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-sm text-dark-400">Investimento</span>
            </div>
            <div className="text-2xl font-bold text-white">
              <AnimatedCounter value={totals.spend} prefix="R$ " decimals={0} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-dark-800 border border-dark-700 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm text-dark-400">Receita Atribuída</span>
            </div>
            <div className="text-2xl font-bold text-white">
              <AnimatedCounter value={totals.revenue} prefix="R$ " decimals={0} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-dark-800 border border-dark-700 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-400" />
              </div>
              <span className="text-sm text-dark-400">ROAS Geral</span>
            </div>
            <div className="text-2xl font-bold text-white">
              <AnimatedCounter value={overallROAS} suffix="x" decimals={2} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-dark-800 border border-dark-700 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-sm text-dark-400">Conversões</span>
            </div>
            <div className="text-2xl font-bold text-white">
              <AnimatedCounter value={totals.conversions} decimals={0} />
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Platform Performance */}
          <Card>
            <CardHeader
              title="Receita por Plataforma"
              subtitle="Distribuição de receita atribuída"
            />
            <CustomPieChart
              data={platformChartData}
              height={300}
              innerRadius={60}
              outerRadius={100}
            />
          </Card>

          {/* Attribution Model */}
          <Card>
            <CardHeader
              title="Modelo de Atribuição"
              subtitle="Conversões por canal"
            />
            <CustomBarChart
              data={attributionChartData}
              height={300}
              horizontal
            />
          </Card>
        </div>

        {/* Platform ROAS */}
        <Card>
          <CardHeader
            title="ROAS por Plataforma"
            subtitle="Retorno sobre investimento publicitário"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roasByPlatform?.map((platform: any, index: number) => (
              <motion.div
                key={platform.platform}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-dark-700/50 rounded-lg border border-dark-600"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white">
                    {platform.platform}
                  </span>
                  <Badge
                    variant={
                      Number(platform.roas) >= 3
                        ? 'success'
                        : Number(platform.roas) >= 2
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {Number(platform.roas).toFixed(2)}x
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-dark-400">Investimento</span>
                    <span className="text-white">
                      {formatCurrency(platform.spend)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-dark-400">Receita</span>
                    <span className="text-emerald-400">
                      {formatCurrency(platform.revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-dark-400">Conversões</span>
                    <span className="text-white">{platform.conversions}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-dark-400">CPA</span>
                    <span className="text-white">
                      {formatCurrency(platform.cpa)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Campaigns Table */}
        <Card>
          <CardHeader
            title="Campanhas"
            subtitle="Performance detalhada por campanha"
            action={<Megaphone className="w-5 h-5 text-primary-400" />}
          />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left text-xs font-medium text-dark-400 py-3">
                    Campanha
                  </th>
                  <th className="text-left text-xs font-medium text-dark-400 py-3">
                    Plataforma
                  </th>
                  <th className="text-center text-xs font-medium text-dark-400 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs font-medium text-dark-400 py-3">
                    Investimento
                  </th>
                  <th className="text-right text-xs font-medium text-dark-400 py-3">
                    Receita
                  </th>
                  <th className="text-right text-xs font-medium text-dark-400 py-3">
                    ROAS
                  </th>
                  <th className="text-right text-xs font-medium text-dark-400 py-3">
                    CTR
                  </th>
                  <th className="text-right text-xs font-medium text-dark-400 py-3">
                    Conversões
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns?.map((campaign: any) => (
                  <motion.tr
                    key={campaign.campaign_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-dark-700/50 hover:bg-dark-700/30"
                  >
                    <td className="py-4">
                      <span className="text-sm font-medium text-white">
                        {campaign.campaign_name}
                      </span>
                    </td>
                    <td className="py-4">
                      <span
                        className="text-sm px-2 py-1 rounded"
                        style={{
                          backgroundColor: `${channelColors[campaign.platform] || '#6366f1'}20`,
                          color: channelColors[campaign.platform] || '#6366f1',
                        }}
                      >
                        {campaign.platform}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <Badge
                        variant={
                          campaign.status === 'active'
                            ? 'success'
                            : campaign.status === 'paused'
                            ? 'warning'
                            : 'info'
                        }
                        size="sm"
                      >
                        {campaign.status}
                      </Badge>
                    </td>
                    <td className="py-4 text-right text-sm text-dark-400">
                      {formatCurrency(campaign.total_spend)}
                    </td>
                    <td className="py-4 text-right text-sm font-medium text-white">
                      {formatCurrency(campaign.total_revenue)}
                    </td>
                    <td className="py-4 text-right">
                      <span
                        className={`text-sm font-medium ${
                          Number(campaign.roas) >= 3
                            ? 'text-emerald-400'
                            : Number(campaign.roas) >= 2
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        {Number(campaign.roas).toFixed(2)}x
                      </span>
                    </td>
                    <td className="py-4 text-right text-sm text-dark-400">
                      {campaign.ctr?.toFixed(2)}%
                    </td>
                    <td className="py-4 text-right text-sm text-dark-400">
                      {formatNumber(campaign.conversions)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Spend vs Revenue Chart */}
        <Card>
          <CardHeader
            title="Investimento vs Receita"
            subtitle="Evolução temporal"
          />
          <div className="space-y-4">
            {spendRevenue?.slice(0, 12).map((item: any, index: number) => (
              <motion.div
                key={item.date}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4"
              >
                <span className="text-xs text-dark-400 w-20">
                  {new Date(item.date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
                <div className="flex-1 flex gap-2">
                  <div
                    className="h-6 bg-red-500/30 rounded flex items-center justify-end px-2"
                    style={{
                      width: `${Math.min(
                        (Number(item.spend) / Math.max(...spendRevenue.map((s: any) => Number(s.revenue)))) * 100,
                        100
                      )}%`,
                    }}
                  >
                    <span className="text-xs text-red-300">
                      {formatCurrency(item.spend)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 flex gap-2">
                  <div
                    className="h-6 bg-emerald-500/30 rounded flex items-center px-2"
                    style={{
                      width: `${Math.min(
                        (Number(item.revenue) / Math.max(...spendRevenue.map((s: any) => Number(s.revenue)))) * 100,
                        100
                      )}%`,
                    }}
                  >
                    <span className="text-xs text-emerald-300">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={Number(item.roas) >= 2 ? 'success' : 'warning'}
                  size="sm"
                >
                  {Number(item.roas).toFixed(1)}x
                </Badge>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-center gap-8 mt-6 pt-4 border-t border-dark-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500/30 rounded" />
              <span className="text-xs text-dark-400">Investimento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500/30 rounded" />
              <span className="text-xs text-dark-400">Receita</span>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
