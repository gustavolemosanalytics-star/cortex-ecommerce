import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { productsApi } from '../services/api';
import { Layout } from '../components/layout';
import { Card, CardHeader, Badge } from '../components/ui';
import { CustomPieChart, CustomBarChart } from '../components/charts';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { abcColors, chartColorsArray } from '../utils/colors';
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';

export function Products() {
  const [period, setPeriod] = useState('30d');

  const { data: abcData } = useQuery({
    queryKey: ['products-abc'],
    queryFn: productsApi.getABCClassification,
  });

  const { data: topPerformers } = useQuery({
    queryKey: ['products-top', period],
    queryFn: () => productsApi.getTopPerformers(10, period),
  });

  const { data: byCategory } = useQuery({
    queryKey: ['products-category', period],
    queryFn: () => productsApi.getByCategory(period),
  });

  const { data: trends } = useQuery({
    queryKey: ['products-trends', period],
    queryFn: () => productsApi.getTrends(period),
  });

  const { data: stockAnalysis } = useQuery({
    queryKey: ['products-stock'],
    queryFn: productsApi.getStockAnalysis,
  });

  // ABC Chart data
  const abcChartData = abcData?.map((a) => ({
    name: `Classe ${a.classification}`,
    value: a.revenue,
    color: abcColors[a.classification],
  })) || [];

  // Category chart data
  const categoryChartData = byCategory?.map((c: any) => ({
    name: c.category,
    value: c.revenue,
  })) || [];

  return (
    <Layout
      title="Produtos"
      subtitle="Performance e análise de produtos"
      period={period}
      onPeriodChange={setPeriod}
    >
      <div className="space-y-6">
        {/* ABC Classification */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ABC Summary Cards */}
          {abcData?.map((abc, index) => (
            <motion.div
              key={abc.classification}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-dark-800 border border-dark-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
                  style={{
                    backgroundColor: `${abcColors[abc.classification]}20`,
                    color: abcColors[abc.classification],
                  }}
                >
                  {abc.classification}
                </div>
                <Badge
                  variant={
                    abc.classification === 'A'
                      ? 'success'
                      : abc.classification === 'B'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {abc.revenue_percentage.toFixed(0)}% da receita
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {formatCurrency(abc.revenue)}
              </h3>
              <p className="text-sm text-dark-400">
                {abc.product_count} produtos ({abc.cumulative_percentage.toFixed(0)}% acumulado)
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ABC Distribution */}
          <Card>
            <CardHeader
              title="Curva ABC"
              subtitle="Distribuição de receita por classificação"
            />
            <CustomPieChart
              data={abcChartData}
              height={300}
              innerRadius={60}
              outerRadius={100}
            />
          </Card>

          {/* Category Performance */}
          <Card>
            <CardHeader
              title="Receita por Categoria"
              subtitle="Top categorias por faturamento"
            />
            <CustomBarChart
              data={categoryChartData.slice(0, 8)}
              height={300}
              horizontal
            />
          </Card>
        </div>

        {/* Top Products */}
        <Card>
          <CardHeader
            title="Top Produtos"
            subtitle="Produtos com melhor performance no período"
          />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left text-xs font-medium text-dark-400 py-3 pl-4">
                    #
                  </th>
                  <th className="text-left text-xs font-medium text-dark-400 py-3">
                    Produto
                  </th>
                  <th className="text-left text-xs font-medium text-dark-400 py-3">
                    Categoria
                  </th>
                  <th className="text-center text-xs font-medium text-dark-400 py-3">
                    ABC
                  </th>
                  <th className="text-right text-xs font-medium text-dark-400 py-3">
                    Unidades
                  </th>
                  <th className="text-right text-xs font-medium text-dark-400 py-3">
                    Receita
                  </th>
                  <th className="text-right text-xs font-medium text-dark-400 py-3 pr-4">
                    Margem
                  </th>
                </tr>
              </thead>
              <tbody>
                {topPerformers?.map((product: any) => (
                  <motion.tr
                    key={product.product_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-dark-700/50 hover:bg-dark-700/30"
                  >
                    <td className="py-4 pl-4">
                      <span className="w-6 h-6 flex items-center justify-center bg-primary-500/20 text-primary-400 rounded-full text-xs font-medium">
                        {product.rank}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-sm font-medium text-white">
                        {product.product_name}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-dark-400">
                      {product.category}
                    </td>
                    <td className="py-4 text-center">
                      {product.abc_classification && (
                        <span
                          className="inline-block w-6 h-6 rounded text-xs font-bold flex items-center justify-center"
                          style={{
                            backgroundColor: `${abcColors[product.abc_classification]}20`,
                            color: abcColors[product.abc_classification],
                          }}
                        >
                          {product.abc_classification}
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right text-sm text-dark-400">
                      {formatNumber(product.units_sold)}
                    </td>
                    <td className="py-4 text-right text-sm font-medium text-white">
                      {formatCurrency(product.revenue)}
                    </td>
                    <td className="py-4 text-right pr-4">
                      <span
                        className={`text-sm ${
                          product.margin_percent > 30
                            ? 'text-emerald-400'
                            : product.margin_percent > 15
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        {product.margin_percent?.toFixed(1)}%
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trending Products */}
          <Card>
            <CardHeader
              title="Produtos em Alta"
              subtitle="Maior crescimento no período"
              action={<TrendingUp className="w-5 h-5 text-emerald-400" />}
            />
            <div className="space-y-3">
              {trends?.trending?.map((product: any, index: number) => (
                <motion.div
                  key={product.product_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-3 bg-dark-700/50 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {product.product_name}
                    </p>
                    <p className="text-xs text-dark-400">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-emerald-400">
                      +{product.change_percent.toFixed(0)}%
                    </p>
                    <p className="text-xs text-dark-400">
                      {formatCurrency(product.second_half_revenue)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Declining Products */}
          <Card>
            <CardHeader
              title="Produtos em Queda"
              subtitle="Maior declínio no período"
              action={<TrendingDown className="w-5 h-5 text-red-400" />}
            />
            <div className="space-y-3">
              {trends?.declining?.map((product: any, index: number) => (
                <motion.div
                  key={product.product_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-3 bg-dark-700/50 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {product.product_name}
                    </p>
                    <p className="text-xs text-dark-400">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-400">
                      {product.change_percent.toFixed(0)}%
                    </p>
                    <p className="text-xs text-dark-400">
                      {formatCurrency(product.second_half_revenue)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* Stock Analysis */}
        <Card>
          <CardHeader
            title="Análise de Estoque"
            subtitle="Status de estoque vs velocidade de venda"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">Crítico</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {stockAnalysis?.summary?.critical || 0}
              </p>
              <p className="text-xs text-dark-400">produtos</p>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-400">Baixo</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {stockAnalysis?.summary?.low || 0}
              </p>
              <p className="text-xs text-dark-400">produtos</p>
            </div>
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400">Saudável</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {stockAnalysis?.summary?.healthy || 0}
              </p>
              <p className="text-xs text-dark-400">produtos</p>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400">Excesso</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {stockAnalysis?.summary?.overstock || 0}
              </p>
              <p className="text-xs text-dark-400">produtos</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left text-xs font-medium text-dark-400 py-3">
                    Produto
                  </th>
                  <th className="text-right text-xs font-medium text-dark-400 py-3">
                    Estoque
                  </th>
                  <th className="text-right text-xs font-medium text-dark-400 py-3">
                    Venda/dia
                  </th>
                  <th className="text-right text-xs font-medium text-dark-400 py-3">
                    Dias de Estoque
                  </th>
                  <th className="text-center text-xs font-medium text-dark-400 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {stockAnalysis?.products?.slice(0, 10).map((product: any) => (
                  <tr
                    key={product.product_id}
                    className="border-b border-dark-700/50"
                  >
                    <td className="py-3 text-sm text-white">
                      {product.product_name}
                    </td>
                    <td className="py-3 text-right text-sm text-dark-400">
                      {product.stock_quantity}
                    </td>
                    <td className="py-3 text-right text-sm text-dark-400">
                      {product.daily_velocity}
                    </td>
                    <td className="py-3 text-right text-sm text-dark-400">
                      {product.days_of_stock || '∞'}
                    </td>
                    <td className="py-3 text-center">
                      <Badge
                        variant={
                          product.status === 'critical'
                            ? 'danger'
                            : product.status === 'low'
                            ? 'warning'
                            : product.status === 'healthy'
                            ? 'success'
                            : 'info'
                        }
                        size="sm"
                      >
                        {product.status}
                      </Badge>
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
