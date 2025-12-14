from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date
from decimal import Decimal


class KPIResponse(BaseModel):
    total_revenue: Decimal
    total_orders: int
    total_customers: int
    avg_order_value: Decimal
    new_customers: int
    repeat_rate: float
    total_ad_spend: Decimal
    roas: Optional[Decimal] = None
    cac: Optional[Decimal] = None

    # Comparisons
    revenue_change: Optional[float] = None
    orders_change: Optional[float] = None
    customers_change: Optional[float] = None
    aov_change: Optional[float] = None


class RevenueChartData(BaseModel):
    date: date
    revenue: Decimal
    orders: int
    customers: int


class ChannelPerformance(BaseModel):
    channel: str
    orders: int
    revenue: Decimal
    customers: int
    spend: Optional[Decimal] = None
    roas: Optional[Decimal] = None
    cpa: Optional[Decimal] = None
    percentage: float


class CohortData(BaseModel):
    cohort_month: str
    months_since_acquisition: int
    cohort_size: int
    active_customers: int
    orders: int
    revenue: Decimal
    retention_rate: Optional[float] = None
    ltv: Optional[Decimal] = None


class FunnelData(BaseModel):
    stage: str
    count: int
    percentage: float
    conversion_rate: Optional[float] = None


class PredictionResponse(BaseModel):
    prediction_type: str
    predictions: List[Dict[str, Any]]
    confidence: Optional[float] = None
    model_info: Optional[Dict[str, Any]] = None


class AlertResponse(BaseModel):
    alert_id: str
    alert_type: str  # warning, danger, info
    title: str
    message: str
    metric: str
    current_value: float
    threshold: float
    change_percent: Optional[float] = None
    created_at: str


class DashboardSummary(BaseModel):
    kpis: KPIResponse
    revenue_chart: List[RevenueChartData]
    top_channels: List[ChannelPerformance]
    alerts: List[AlertResponse]


class TopProduct(BaseModel):
    product_id: int
    product_name: str
    category: Optional[str] = None
    units_sold: int
    revenue: Decimal
    rank: int


class TopChannel(BaseModel):
    channel: str
    orders: int
    revenue: Decimal
    percentage: float
