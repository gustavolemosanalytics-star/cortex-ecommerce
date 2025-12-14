from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date, timedelta
from decimal import Decimal
from typing import List, Optional

from ..database import get_db
from ..models import Campaign, AdSpend, Order, Attribution, DateDimension, Channel
from ..schemas.campaign import CampaignResponse, CampaignPerformance

router = APIRouter(prefix="/marketing", tags=["Marketing"])


def get_date_range(period: str) -> tuple[date, date]:
    end_date = date.today()
    if period == "7d":
        start_date = end_date - timedelta(days=7)
    elif period == "30d":
        start_date = end_date - timedelta(days=30)
    elif period == "60d":
        start_date = end_date - timedelta(days=60)
    elif period == "90d":
        start_date = end_date - timedelta(days=90)
    else:
        start_date = end_date - timedelta(days=30)
    return start_date, end_date


@router.get("/campaign-performance")
def get_campaign_performance(
    period: str = Query("30d"),
    platform: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get performance metrics for all campaigns."""
    start_date, end_date = get_date_range(period)

    # Base query
    query = db.query(
        Campaign.campaign_id,
        Campaign.platform,
        Campaign.campaign_name,
        Campaign.funnel_stage,
        Campaign.campaign_type,
        func.sum(AdSpend.impressions).label("impressions"),
        func.sum(AdSpend.clicks).label("clicks"),
        func.sum(AdSpend.spend).label("spend"),
        func.sum(AdSpend.conversions_platform).label("conversions")
    ).join(
        AdSpend, Campaign.campaign_id == AdSpend.campaign_id
    ).join(
        DateDimension, AdSpend.date_key == DateDimension.date_key
    ).filter(
        DateDimension.full_date >= start_date,
        DateDimension.full_date <= end_date
    )

    if platform:
        query = query.filter(Campaign.platform == platform)

    results = query.group_by(
        Campaign.campaign_id,
        Campaign.platform,
        Campaign.campaign_name,
        Campaign.funnel_stage,
        Campaign.campaign_type
    ).order_by(func.sum(AdSpend.spend).desc()).all()

    # Get attributed revenue per campaign
    attribution_data = db.query(
        Attribution.campaign_id,
        func.sum(Attribution.attributed_revenue).label("revenue"),
        func.sum(Attribution.attributed_orders).label("orders")
    ).join(
        Order, Attribution.order_id == Order.order_id
    ).filter(
        Order.order_created_at >= start_date,
        Order.order_created_at <= end_date,
        Attribution.attribution_model == "last_click"
    ).group_by(Attribution.campaign_id).all()

    revenue_map = {a.campaign_id: (float(a.revenue or 0), float(a.orders or 0)) for a in attribution_data}

    campaigns = []
    for r in results:
        spend = float(r.spend or 0)
        impressions = r.impressions or 0
        clicks = r.clicks or 0
        revenue, orders = revenue_map.get(r.campaign_id, (0, 0))

        campaigns.append({
            "campaign_id": r.campaign_id,
            "platform": r.platform,
            "campaign_name": r.campaign_name,
            "funnel_stage": r.funnel_stage,
            "campaign_type": r.campaign_type,
            "impressions": impressions,
            "clicks": clicks,
            "spend": spend,
            "conversions": r.conversions or 0,
            "revenue": revenue,
            "roas": round(revenue / spend, 2) if spend > 0 else None,
            "cpa": round(spend / orders, 2) if orders > 0 else None,
            "ctr": round((clicks / impressions * 100), 2) if impressions > 0 else None,
            "cpc": round(spend / clicks, 2) if clicks > 0 else None
        })

    return campaigns


@router.get("/roas-by-platform")
def get_roas_by_platform(
    period: str = Query("30d"),
    db: Session = Depends(get_db)
):
    """Get ROAS breakdown by platform."""
    start_date, end_date = get_date_range(period)

    # Get spend by platform
    spend_data = db.query(
        Campaign.platform,
        func.count(func.distinct(Campaign.campaign_id)).label("campaigns"),
        func.sum(AdSpend.impressions).label("impressions"),
        func.sum(AdSpend.clicks).label("clicks"),
        func.sum(AdSpend.spend).label("spend"),
        func.sum(AdSpend.conversions_platform).label("conversions")
    ).join(
        AdSpend, Campaign.campaign_id == AdSpend.campaign_id
    ).join(
        DateDimension, AdSpend.date_key == DateDimension.date_key
    ).filter(
        DateDimension.full_date >= start_date,
        DateDimension.full_date <= end_date
    ).group_by(Campaign.platform).all()

    # Get revenue by platform
    revenue_data = db.query(
        Campaign.platform,
        func.sum(Attribution.attributed_revenue).label("revenue"),
        func.sum(Attribution.attributed_orders).label("orders")
    ).join(
        Attribution, Campaign.campaign_id == Attribution.campaign_id
    ).join(
        Order, Attribution.order_id == Order.order_id
    ).filter(
        Order.order_created_at >= start_date,
        Order.order_created_at <= end_date,
        Attribution.attribution_model == "last_click"
    ).group_by(Campaign.platform).all()

    revenue_map = {r.platform: (float(r.revenue or 0), float(r.orders or 0)) for r in revenue_data}

    platforms = []
    for r in spend_data:
        spend = float(r.spend or 0)
        revenue, orders = revenue_map.get(r.platform, (0, 0))

        platforms.append({
            "platform": r.platform,
            "campaigns": r.campaigns,
            "spend": spend,
            "revenue": revenue,
            "roas": round(revenue / spend, 2) if spend > 0 else None,
            "conversions": int(orders),
            "cpa": round(spend / orders, 2) if orders > 0 else None,
            "impressions": r.impressions or 0,
            "clicks": r.clicks or 0,
            "ctr": round((r.clicks or 0) / (r.impressions or 1) * 100, 2)
        })

    return platforms


@router.get("/spend-revenue")
def get_spend_revenue_trend(
    period: str = Query("30d"),
    db: Session = Depends(get_db)
):
    """Get daily spend vs revenue trend."""
    start_date, end_date = get_date_range(period)

    # Get daily spend
    spend_data = db.query(
        DateDimension.full_date,
        func.sum(AdSpend.spend).label("spend")
    ).join(
        AdSpend, DateDimension.date_key == AdSpend.date_key
    ).filter(
        DateDimension.full_date >= start_date,
        DateDimension.full_date <= end_date
    ).group_by(DateDimension.full_date).all()

    spend_map = {str(r.full_date): float(r.spend or 0) for r in spend_data}

    # Get daily revenue
    revenue_data = db.query(
        DateDimension.full_date,
        func.sum(Order.total_amount).label("revenue")
    ).join(
        Order, DateDimension.date_key == Order.date_key
    ).filter(
        DateDimension.full_date >= start_date,
        DateDimension.full_date <= end_date,
        Order.order_status != "cancelled"
    ).group_by(DateDimension.full_date).all()

    revenue_map = {str(r.full_date): float(r.revenue or 0) for r in revenue_data}

    # Combine data
    all_dates = sorted(set(spend_map.keys()) | set(revenue_map.keys()))

    return [
        {
            "date": d,
            "spend": spend_map.get(d, 0),
            "revenue": revenue_map.get(d, 0),
            "roas": round(revenue_map.get(d, 0) / spend_map.get(d, 1), 2) if spend_map.get(d, 0) > 0 else None
        }
        for d in all_dates
    ]


@router.get("/attribution")
def get_attribution_analysis(
    period: str = Query("30d"),
    db: Session = Depends(get_db)
):
    """Get attribution analysis by channel."""
    start_date, end_date = get_date_range(period)

    results = db.query(
        Channel.channel_name,
        Attribution.attribution_model,
        func.sum(Attribution.attributed_revenue).label("revenue"),
        func.sum(Attribution.attributed_orders).label("orders")
    ).join(
        Attribution, Channel.channel_id == Attribution.channel_id
    ).join(
        Order, Attribution.order_id == Order.order_id
    ).filter(
        Order.order_created_at >= start_date,
        Order.order_created_at <= end_date
    ).group_by(
        Channel.channel_name,
        Attribution.attribution_model
    ).all()

    total_revenue = sum(float(r.revenue or 0) for r in results)

    return [
        {
            "channel": r.channel_name,
            "model": r.attribution_model,
            "attributed_revenue": float(r.revenue or 0),
            "attributed_orders": float(r.orders or 0),
            "percentage": round((float(r.revenue or 0) / total_revenue * 100), 2) if total_revenue > 0 else 0
        }
        for r in results
    ]


@router.get("/funnel-performance")
def get_funnel_performance(
    period: str = Query("30d"),
    db: Session = Depends(get_db)
):
    """Get performance by funnel stage."""
    start_date, end_date = get_date_range(period)

    # Get spend by funnel stage
    spend_data = db.query(
        Campaign.funnel_stage,
        func.sum(AdSpend.spend).label("spend"),
        func.sum(AdSpend.impressions).label("impressions"),
        func.sum(AdSpend.clicks).label("clicks")
    ).join(
        AdSpend, Campaign.campaign_id == AdSpend.campaign_id
    ).join(
        DateDimension, AdSpend.date_key == DateDimension.date_key
    ).filter(
        DateDimension.full_date >= start_date,
        DateDimension.full_date <= end_date
    ).group_by(Campaign.funnel_stage).all()

    # Get revenue by funnel stage
    revenue_data = db.query(
        Campaign.funnel_stage,
        func.sum(Attribution.attributed_revenue).label("revenue"),
        func.sum(Attribution.attributed_orders).label("orders")
    ).join(
        Attribution, Campaign.campaign_id == Attribution.campaign_id
    ).join(
        Order, Attribution.order_id == Order.order_id
    ).filter(
        Order.order_created_at >= start_date,
        Order.order_created_at <= end_date,
        Attribution.attribution_model == "last_click"
    ).group_by(Campaign.funnel_stage).all()

    revenue_map = {r.funnel_stage: (float(r.revenue or 0), float(r.orders or 0)) for r in revenue_data}

    funnel_order = {"TOFU": 1, "MOFU": 2, "BOFU": 3}

    stages = []
    for r in spend_data:
        spend = float(r.spend or 0)
        revenue, orders = revenue_map.get(r.funnel_stage, (0, 0))

        stages.append({
            "funnel_stage": r.funnel_stage,
            "order": funnel_order.get(r.funnel_stage, 99),
            "spend": spend,
            "impressions": r.impressions or 0,
            "clicks": r.clicks or 0,
            "revenue": revenue,
            "conversions": int(orders),
            "roas": round(revenue / spend, 2) if spend > 0 else None,
            "cpa": round(spend / orders, 2) if orders > 0 else None
        })

    return sorted(stages, key=lambda x: x["order"])
