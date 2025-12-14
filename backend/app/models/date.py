from sqlalchemy import Column, Integer, Date, String, Boolean, SmallInteger
from ..database import Base


class DateDimension(Base):
    __tablename__ = "dim_dates"

    date_key = Column(Integer, primary_key=True)
    full_date = Column(Date, nullable=False, unique=True)
    day_of_week = Column(SmallInteger, nullable=False)
    day_of_week_name = Column(String(20), nullable=False)
    day_of_month = Column(SmallInteger, nullable=False)
    day_of_year = Column(SmallInteger, nullable=False)
    week_of_year = Column(SmallInteger, nullable=False)
    month_number = Column(SmallInteger, nullable=False)
    month_name = Column(String(20), nullable=False)
    quarter = Column(SmallInteger, nullable=False)
    year = Column(SmallInteger, nullable=False)
    is_weekend = Column(Boolean, default=False)
    is_holiday = Column(Boolean, default=False)
    holiday_name = Column(String(100), nullable=True)
    fiscal_year = Column(SmallInteger, nullable=True)
    fiscal_quarter = Column(SmallInteger, nullable=True)
