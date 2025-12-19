import axios from 'axios';
import type {
  KPIData,
  RevenueChartData,
  TopProduct,
  TopChannel,
  Alert,
  RFMSegment,
  Customer,
  Product,
  CampaignPerformance,
  PlatformPerformance,
  SalesForecast,
  ChurnRiskData,
  Recommendation,
  CohortData,
  SalesByChannel,
  ABCClassification,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dashboard endpoints
export const dashboardApi = {
  getKPIs: async (period = '30d'): Promise<KPIData> => {
    const { data } = await api.get(`/dashboard/kpis?period=${period}`);
    return data;
  },

  getRevenueChart: async (period = '30d'): Promise<RevenueChartData[]> => {
    const { data } = await api.get(`/dashboard/revenue-chart?period=${period}`);
    return data;
  },

  getTopProducts: async (limit = 10, period = '30d'): Promise<TopProduct[]> => {
    const { data } = await api.get(`/dashboard/top-products?limit=${limit}&period=${period}`);
    return data;
  },

  getTopChannels: async (period = '30d'): Promise<TopChannel[]> => {
    const { data } = await api.get(`/dashboard/top-channels?period=${period}`);
    return data;
  },

  getAlerts: async (): Promise<Alert[]> => {
    const { data } = await api.get('/dashboard/alerts');
    return Array.isArray(data) ? data : [];
  },
};

// Sales endpoints
export const salesApi = {
  getOverview: async (period = '30d') => {
    const { data } = await api.get(`/sales/overview?period=${period}`);
    return data;
  },

  getByChannel: async (period = '30d'): Promise<SalesByChannel[]> => {
    const { data } = await api.get(`/sales/by-channel?period=${period}`);
    return data;
  },

  getByPeriod: async (groupby = 'day', period = '30d') => {
    const { data } = await api.get(`/sales/by-period?groupby=${groupby}&period=${period}`);
    return data;
  },

  getFunnel: async (period = '30d') => {
    const { data } = await api.get(`/sales/funnel?period=${period}`);
    return data;
  },

  getHeatmap: async (period = '30d') => {
    const { data } = await api.get(`/sales/heatmap?period=${period}`);
    return data;
  },

  getComparison: async () => {
    const { data } = await api.get('/sales/comparison');
    return data;
  },
};

// Customers endpoints
export const customersApi = {
  getList: async (page = 1, limit = 20, segment?: string, channel?: string, search?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (segment) params.append('segment', segment);
    if (channel) params.append('channel', channel);
    if (search) params.append('search', search);
    const { data } = await api.get(`/customers/list?${params}`);
    return data;
  },

  getRFMSegments: async (): Promise<RFMSegment[]> => {
    const { data } = await api.get('/customers/rfm-segments');
    return data;
  },

  getCohortAnalysis: async (): Promise<CohortData[]> => {
    const { data } = await api.get('/customers/cohort-analysis');
    return data;
  },

  getLTVByCohort: async () => {
    const { data } = await api.get('/customers/ltv-by-cohort');
    return data;
  },

  getDistribution: async () => {
    const { data } = await api.get('/customers/distribution');
    return data;
  },

  getCustomer: async (customerId: number): Promise<Customer> => {
    const { data } = await api.get(`/customers/${customerId}`);
    return data;
  },

  getCustomerOrders: async (customerId: number) => {
    const { data } = await api.get(`/customers/${customerId}/orders`);
    return data;
  },
};

// Products endpoints
export const productsApi = {
  getList: async (page = 1, limit = 20, category?: string, abc?: string, search?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (category) params.append('category', category);
    if (abc) params.append('abc', abc);
    if (search) params.append('search', search);
    const { data } = await api.get(`/products/list?${params}`);
    return data;
  },

  getABCClassification: async (): Promise<ABCClassification[]> => {
    const { data } = await api.get('/products/abc-classification');
    return data;
  },

  getTopPerformers: async (limit = 10, period = '30d') => {
    const { data } = await api.get(`/products/top-performers?limit=${limit}&period=${period}`);
    return data;
  },

  getByCategory: async (period = '30d') => {
    const { data } = await api.get(`/products/by-category?period=${period}`);
    return data;
  },

  getTrends: async (period = '30d') => {
    const { data } = await api.get(`/products/trends?period=${period}`);
    return data;
  },

  getStockAnalysis: async () => {
    const { data } = await api.get('/products/stock-analysis');
    return data;
  },

  getProduct: async (productId: number): Promise<Product> => {
    const { data } = await api.get(`/products/${productId}`);
    return data;
  },
};

// Marketing endpoints
export const marketingApi = {
  getCampaignPerformance: async (period = '30d', platform?: string): Promise<CampaignPerformance[]> => {
    const params = new URLSearchParams({ period });
    if (platform) params.append('platform', platform);
    const { data } = await api.get(`/marketing/campaign-performance?${params}`);
    return data;
  },

  getROASByPlatform: async (period = '30d'): Promise<PlatformPerformance[]> => {
    const { data } = await api.get(`/marketing/roas-by-platform?period=${period}`);
    return data;
  },

  getSpendRevenue: async (period = '30d') => {
    const { data } = await api.get(`/marketing/spend-revenue?period=${period}`);
    return data;
  },

  getAttribution: async (period = '30d') => {
    const { data } = await api.get(`/marketing/attribution?period=${period}`);
    return data;
  },

  getFunnelPerformance: async (period = '30d') => {
    const { data } = await api.get(`/marketing/funnel-performance?period=${period}`);
    return data;
  },
};

// Predictions endpoints
export const predictionsApi = {
  getSalesForecast: async (days = 30): Promise<SalesForecast> => {
    const { data } = await api.get(`/predictions/sales-forecast?days=${days}`);
    return data;
  },

  getCustomerLTV: async (customerId: number) => {
    const { data } = await api.get(`/predictions/customer-ltv/${customerId}`);
    return data;
  },

  getChurnRisk: async (): Promise<ChurnRiskData> => {
    const { data } = await api.get('/predictions/churn-risk');
    return data;
  },

  getRecommendations: async (): Promise<{ recommendations: Recommendation[]; generated_at: string }> => {
    const { data } = await api.get('/predictions/recommendations');
    return data;
  },

  simulate: async (spendIncrease: number, priceChange: number) => {
    const { data } = await api.post(`/predictions/simulate?spend_increase=${spendIncrease}&price_change=${priceChange}`);
    return data;
  },
};

export default api;
