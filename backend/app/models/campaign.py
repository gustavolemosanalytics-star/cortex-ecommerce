from sqlalchemy import Column, BigInteger, Integer, String, Date, Numeric, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from ..database import Base


class Campaign(Base):
    __tablename__ = "dim_campaigns"

    campaign_id = Column(BigInteger, primary_key=True, autoincrement=True)

    # Platform identifiers
    platform = Column(String(50), nullable=False)
    platform_account_id = Column(String(100), nullable=True)
    platform_campaign_id = Column(String(100), nullable=False)
    platform_adset_id = Column(String(100), nullable=True)
    platform_ad_id = Column(String(100), nullable=True)

    # Names
    campaign_name = Column(String(500), nullable=True)
    adset_name = Column(String(500), nullable=True)
    ad_name = Column(String(500), nullable=True)

    # Classification
    campaign_objective = Column(String(100), nullable=True)
    campaign_type = Column(String(100), nullable=True)
    funnel_stage = Column(String(50), nullable=True)

    # UTMs
    utm_source = Column(String(100), nullable=True)
    utm_medium = Column(String(100), nullable=True)
    utm_campaign = Column(String(255), nullable=True)
    utm_content = Column(String(255), nullable=True)
    utm_term = Column(String(255), nullable=True)

    # Status
    is_active = Column(Boolean, default=True)

    # Control
    first_seen_date = Column(Date, nullable=True)
    last_seen_date = Column(Date, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class AdSpend(Base):
    __tablename__ = "fct_ad_spend"

    spend_id = Column(BigInteger, primary_key=True, autoincrement=True)
    date_key = Column(Integer, ForeignKey("dim_dates.date_key"), nullable=False)
    campaign_id = Column(BigInteger, ForeignKey("dim_campaigns.campaign_id"), nullable=False)

    # Delivery metrics
    impressions = Column(BigInteger, default=0)
    reach = Column(BigInteger, default=0)
    frequency = Column(Numeric(10, 4), default=0)

    # Engagement metrics
    clicks = Column(BigInteger, default=0)
    link_clicks = Column(BigInteger, default=0)

    # Costs
    spend = Column(Numeric(12, 2), nullable=False, default=0)
    spend_brl = Column(Numeric(12, 2), nullable=True)

    # Platform conversions
    conversions_platform = Column(Integer, default=0)
    conversions_value_platform = Column(Numeric(12, 2), default=0)

    # Calculated metrics
    cpm = Column(Numeric(12, 4), nullable=True)
    cpc = Column(Numeric(12, 4), nullable=True)
    ctr = Column(Numeric(8, 4), nullable=True)

    # Control
    extracted_at = Column(TIMESTAMP, server_default=func.now())
