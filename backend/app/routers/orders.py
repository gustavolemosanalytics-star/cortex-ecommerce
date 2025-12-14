from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case, extract
from datetime import date, timedelta
from decimal import Decimal
from typing import List, Optional

from ..database import get_db
from ..models import Order, OrderItem, Customer, Channel, DateDimension

router = APIRouter(prefix="/sales", tags=["Sales"])


def get_date_range(period: str) -> tuple[date, date]:
    """Get date range based on period string."""
    end_date = date.today()
    if period == "7d":
        start_date = end_date - timedelta(days=7)
    elif period == "30d":
        start_date = end_date - timedelta(days=30)
    elif period == "60d":
        start_date = end_date - timedelta(days=60)
    elif period == "90d":
        start_date = end_date - timedelta(days=90)
    elif period == "1y":
        start_date = end_date - timedelta(days=365)
    else:
        start_date = end_date - timedelta(days=30)
    return start_date, end_date


@router.get("/overview")
def get_sales_overview(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    period: str = Query("30d"),
    db: Session = Depends(get_db)
):
    """Get sales overview with comparison."""
    if not start_date or not end_date:
        start_date, end_date = get_date_range(period)

    period_days = (end_date - start_date).days
    prev_start = start_date - timedelta(days=period_days)
    prev_end = start_date

    # Current period
    current = db.query(
        func.count(Order.order_id).label("orders"),
        func.sum(Order.total_amount).label("revenue"),
        func.count(func.distinct(Order.customer_id)).label("customers"),
        func.avg(Order.total_amount).label("aov"),
        func.sum(Order.total_quantity).label("units")
    ).filter(
        Order.order_created_at >= start_date,
        Order.order_created_at <= end_date,
        Order.order_status != "cancelled"
    ).first()

    # Previous period
    previous = db.query(
        func.count(Order.order_id).label("orders"),
        func.sum(Order.total_amount).label("revenue"),
        func.count(func.distinct(Order.customer_id)).label("customers"),
        func.avg(Order.total_amount).label("aov")
    ).filter(
        Order.order_created_at >= prev_start,
        Order.order_created_at < start_date,
        Order.order_status != "cancelled"
    ).first()

    def calc_change(current_val, prev_val):
        if prev_val and prev_val > 0:
            return round(((float(current_val or 0) - float(prev_val)) / float(prev_val)) * 100, 2)
        return 0

    return {
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat()
        },
        "current": {
            "orders": current.orders or 0,
            "revenue": float(current.revenue or 0),
            "customers": current.customers or 0,
            "aov": round(float(current.aov or 0), 2),
            "units": current.units or 0
        },
        "previous": {
            "orders": previous.orders or 0,
            "revenue": float(previous.revenue or 0),
            "customers": previous.customers or 0,
            "aov": round(float(previous.aov or 0), 2)
        },
        "changes": {
            "orders": calc_change(current.orders, previous.orders),
            "revenue": calc_change(current.revenue, previous.revenue),
            "customers": calc_change(current.customers, previous.customers),
            "aov": calc_change(current.aov, previous.aov)
        }
    }


@router.get("/by-channel")
def get_sales_by_channel(
    period: str = Query("30d"),
    db: Session = Depends(get_db)
):
    """Get sales breakdown by channel."""
    start_date, end_date = get_date_range(period)

    results = db.query(
        Channel.channel_name,
        Channel.is_paid,
        func.count(Order.order_id).label("orders"),
        func.sum(Order.total_amount).label("revenue"),
        func.count(func.distinct(Order.customer_id)).label("customers"),
        func.avg(Order.total_amount).label("aov")
    ).join(
        Order, Channel.channel_id == Order.channel_id
    ).filter(
        Order.order_created_at >= start_date,
        Order.order_created_at <= end_date,
        Order.order_status != "cancelled"
    ).group_by(
        Channel.channel_id, Channel.channel_name, Channel.is_paid
    ).order_by(
        func.sum(Order.total_amount).desc()
    ).all()

    total_revenue = sum(float(r.revenue or 0) for r in results)

    return [
        {
            "channel": r.channel_name,
            "is_paid": r.is_paid,
            "orders": r.orders,
            "revenue": float(r.revenue or 0),
            "customers": r.customers,
            "aov": round(float(r.aov or 0), 2),
            "percentage": round((float(r.revenue or 0) / total_revenue * 100), 2) if total_revenue > 0 else 0
        }
        for r in results
    ]


@router.get("/by-period")
def get_sales_by_period(
    groupby: str = Query("day", description="day, week, month"),
    period: str = Query("30d"),
    db: Session = Depends(get_db)
):
    """Get sales aggregated by time period."""
    start_date, end_date = get_date_range(period)

    if groupby == "day":
        group_expr = DateDimension.full_date
        label_expr = DateDimension.full_date
    elif groupby == "week":
        group_expr = func.yearweek(DateDimension.full_date)
        label_expr = func.min(DateDimension.full_date)
    else:  # month
        group_expr = func.date_format(DateDimension.full_date, '%Y-%m')
        label_expr = func.min(DateDimension.full_date)

    results = db.query(
        label_expr.label("period"),
        func.count(Order.order_id).label("orders"),
        func.sum(Order.total_amount).label("revenue"),
        func.count(func.distinct(Order.customer_id)).label("customers"),
        func.avg(Order.total_amount).label("aov")
    ).join(
        DateDimension, Order.date_key == DateDimension.date_key
    ).filter(
        DateDimension.full_date >= start_date,
        DateDimension.full_date <= end_date,
        Order.order_status != "cancelled"
    ).group_by(
        group_expr
    ).order_by(
        label_expr
    ).all()

    return [
        {
            "period": r.period.isoformat() if hasattr(r.period, 'isoformat') else str(r.period),
            "orders": r.orders,
            "revenue": float(r.revenue or 0),
            "customers": r.customers,
            "aov": round(float(r.aov or 0), 2)
        }
        for r in results
    ]


@router.get("/funnel")
def get_sales_funnel(
    period: str = Query("30d"),
    db: Session = Depends(get_db)
):
    """Get conversion funnel data."""
    start_date, end_date = get_date_range(period)

    # This would typically come from GA4 sessions data
    # For demo, we'll calculate based on orders

    total_sessions = 50000  # Mock data
    add_to_cart = 15000
    begin_checkout = 8000
    purchase = db.query(func.count(Order.order_id)).filter(
        Order.order_created_at >= start_date,
        Order.order_created_at <= end_date,
        Order.order_status != "cancelled"
    ).scalar() or 0

    return [
        {
            "stage": "Sessions",
            "count": total_sessions,
            "percentage": 100,
            "conversion_rate": None
        },
        {
            "stage": "Add to Cart",
            "count": add_to_cart,
            "percentage": round((add_to_cart / total_sessions * 100), 2),
            "conversion_rate": round((add_to_cart / total_sessions * 100), 2)
        },
        {
            "stage": "Begin Checkout",
            "count": begin_checkout,
            "percentage": round((begin_checkout / total_sessions * 100), 2),
            "conversion_rate": round((begin_checkout / add_to_cart * 100), 2)
        },
        {
            "stage": "Purchase",
            "count": purchase,
            "percentage": round((purchase / total_sessions * 100), 2),
            "conversion_rate": round((purchase / begin_checkout * 100), 2)
        }
    ]


@router.get("/heatmap")
def get_sales_heatmap(
    period: str = Query("30d"),
    db: Session = Depends(get_db)
):
    """Get sales heatmap by day of week and hour."""
    start_date, end_date = get_date_range(period)

    results = db.query(
        extract('dow', Order.order_created_at).label("day_of_week"),
        extract('hour', Order.order_created_at).label("hour"),
        func.count(Order.order_id).label("orders"),
        func.sum(Order.total_amount).label("revenue")
    ).filter(
        Order.order_created_at >= start_date,
        Order.order_created_at <= end_date,
        Order.order_status != "cancelled"
    ).group_by(
        extract('dow', Order.order_created_at),
        extract('hour', Order.order_created_at)
    ).all()

    return [
        {
            "day_of_week": int(r.day_of_week),
            "hour": int(r.hour),
            "orders": r.orders,
            "revenue": float(r.revenue or 0)
        }
        for r in results
    ]


@router.get("/comparison")
def get_period_comparison(
    db: Session = Depends(get_db)
):
    """Compare different time periods."""
    today = date.today()

    periods = {
        "today": (today, today),
        "yesterday": (today - timedelta(days=1), today - timedelta(days=1)),
        "last_7_days": (today - timedelta(days=7), today),
        "last_30_days": (today - timedelta(days=30), today),
        "this_month": (today.replace(day=1), today),
        "last_month": (
            (today.replace(day=1) - timedelta(days=1)).replace(day=1),
            today.replace(day=1) - timedelta(days=1)
        )
    }

    results = {}
    for period_name, (start, end) in periods.items():
        data = db.query(
            func.count(Order.order_id).label("orders"),
            func.sum(Order.total_amount).label("revenue"),
            func.count(func.distinct(Order.customer_id)).label("customers")
        ).filter(
            func.date(Order.order_created_at) >= start,
            func.date(Order.order_created_at) <= end,
            Order.order_status != "cancelled"
        ).first()

        results[period_name] = {
            "orders": data.orders or 0,
            "revenue": float(data.revenue or 0),
            "customers": data.customers or 0
        }

    return results
