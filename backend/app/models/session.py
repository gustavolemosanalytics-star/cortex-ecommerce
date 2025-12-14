from sqlalchemy import Column, BigInteger, Integer, String, DateTime, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from ..database import Base


class Session(Base):
    __tablename__ = "fct_sessions"

    session_id = Column(BigInteger, primary_key=True, autoincrement=True)
    date_key = Column(Integer, ForeignKey("dim_dates.date_key"), nullable=False)

    # Identifiers
    ga_session_id = Column(String(100), nullable=True)
    ga_client_id = Column(String(100), nullable=True)
    customer_id = Column(BigInteger, ForeignKey("dim_customers.customer_id"), nullable=True)

    # Traffic source
    source = Column(String(100), nullable=True)
    medium = Column(String(100), nullable=True)
    campaign = Column(String(255), nullable=True)
    channel_id = Column(Integer, ForeignKey("dim_channels.channel_id"), nullable=True)

    # Landing page
    landing_page = Column(String(500), nullable=True)

    # Engagement metrics
    session_duration_seconds = Column(Integer, default=0)
    pageviews = Column(Integer, default=0)
    events = Column(Integer, default=0)
    is_engaged = Column(Boolean, default=False)

    # Conversions
    did_add_to_cart = Column(Boolean, default=False)
    did_begin_checkout = Column(Boolean, default=False)
    did_purchase = Column(Boolean, default=False)

    # Device
    device_category = Column(String(50), nullable=True)
    browser = Column(String(100), nullable=True)
    operating_system = Column(String(100), nullable=True)

    # Geo
    country = Column(String(50), nullable=True)
    region = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)

    # Timestamp
    session_start_at = Column(DateTime, nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.now())
