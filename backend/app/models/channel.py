from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP
from sqlalchemy.sql import func
from ..database import Base


class Channel(Base):
    __tablename__ = "dim_channels"

    channel_id = Column(Integer, primary_key=True, autoincrement=True)
    channel_name = Column(String(100), nullable=False, unique=True)
    channel_group = Column(String(50), nullable=True)
    is_paid = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
