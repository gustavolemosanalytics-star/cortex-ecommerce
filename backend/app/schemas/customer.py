from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


class CustomerBase(BaseModel):
    external_customer_id: str
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "Brasil"


class CustomerResponse(BaseModel):
    customer_id: int
    external_customer_id: str
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "Brasil"
    first_order_date: Optional[date] = None
    first_order_channel: Optional[str] = None
    total_orders: int = 0
    total_revenue: Decimal = Decimal("0.00")
    average_order_value: Decimal = Decimal("0.00")
    last_order_date: Optional[date] = None
    days_since_last_order: Optional[int] = None
    rfm_segment: Optional[str] = None
    is_repeat_customer: bool = False
    is_vip: bool = False
    is_churned: bool = False

    class Config:
        from_attributes = True


class CustomerList(BaseModel):
    items: List[CustomerResponse]
    total: int
    page: int
    limit: int
    pages: int


class RFMSegment(BaseModel):
    segment: str
    count: int
    percentage: float
    total_revenue: Decimal
    avg_orders: float
    avg_revenue: Decimal


class CustomerMetrics(BaseModel):
    total_customers: int
    new_customers_30d: int
    repeat_rate: float
    churn_rate: float
    avg_ltv: Decimal
    vip_count: int
