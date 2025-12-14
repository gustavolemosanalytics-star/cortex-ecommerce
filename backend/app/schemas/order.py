from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


class OrderItemResponse(BaseModel):
    order_item_id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: int
    unit_price: Decimal
    total_price: Decimal

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    external_order_id: str
    customer_id: int
    total_amount: Decimal
    order_status: str


class OrderResponse(BaseModel):
    order_id: int
    external_order_id: str
    customer_id: int
    order_created_at: datetime
    order_status: str
    payment_method: Optional[str] = None
    subtotal: Decimal
    shipping_cost: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    total_items: int
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    is_first_order: bool = False
    items: Optional[List[OrderItemResponse]] = None

    class Config:
        from_attributes = True


class OrderSummary(BaseModel):
    date: date
    orders: int
    revenue: Decimal
    avg_order_value: Decimal
    new_customer_orders: int
    repeat_orders: int


class SalesByChannel(BaseModel):
    channel: str
    orders: int
    revenue: Decimal
    percentage: float


class SalesByPeriod(BaseModel):
    period: str
    orders: int
    revenue: Decimal
    customers: int
    avg_order_value: Decimal


class HeatmapData(BaseModel):
    day_of_week: int
    hour: int
    orders: int
    revenue: Decimal
