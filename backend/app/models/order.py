from sqlalchemy import Column, BigInteger, Integer, String, DateTime, Numeric, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class Order(Base):
    __tablename__ = "fct_orders"

    order_id = Column(BigInteger, primary_key=True, autoincrement=True)
    external_order_id = Column(String(100), nullable=False, unique=True)
    customer_id = Column(BigInteger, ForeignKey("dim_customers.customer_id"), nullable=False)
    date_key = Column(Integer, ForeignKey("dim_dates.date_key"), nullable=False)

    # Timestamps
    order_created_at = Column(DateTime, nullable=False)
    order_paid_at = Column(DateTime, nullable=True)
    order_shipped_at = Column(DateTime, nullable=True)
    order_delivered_at = Column(DateTime, nullable=True)
    order_cancelled_at = Column(DateTime, nullable=True)

    # Status
    order_status = Column(String(50), nullable=False)
    payment_status = Column(String(50), nullable=True)
    payment_method = Column(String(50), nullable=True)

    # Values
    subtotal = Column(Numeric(12, 2), nullable=False, default=0)
    shipping_cost = Column(Numeric(12, 2), default=0)
    discount_amount = Column(Numeric(12, 2), default=0)
    tax_amount = Column(Numeric(12, 2), default=0)
    total_amount = Column(Numeric(12, 2), nullable=False, default=0)

    # Quantities
    total_items = Column(Integer, default=0)
    total_quantity = Column(Integer, default=0)

    # Attribution
    utm_source = Column(String(100), nullable=True)
    utm_medium = Column(String(100), nullable=True)
    utm_campaign = Column(String(255), nullable=True)
    utm_content = Column(String(255), nullable=True)
    utm_term = Column(String(255), nullable=True)
    channel_id = Column(Integer, ForeignKey("dim_channels.channel_id"), nullable=True)

    # Tracking cookies
    fbc = Column(String(255), nullable=True)
    fbp = Column(String(255), nullable=True)
    gclid = Column(String(255), nullable=True)
    ttclid = Column(String(255), nullable=True)

    # Flags
    is_first_order = Column(Boolean, default=False)
    is_repeat_order = Column(Boolean, default=False)

    # Control
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "fct_order_items"

    order_item_id = Column(BigInteger, primary_key=True, autoincrement=True)
    order_id = Column(BigInteger, ForeignKey("fct_orders.order_id"), nullable=False)
    product_id = Column(BigInteger, ForeignKey("dim_products.product_id"), nullable=False)
    date_key = Column(Integer, ForeignKey("dim_dates.date_key"), nullable=False)

    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(12, 2), nullable=False)
    unit_cost = Column(Numeric(12, 2), nullable=True)
    discount_amount = Column(Numeric(12, 2), default=0)
    total_price = Column(Numeric(12, 2), nullable=False)

    # Margin
    gross_margin = Column(Numeric(12, 2), nullable=True)
    margin_percent = Column(Numeric(5, 2), nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
