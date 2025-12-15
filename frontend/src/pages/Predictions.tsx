import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { predictionsApi } from '../services/api';
import { Layout } from '../components/layout';
import { Card, CardHeader, Badge, Button, Select } from '../components/ui';
import { RevenueChart, CustomBarChart } from '../components/charts';
import { AnimatedCounter, CurrencyCounter, GlowCard, SpotlightCard } from '../components/animations';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Lightbulb,
  Play,
  Calculator,
  Users,
  ShoppingCart,
  DollarSign,
} from 'lucide-react';

export function Predictions() {
  const [forecastDays, setForecastDays] = useState(30);
  const [simulatorParams, setSimulatorParams] = useState({
    ad_spend_change: 0,
    price_change: 0,
    new_products: 0,
  });

  const { data: salesForecast } = useQuery({
    queryKey: ['predictions-forecast', forecastDays],
    queryFn: () => predictionsApi.getSalesForecast(forecastDays),
  });

  const { data: churnRisk } = useQuery({
    queryKey: ['predictions-churn'],
    queryFn: predictionsApi.getChurnRisk,
  });

  const { data: recommendations } = useQuery({
    queryKey: ['predictions-recommendations'],
    queryFn: predictionsApi.getRecommendations,
  });

  const simulateMutation = useMutation({
    mutationFn: predictionsApi.simulate,
  });

  const handleSimulate = () => {
    simulateMutation.mutate(simulatorParams);
  };

  // Forecast chart data
  const forecastChartData = salesForecast?.predictions?.map((p: any) => ({
    date: p.date,
    revenue: p.predicted_revenue,
    orders: p.predicted_orders,
  })) || [];

  // Churn risk data for chart
  const churnChartData = [
    { name: 'Em Risco', value: churnRisk?.summary?.at_risk_count || 0 },
    { name: 'Alto Risco', value: churnRisk?.summary?.high_risk_count || 0 },
  ];

  // Summary stats
  const totalPredictedRevenue = forecastChartData.reduce(
    (sum: number, d: any) => sum + Number(d.revenue),
    0
  );
  const avgDailyRevenue = forecastChartData.length > 0
    ? totalPredictedRevenue / forecastChartData.length
    : 0;
  const totalAtRisk = (churnRisk?.summary?.at_risk_count || 0) + (churnRisk?.summary?.high_risk_count || 0);
  const atRiskRevenue = churnRisk?.summary?.total_revenue_at_risk || 0;

  const priorityColors: Record<string, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981',
  };

  const priorityVariants: Record<string, 'danger' | 'warning' | 'success'> = {
    high: 'danger',
    medium: 'warning',
    low: 'success',
  };

  return (
    <Layout
      title="Previsoes"
      subtitle="Analises preditivas e simulacoes"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlowCard glowColor="#6366f1">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary-400" />
                </div>
                <span className="text-sm text-dark-400">Receita Prevista</span>
              </div>
              <div className="text-2xl font-bold text-white">
                <CurrencyCounter value={totalPredictedRevenue} />
              </div>
              <p className="text-xs text-dark-400 mt-2">
                Proximos {forecastDays} dias
              </p>
            </div>
          </GlowCard>

          <GlowCard glowColor="#10b981">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-sm text-dark-400">Media Diaria</span>
              </div>
              <div className="text-2xl font-bold text-white">
                <CurrencyCounter value={avgDailyRevenue} />
              </div>
              <p className="text-xs text-dark-400 mt-2">
                Previsao de vendas
              </p>
            </div>
          </GlowCard>

          <GlowCard glowColor="#ef4444">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-sm text-dark-400">Clientes em Risco</span>
              </div>
              <div className="text-2xl font-bold text-white">
                <AnimatedCounter value={totalAtRisk} />
              </div>
              <p className="text-xs text-dark-400 mt-2">
                Risco de churn
              </p>
            </div>
          </GlowCard>

          <GlowCard glowColor="#f59e0b">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-sm text-dark-400">Receita em Risco</span>
              </div>
              <div className="text-2xl font-bold text-white">
                <CurrencyCounter value={atRiskRevenue} />
              </div>
              <p className="text-xs text-dark-400 mt-2">
                LTV dos clientes em risco
              </p>
            </div>
          </GlowCard>
        </div>

        {/* Sales Forecast */}
        <Card>
          <CardHeader
            title="Previsao de Vendas"
            subtitle="Forecast baseado em tendencias historicas"
            action={
              <Select
                value={forecastDays.toString()}
                onChange={(e) => setForecastDays(Number(e.target.value))}
                options={[
                  { value: '7', label: '7 dias' },
                  { value: '14', label: '14 dias' },
                  { value: '30', label: '30 dias' },
                  { value: '60', label: '60 dias' },
                  { value: '90', label: '90 dias' },
                ]}
              />
            }
          />
          <div className="mb-4 p-4 bg-dark-700/50 rounded-lg border border-dark-600">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-medium text-white">
                Modelo: {salesForecast?.model_info?.model_type || 'Linear Regression'}
              </span>
            </div>
            <p className="text-xs text-dark-400">
              Confianca: {formatPercent((salesForecast?.confidence || 0) * 100)} |
              Base de dados: {salesForecast?.model_info?.training_days || 0} dias de historico
            </p>
          </div>
          <RevenueChart data={forecastChartData} height={350} />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Churn Risk */}
          <Card>
            <CardHeader
              title="Risco de Churn"
              subtitle="Clientes com probabilidade de abandono"
              action={<AlertTriangle className="w-5 h-5 text-red-400" />}
            />
            <div className="mb-6">
              <CustomBarChart data={churnChartData} height={200} horizontal />
            </div>
            <div className="space-y-3">
              {churnRisk?.high_risk_customers?.slice(0, 5).map((customer: any, index: number) => (
                <motion.div
                  key={customer.customer_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Cliente #{customer.external_id || customer.customer_id}
                      </p>
                      <p className="text-xs text-dark-400">
                        {customer.days_since_last_order} dias sem comprar
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="danger" size="sm">
                      Score: {customer.risk_score}
                    </Badge>
                    <p className="text-xs text-dark-400 mt-1">
                      LTV: {formatCurrency(customer.total_revenue)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader
              title="Recomendacoes"
              subtitle="Sugestoes baseadas em dados"
              action={<Lightbulb className="w-5 h-5 text-amber-400" />}
            />
            <div className="space-y-4">
              {(recommendations?.recommendations || []).map((rec: any, index: number) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <SpotlightCard>
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: `${priorityColors[rec.priority]}20`,
                          }}
                        >
                          <Target
                            className="w-4 h-4"
                            style={{ color: priorityColors[rec.priority] }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-white">
                              {rec.title}
                            </h4>
                            <Badge
                              variant={priorityVariants[rec.priority]}
                              size="sm"
                            >
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-dark-400 mb-2">
                            {rec.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-emerald-400">
                              Impacto: {formatCurrency(rec.potential_impact)}
                            </span>
                            <span className="text-dark-400">
                              {rec.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SpotlightCard>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* Simulator */}
        <Card>
          <CardHeader
            title="Simulador de Cenarios"
            subtitle="Projete o impacto de mudancas estrategicas"
            action={<Calculator className="w-5 h-5 text-primary-400" />}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dark-400 mb-2">
                  Variacao no Investimento em Ads (%)
                </label>
                <input
                  type="range"
                  min="-50"
                  max="100"
                  value={simulatorParams.ad_spend_change}
                  onChange={(e) =>
                    setSimulatorParams({
                      ...simulatorParams,
                      ad_spend_change: Number(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex justify-between text-xs text-dark-400 mt-1">
                  <span>-50%</span>
                  <span
                    className={
                      simulatorParams.ad_spend_change >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }
                  >
                    {simulatorParams.ad_spend_change > 0 ? '+' : ''}
                    {simulatorParams.ad_spend_change}%
                  </span>
                  <span>+100%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-dark-400 mb-2">
                  Variacao de Precos (%)
                </label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={simulatorParams.price_change}
                  onChange={(e) =>
                    setSimulatorParams({
                      ...simulatorParams,
                      price_change: Number(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex justify-between text-xs text-dark-400 mt-1">
                  <span>-20%</span>
                  <span
                    className={
                      simulatorParams.price_change >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }
                  >
                    {simulatorParams.price_change > 0 ? '+' : ''}
                    {simulatorParams.price_change}%
                  </span>
                  <span>+20%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-dark-400 mb-2">
                  Novos Produtos Lancados
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={simulatorParams.new_products}
                  onChange={(e) =>
                    setSimulatorParams({
                      ...simulatorParams,
                      new_products: Number(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex justify-between text-xs text-dark-400 mt-1">
                  <span>0</span>
                  <span className="text-primary-400">
                    {simulatorParams.new_products} produtos
                  </span>
                  <span>20</span>
                </div>
              </div>

              <Button
                onClick={handleSimulate}
                disabled={simulateMutation.isPending}
                className="w-full mt-4"
              >
                <Play className="w-4 h-4 mr-2" />
                {simulateMutation.isPending ? 'Simulando...' : 'Simular Cenario'}
              </Button>
            </div>

            {/* Results */}
            <div className="p-6 bg-dark-700/50 rounded-lg border border-dark-600">
              <h4 className="text-sm font-medium text-white mb-4">
                Resultados da Simulacao
              </h4>
              {simulateMutation.data ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-dark-800 rounded-lg">
                      <p className="text-xs text-dark-400 mb-1">
                        Receita Projetada
                      </p>
                      <p className="text-lg font-bold text-white">
                        {formatCurrency(simulateMutation.data.projected_revenue)}
                      </p>
                      <p
                        className={`text-xs ${
                          simulateMutation.data.revenue_change >= 0
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {simulateMutation.data.revenue_change >= 0 ? '+' : ''}
                        {formatPercent(simulateMutation.data.revenue_change)}
                      </p>
                    </div>
                    <div className="p-3 bg-dark-800 rounded-lg">
                      <p className="text-xs text-dark-400 mb-1">
                        Pedidos Projetados
                      </p>
                      <p className="text-lg font-bold text-white">
                        {simulateMutation.data.projected_orders}
                      </p>
                      <p
                        className={`text-xs ${
                          simulateMutation.data.orders_change >= 0
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {simulateMutation.data.orders_change >= 0 ? '+' : ''}
                        {formatPercent(simulateMutation.data.orders_change)}
                      </p>
                    </div>
                    <div className="p-3 bg-dark-800 rounded-lg">
                      <p className="text-xs text-dark-400 mb-1">ROAS Esperado</p>
                      <p className="text-lg font-bold text-white">
                        {simulateMutation.data.projected_roas?.toFixed(2)}x
                      </p>
                    </div>
                    <div className="p-3 bg-dark-800 rounded-lg">
                      <p className="text-xs text-dark-400 mb-1">
                        Novos Clientes
                      </p>
                      <p className="text-lg font-bold text-white">
                        {simulateMutation.data.projected_new_customers}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                    <p className="text-sm text-primary-400">
                      <strong>Confianca:</strong>{' '}
                      {formatPercent(simulateMutation.data.confidence * 100)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-dark-400">
                  <Calculator className="w-12 h-12 mb-4 opacity-30" />
                  <p className="text-sm">
                    Ajuste os parametros e clique em simular
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
