from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from decimal import Decimal


class CampaignBase(BaseModel):
    platform: str
    platform_campaign_id: str
    campaign_name: Optional[str] = None
    campaign_type: Optional[str] = None
    funnel_stage: Optional[str] = None


class CampaignResponse(BaseModel):
    campaign_id: int
    platform: str
    platform_campaign_id: str
    campaign_name: Optional[str] = None
    adset_name: Optional[str] = None
    ad_name: Optional[str] = None
    campaign_objective: Optional[str] = None
    campaign_type: Optional[str] = None
    funnel_stage: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class CampaignPerformance(BaseModel):
    campaign_id: int
    platform: str
    campaign_name: Optional[str] = None
    funnel_stage: Optional[str] = None
    impressions: int = 0
    clicks: int = 0
    spend: Decimal = Decimal("0.00")
    conversions: int = 0
    revenue: Decimal = Decimal("0.00")
    roas: Optional[Decimal] = None
    cpa: Optional[Decimal] = None
    ctr: Optional[Decimal] = None
    cpc: Optional[Decimal] = None


class PlatformPerformance(BaseModel):
    platform: str
    campaigns: int
    spend: Decimal
    revenue: Decimal
    roas: Optional[Decimal] = None
    conversions: int
    cpa: Optional[Decimal] = None


class SpendRevenueData(BaseModel):
    date: date
    spend: Decimal
    revenue: Decimal
    roas: Optional[Decimal] = None


class AttributionData(BaseModel):
    channel: str
    model: str
    attributed_revenue: Decimal
    attributed_orders: Decimal
    percentage: float
