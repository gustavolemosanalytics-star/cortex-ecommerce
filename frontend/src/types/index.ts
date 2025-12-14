// API Response Types

export interface KPIData {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  avg_order_value: number;
  new_customers: number;
  repeat_rate: number;
  total_ad_spend: number;
  roas: number | null;
  cac: number | null;
  revenue_change: number | null;
  orders_change: number | null;
  customers_change: number | null;
  aov_change: number | null;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  category: string | null;
  units_sold: number;
  revenue: number;
  rank: number;
}

export interface TopChannel {
  channel: string;
  orders: number;
  revenue: number;
  percentage: number;
}

export interface Alert {
  alert_id: string;
  alert_type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  metric: string;
  current_value: number;
  threshold: number;
  change_percent?: number;
  created_at: string;
}

export interface RFMSegment {
  segment: string;
  count: number;
  percentage: number;
  total_revenue: number;
  avg_orders: number;
  avg_revenue: number;
}

export interface Customer {
  customer_id: number;
  external_customer_id: string;
  city: string | null;
  state: string | null;
  country: string;
  first_order_date: string | null;
  first_order_channel: string | null;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  last_order_date: string | null;
  days_since_last_order: number | null;
  rfm_segment: string | null;
  is_repeat_customer: boolean;
  is_vip: boolean;
  is_churned: boolean;
}

export interface Product {
  product_id: number;
  external_product_id: string;
  sku: string | null;
  product_name: string;
  category_level_1: string | null;
  category_level_2: string | null;
  brand: string | null;
  current_price: number | null;
  cost_price: number | null;
  margin_percent: number | null;
  is_active: boolean;
  stock_quantity: number | null;
  total_units_sold: number;
  total_revenue: number;
  abc_classification: string | null;
}

export interface CampaignPerformance {
  campaign_id: number;
  platform: string;
  campaign_name: string | null;
  funnel_stage: string | null;
  campaign_type: string | null;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  cpc: number | null;
}

export interface PlatformPerformance {
  platform: string;
  campaigns: number;
  spend: number;
  revenue: number;
  roas: number | null;
  conversions: number;
  cpa: number | null;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface SalesForecast {
  predictions: Array<{
    date: string;
    predicted_revenue: number;
    lower_bound: number;
    upper_bound: number;
    day_of_week: string;
  }>;
  summary: {
    total_predicted_revenue: number;
    avg_daily_revenue: number;
    last_year_same_period: number;
    yoy_change: number | null;
  };
  model_info: {
    method: string;
    training_days: number;
    trend_slope: number;
  };
}

export interface ChurnRiskData {
  summary: {
    at_risk_count: number;
    high_risk_count: number;
    total_revenue_at_risk: number;
  };
  at_risk_customers: Array<{
    customer_id: number;
    external_id: string;
    segment: string | null;
    days_since_last_order: number;
    total_orders: number;
    total_revenue: number;
    risk_score: number;
    risk_level: string;
  }>;
  high_risk_customers: Array<{
    customer_id: number;
    external_id: string;
    segment: string | null;
    days_since_last_order: number;
    total_orders: number;
    total_revenue: number;
    risk_score: number;
    risk_level: string;
  }>;
}

export interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  potential_impact: string;
  action: string;
}

export interface CohortData {
  cohort_month: string;
  months_since_acquisition: number;
  cohort_size: number;
  active_customers: number;
  revenue: number;
  retention_rate: number;
  ltv: number;
}

export interface SalesByChannel {
  channel: string;
  is_paid: boolean;
  orders: number;
  revenue: number;
  customers: number;
  aov: number;
  percentage: number;
}

export interface ABCClassification {
  classification: string;
  product_count: number;
  revenue: number;
  revenue_percentage: number;
  cumulative_percentage: number;
}
