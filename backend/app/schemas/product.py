from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal


class ProductBase(BaseModel):
    external_product_id: str
    sku: Optional[str] = None
    product_name: str
    category_level_1: Optional[str] = None
    category_level_2: Optional[str] = None
    brand: Optional[str] = None
    current_price: Optional[Decimal] = None


class ProductResponse(BaseModel):
    product_id: int
    external_product_id: str
    sku: Optional[str] = None
    product_name: str
    category_level_1: Optional[str] = None
    category_level_2: Optional[str] = None
    brand: Optional[str] = None
    current_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    margin_percent: Optional[Decimal] = None
    is_active: bool = True
    stock_quantity: Optional[int] = None
    total_units_sold: int = 0
    total_revenue: Decimal = Decimal("0.00")
    abc_classification: Optional[str] = None

    class Config:
        from_attributes = True


class ProductPerformance(BaseModel):
    product_id: int
    product_name: str
    category: Optional[str] = None
    units_sold: int
    revenue: Decimal
    margin: Optional[Decimal] = None
    abc_classification: Optional[str] = None
    trend: Optional[str] = None  # up, down, stable


class ABCClassification(BaseModel):
    classification: str
    product_count: int
    revenue: Decimal
    revenue_percentage: float
    cumulative_percentage: float


class CategoryPerformance(BaseModel):
    category: str
    products: int
    units_sold: int
    revenue: Decimal
    avg_margin: Optional[Decimal] = None
