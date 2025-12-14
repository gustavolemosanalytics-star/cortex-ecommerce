from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_, text
from datetime import date, timedelta
from decimal import Decimal
from typing import List, Optional

from ..database import get_db
from ..models import Customer, Order, OrderItem, Product, Campaign, AdSpend, Channel, DateDimension
from ..schemas.analytics import (
    KPIResponse, RevenueChartData, ChannelPerformance, AlertResponse,
    TopProduct, TopChannel
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


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


@router.get("/kpis", response_model=KPIResponse)
def get_kpis(
    period: str = Query("30d", description="Period: 7d, 30d, 60d, 90d, 1y"),
    db: Session = Depends(get_db)
):
    """Get main KPIs for dashboard."""
    start_date, end_date = get_date_range(period)
    prev_start = start_date - (end_date - start_date)
    prev_end = start_date

    # Current period metrics
    current_orders = db.query(
        func.count(Order.order_id).label("orders"),
        func.sum(Order.total_amount).label("revenue"),
        func.count(func.distinct(Order.customer_id)).label("customers"),
        func.sum(case((Order.is_first_order == True, 1), else_=0)).label("new_customers")
    ).filter(
        Order.order_created_at >= start_date,
        Order.order_created_at <= end_date,
        Order.order_status != "cancelled"
    ).first()

    # Previous period for comparison
    prev_orders = db.query(
        func.count(Order.order_id).label("orders"),
        func.sum(Order.total_amount).label("revenue"),
        func.count(func.distinct(Order.customer_id)).label("customers")
    ).filter(
        Order.order_created_at >= prev_start,
        Order.order_created_at < start_date,
        Order.order_status != "cancelled"
    ).first()

    # Ad spend
    ad_spend = db.query(func.sum(AdSpend.spend)).join(
        DateDimension, AdSpend.date_key == DateDimension.date_key
    ).filter(
        DateDimension.full_date >= start_date,
        DateDimension.full_date <= end_date
    ).scalar() or Decimal("0")

    total_revenue = current_orders.revenue or Decimal("0")
    total_orders = current_orders.orders or 0
    total_customers = current_orders.customers or 0
    new_customers = current_orders.new_customers or 0

    prev_revenue = prev_orders.revenue or Decimal("0")
    prev_orders_count = prev_orders.orders or 0
    prev_customers = prev_orders.customers or 0

    # Calculate changes
    revenue_change = ((float(total_revenue) - float(prev_revenue)) / float(prev_revenue) * 100) if prev_revenue > 0 else 0
    orders_change = ((total_orders - prev_orders_count) / prev_orders_count * 100) if prev_orders_count > 0 else 0
    customers_change = ((total_customers - prev_customers) / prev_customers * 100) if prev_customers > 0 else 0

    # Repeat rate
    repeat_orders = db.query(func.count(Order.order_id)).filter(
        Order.order_created_at >= start_date,
        Order.order_created_at <= end_date,
        Order.is_repeat_order == True,
        Order.order_status != "cancelled"
    ).scalar() or 0

    repeat_rate = (repeat_orders / total_orders * 100) if total_orders > 0 else 0

    # Calculate derived metrics
    avg_order_value = (total_revenue / total_orders) if total_orders > 0 else Decimal("0")
    prev_aov = (prev_revenue / prev_orders_count) if prev_orders_count > 0 else Decimal("0")
    aov_change = ((float(avg_order_value) - float(prev_aov)) / float(prev_aov) * 100) if prev_aov > 0 else 0

    roas = (total_revenue / ad_spend) if ad_spend > 0 else None
    cac = (ad_spend / new_customers) if new_customers > 0 else None

    return KPIResponse(
        total_revenue=total_revenue,
        total_orders=total_orders,
        total_customers=total_customers,
        avg_order_value=avg_order_value.quantize(Decimal("0.01")),
        new_customers=new_customers,
        repeat_rate=round(repeat_rate, 2),
        total_ad_spend=ad_spend,
        roas=roas.quantize(Decimal("0.01")) if roas else None,
        cac=cac.quantize(Decimal("0.01")) if cac else None,
        revenue_change=round(revenue_change, 2),
        orders_change=round(orders_change, 2),
        customers_change=round(customers_change, 2),
        aov_change=round(aov_change, 2)
    )


@router.get("/revenue-chart", response_model=List[RevenueChartData])
def get_revenue_chart(
    period: str = Query("30d"),
    db: Session = Depends(get_db)
):
    """Get daily revenue chart data."""
    start_date, end_date = get_date_range(period)

    results = db.query(
        DateDimension.full_date,
        func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
        func.coalesce(func.count(Order.order_id), 0).label("orders"),
        func.coalesce(func.count(func.distinct(Order.customer_id)), 0).label("customers")
    ).outerjoin(
        Order,
        and_(
            DateDimension.date_key == Order.date_key,
            Order.order_status != "cancelled"
        )
    ).filter(
        DateDimension.full_date >= start_date,
        DateDimension.full_date <= end_date
    ).group_by(
        DateDimension.full_date
    ).order_by(
        DateDimension.full_date
    ).all()

    return [
        RevenueChartData(
            date=r.full_date,
            revenue=r.revenue or Decimal("0"),
            orders=r.orders or 0,
            customers=r.customers or 0
        )
        for r in results
    ]


@router.get("/top-products", response_model=List[TopProduct])
def get_top_products(
    limit: int = Query(10, ge=1, le=50),
    period: str = Query("30d"),
    db: Session = Depends(get_db)
):
    """Get top selling products."""
    start_date, end_date = get_date_range(period)

    results = db.query(
        Product.product_id,
        Product.product_name,
        Product.category_level_1,
        func.sum(OrderItem.quantity).label("units_sold"),
        func.sum(OrderItem.total_price).label("revenue")
    ).join(
        OrderItem, Product.product_id == OrderItem.product_id
    ).join(
        Order, OrderItem.order_id == Order.order_id
    ).filter(
        Order.order_created_at >= start_date,
        Order.order_created_at <= end_date,
        Order.order_status != "cancelled"
    ).group_by(
        Product.product_id,
        Product.product_name,
        Product.category_level_1
    ).order_by(
        func.sum(OrderItem.total_price).desc()
    ).limit(limit).all()

    return [
        TopProduct(
            product_id=r.product_id,
            product_name=r.product_name,
            category=r.category_level_1,
            units_sold=r.units_sold or 0,
            revenue=r.revenue or Decimal("0"),
            rank=i + 1
        )
        for i, r in enumerate(results)
    ]


@router.get("/top-channels", response_model=List[TopChannel])
def get_top_channels(
    period: str = Query("30d"),
    db: Session = Depends(get_db)
):
    """Get top performing channels."""
    start_date, end_date = get_date_range(period)

    results = db.query(
        Channel.channel_name,
        func.count(Order.order_id).label("orders"),
        func.sum(Order.total_amount).label("revenue")
    ).join(
        Order, Channel.channel_id == Order.channel_id
    ).filter(
        Order.order_created_at >= start_date,
        Order.order_created_at <= end_date,
        Order.order_status != "cancelled"
    ).group_by(
        Channel.channel_name
    ).order_by(
        func.sum(Order.total_amount).desc()
    ).all()

    total_revenue = sum(r.revenue or 0 for r in results)

    return [
        TopChannel(
            channel=r.channel_name,
            orders=r.orders or 0,
            revenue=r.revenue or Decimal("0"),
            percentage=round((float(r.revenue or 0) / float(total_revenue) * 100), 2) if total_revenue > 0 else 0
        )
        for r in results
    ]


@router.get("/alerts", response_model=List[AlertResponse])
def get_alerts(
    db: Session = Depends(get_db)
):
    """Get smart alerts based on metrics changes."""
    alerts = []

    # Get current and previous week metrics
    today = date.today()
    current_start = today - timedelta(days=7)
    prev_start = today - timedelta(days=14)

    # Revenue alert
    current_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.order_created_at >= current_start,
        Order.order_status != "cancelled"
    ).scalar() or Decimal("0")

    prev_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.order_created_at >= prev_start,
        Order.order_created_at < current_start,
        Order.order_status != "cancelled"
    ).scalar() or Decimal("0")

    if prev_revenue > 0:
        revenue_change = ((float(current_revenue) - float(prev_revenue)) / float(prev_revenue)) * 100

        if revenue_change < -10:
            alerts.append(AlertResponse(
                alert_id="rev_drop",
                alert_type="danger",
                title="Queda na Receita",
                message=f"A receita caiu {abs(revenue_change):.1f}% comparado com a semana anterior",
                metric="revenue",
                current_value=float(current_revenue),
                threshold=float(prev_revenue) * 0.9,
                change_percent=round(revenue_change, 2),
                created_at=today.isoformat()
            ))
        elif revenue_change > 20:
            alerts.append(AlertResponse(
                alert_id="rev_spike",
                alert_type="info",
                title="Aumento na Receita",
                message=f"A receita aumentou {revenue_change:.1f}% comparado com a semana anterior",
                metric="revenue",
                current_value=float(current_revenue),
                threshold=float(prev_revenue) * 1.2,
                change_percent=round(revenue_change, 2),
                created_at=today.isoformat()
            ))

    # Ad spend efficiency alert
    current_spend = db.query(func.sum(AdSpend.spend)).join(
        DateDimension, AdSpend.date_key == DateDimension.date_key
    ).filter(DateDimension.full_date >= current_start).scalar() or Decimal("0")

    if current_spend > 0 and current_revenue > 0:
        current_roas = float(current_revenue) / float(current_spend)

        prev_spend = db.query(func.sum(AdSpend.spend)).join(
            DateDimension, AdSpend.date_key == DateDimension.date_key
        ).filter(
            DateDimension.full_date >= prev_start,
            DateDimension.full_date < current_start
        ).scalar() or Decimal("0")

        if prev_spend > 0:
            prev_roas = float(prev_revenue) / float(prev_spend)
            roas_change = ((current_roas - prev_roas) / prev_roas) * 100 if prev_roas > 0 else 0

            if current_roas < 2:
                alerts.append(AlertResponse(
                    alert_id="low_roas",
                    alert_type="warning",
                    title="ROAS Baixo",
                    message=f"O ROAS atual é {current_roas:.2f}x, abaixo do recomendado (2x)",
                    metric="roas",
                    current_value=current_roas,
                    threshold=2.0,
                    change_percent=round(roas_change, 2),
                    created_at=today.isoformat()
                ))

    # Churn alert
    churned_count = db.query(func.count(Customer.customer_id)).filter(
        Customer.is_churned == True,
        Customer.total_orders > 0
    ).scalar() or 0

    total_customers = db.query(func.count(Customer.customer_id)).filter(
        Customer.total_orders > 0
    ).scalar() or 1

    churn_rate = (churned_count / total_customers) * 100

    if churn_rate > 15:
        alerts.append(AlertResponse(
            alert_id="high_churn",
            alert_type="warning",
            title="Taxa de Churn Alta",
            message=f"{churned_count} clientes ({churn_rate:.1f}%) não compram há mais de 90 dias",
            metric="churn_rate",
            current_value=churn_rate,
            threshold=15.0,
            created_at=today.isoformat()
        ))

    return alerts
