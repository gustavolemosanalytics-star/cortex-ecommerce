from sqlalchemy import Column, BigInteger, Integer, String, Numeric, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from ..database import Base


class Attribution(Base):
    __tablename__ = "fct_attribution"

    attribution_id = Column(BigInteger, primary_key=True, autoincrement=True)
    order_id = Column(BigInteger, ForeignKey("fct_orders.order_id"), nullable=False)
    campaign_id = Column(BigInteger, ForeignKey("dim_campaigns.campaign_id"), nullable=True)
    channel_id = Column(Integer, ForeignKey("dim_channels.channel_id"), nullable=True)

    # Attribution model
    attribution_model = Column(String(50), nullable=False)

    # Attributed values
    attributed_revenue = Column(Numeric(12, 2), nullable=False)
    attributed_orders = Column(Numeric(10, 4), nullable=False)

    # Attribution window
    days_to_conversion = Column(Integer, nullable=True)
    touchpoint_position = Column(String(20), nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.now())
