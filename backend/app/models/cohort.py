from sqlalchemy import Column, BigInteger, Integer, String, Date, Numeric, TIMESTAMP
from sqlalchemy.sql import func
from ..database import Base


class CohortMetric(Base):
    __tablename__ = "fct_cohort_metrics"

    cohort_metric_id = Column(BigInteger, primary_key=True, autoincrement=True)

    # Cohort identification
    cohort_month = Column(Date, nullable=False)
    months_since_acquisition = Column(Integer, nullable=False)

    # Optional segmentation
    acquisition_channel = Column(String(100), nullable=True)

    # Metrics
    cohort_size = Column(Integer, nullable=False)
    active_customers = Column(Integer, default=0)
    orders = Column(Integer, default=0)
    revenue = Column(Numeric(14, 2), default=0)

    # Calculated rates
    retention_rate = Column(Numeric(5, 4), nullable=True)
    cumulative_revenue_per_customer = Column(Numeric(12, 2), nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
