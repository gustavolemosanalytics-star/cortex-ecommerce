from sqlalchemy import Column, BigInteger, String, Integer, Numeric, Boolean, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class Product(Base):
    __tablename__ = "dim_products"

    product_id = Column(BigInteger, primary_key=True, autoincrement=True)
    external_product_id = Column(String(100), nullable=False, unique=True)
    sku = Column(String(100), nullable=True)
    product_name = Column(String(500), nullable=False)

    # Categorization
    category_level_1 = Column(String(200), nullable=True)
    category_level_2 = Column(String(200), nullable=True)
    category_level_3 = Column(String(200), nullable=True)
    brand = Column(String(200), nullable=True)

    # Prices
    current_price = Column(Numeric(12, 2), nullable=True)
    cost_price = Column(Numeric(12, 2), nullable=True)
    margin_percent = Column(Numeric(5, 2), nullable=True)

    # Status
    is_active = Column(Boolean, default=True)
    stock_quantity = Column(Integer, nullable=True)

    # Calculated metrics
    total_units_sold = Column(Integer, default=0)
    total_revenue = Column(Numeric(14, 2), default=0)
    abc_classification = Column(String(1), nullable=True)

    # Control
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    order_items = relationship("OrderItem", back_populates="product")
