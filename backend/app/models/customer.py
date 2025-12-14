from sqlalchemy import Column, BigInteger, String, Date, Integer, Numeric, Boolean, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class Customer(Base):
    __tablename__ = "dim_customers"

    customer_id = Column(BigInteger, primary_key=True, autoincrement=True)
    external_customer_id = Column(String(100), nullable=False, unique=True)
    email_hash = Column(String(64), nullable=True)
    phone_hash = Column(String(64), nullable=True)

    # Demographics
    city = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    country = Column(String(50), default="Brasil")
    postal_code = Column(String(20), nullable=True)

    # Acquisition data
    first_order_date = Column(Date, nullable=True)
    first_order_source = Column(String(100), nullable=True)
    first_order_medium = Column(String(100), nullable=True)
    first_order_campaign = Column(String(255), nullable=True)
    first_order_channel = Column(String(50), nullable=True)
    acquisition_cost = Column(Numeric(12, 2), nullable=True)

    # Calculated metrics
    total_orders = Column(Integer, default=0)
    total_revenue = Column(Numeric(14, 2), default=0)
    total_items_purchased = Column(Integer, default=0)
    average_order_value = Column(Numeric(12, 2), default=0)
    last_order_date = Column(Date, nullable=True)
    days_since_last_order = Column(Integer, nullable=True)
    customer_lifetime_days = Column(Integer, nullable=True)

    # RFM Segmentation
    rfm_recency_score = Column(Integer, nullable=True)
    rfm_frequency_score = Column(Integer, nullable=True)
    rfm_monetary_score = Column(Integer, nullable=True)
    rfm_segment = Column(String(50), nullable=True)

    # Flags
    is_repeat_customer = Column(Boolean, default=False)
    is_vip = Column(Boolean, default=False)
    is_churned = Column(Boolean, default=False)

    # Control
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    orders = relationship("Order", back_populates="customer")
