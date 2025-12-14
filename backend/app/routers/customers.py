from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_
from datetime import date, timedelta
from decimal import Decimal
from typing import List, Optional

from ..database import get_db
from ..models import Customer, Order, Channel
from ..schemas.customer import CustomerResponse, CustomerList, RFMSegment

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("/list", response_model=CustomerList)
def get_customers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    segment: Optional[str] = None,
    channel: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get paginated list of customers with filters."""
    query = db.query(Customer)

    if segment:
        query = query.filter(Customer.rfm_segment == segment)
    if channel:
        query = query.filter(Customer.first_order_channel == channel)
    if search:
        query = query.filter(
            Customer.external_customer_id.contains(search) |
            Customer.city.contains(search)
        )

    total = query.count()
    customers = query.order_by(
        Customer.total_revenue.desc()
    ).offset((page - 1) * limit).limit(limit).all()

    return CustomerList(
        items=[CustomerResponse.model_validate(c) for c in customers],
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit
    )


@router.get("/rfm-segments", response_model=List[RFMSegment])
def get_rfm_segments(
    db: Session = Depends(get_db)
):
    """Get RFM segment distribution."""
    results = db.query(
        Customer.rfm_segment,
        func.count(Customer.customer_id).label("count"),
        func.sum(Customer.total_revenue).label("total_revenue"),
        func.avg(Customer.total_orders).label("avg_orders"),
        func.avg(Customer.total_revenue).label("avg_revenue")
    ).filter(
        Customer.rfm_segment.isnot(None)
    ).group_by(
        Customer.rfm_segment
    ).all()

    total_customers = sum(r.count for r in results)

    return [
        RFMSegment(
            segment=r.rfm_segment,
            count=r.count,
            percentage=round((r.count / total_customers * 100), 2) if total_customers > 0 else 0,
            total_revenue=r.total_revenue or Decimal("0"),
            avg_orders=round(float(r.avg_orders or 0), 2),
            avg_revenue=Decimal(r.avg_revenue or 0).quantize(Decimal("0.01"))
        )
        for r in results
    ]


@router.get("/cohort-analysis")
def get_cohort_analysis(
    db: Session = Depends(get_db)
):
    """Get cohort analysis data."""
    # Get customers grouped by cohort month
    cohort_data = []

    # Query cohorts
    cohorts = db.query(
        func.date_format(Customer.first_order_date, '%Y-%m').label("cohort_month"),
        func.count(Customer.customer_id).label("cohort_size")
    ).filter(
        Customer.first_order_date.isnot(None)
    ).group_by(
        func.date_format(Customer.first_order_date, '%Y-%m')
    ).order_by(
        func.date_format(Customer.first_order_date, '%Y-%m')
    ).all()

    for cohort in cohorts:
        cohort_month = cohort.cohort_month

        # For each month since acquisition, get metrics
        for month_offset in range(12):
            # Count active customers in this period
            active = db.query(
                func.count(func.distinct(Order.customer_id))
            ).join(
                Customer, Order.customer_id == Customer.customer_id
            ).filter(
                func.date_format(Customer.first_order_date, '%Y-%m') == cohort_month,
                func.timestampdiff(
                    "MONTH",
                    Customer.first_order_date,
                    Order.order_created_at
                ) == month_offset,
                Order.order_status != "cancelled"
            ).scalar() or 0

            # Revenue in this period
            revenue = db.query(
                func.sum(Order.total_amount)
            ).join(
                Customer, Order.customer_id == Customer.customer_id
            ).filter(
                func.date_format(Customer.first_order_date, '%Y-%m') == cohort_month,
                func.timestampdiff(
                    "MONTH",
                    Customer.first_order_date,
                    Order.order_created_at
                ) == month_offset,
                Order.order_status != "cancelled"
            ).scalar() or Decimal("0")

            retention_rate = (active / cohort.cohort_size * 100) if cohort.cohort_size > 0 else 0

            cohort_data.append({
                "cohort_month": cohort_month,
                "months_since_acquisition": month_offset,
                "cohort_size": cohort.cohort_size,
                "active_customers": active,
                "revenue": float(revenue),
                "retention_rate": round(retention_rate, 2),
                "ltv": round(float(revenue) / cohort.cohort_size, 2) if cohort.cohort_size > 0 else 0
            })

    return cohort_data


@router.get("/ltv-by-cohort")
def get_ltv_by_cohort(
    db: Session = Depends(get_db)
):
    """Get LTV analysis by cohort."""
    results = db.query(
        func.date_format(Customer.first_order_date, '%Y-%m').label("cohort_month"),
        Customer.first_order_channel,
        func.count(Customer.customer_id).label("cohort_size"),
        func.sum(Customer.total_revenue).label("total_ltv"),
        func.avg(Customer.total_revenue).label("avg_ltv"),
        func.avg(Customer.total_orders).label("avg_orders")
    ).filter(
        Customer.first_order_date.isnot(None),
        Customer.total_orders > 0
    ).group_by(
        func.date_format(Customer.first_order_date, '%Y-%m'),
        Customer.first_order_channel
    ).order_by(
        func.date_format(Customer.first_order_date, '%Y-%m').desc()
    ).all()

    return [
        {
            "cohort_month": r.cohort_month,
            "acquisition_channel": r.first_order_channel,
            "cohort_size": r.cohort_size,
            "total_ltv": float(r.total_ltv or 0),
            "avg_ltv": round(float(r.avg_ltv or 0), 2),
            "avg_orders": round(float(r.avg_orders or 0), 2)
        }
        for r in results
    ]


@router.get("/distribution")
def get_customer_distribution(
    db: Session = Depends(get_db)
):
    """Get customer distribution stats."""
    today = date.today()
    last_30_days = today - timedelta(days=30)

    # Total customers
    total = db.query(func.count(Customer.customer_id)).filter(
        Customer.total_orders > 0
    ).scalar() or 0

    # New customers (first order in last 30 days)
    new_customers = db.query(func.count(Customer.customer_id)).filter(
        Customer.first_order_date >= last_30_days
    ).scalar() or 0

    # Repeat customers
    repeat = db.query(func.count(Customer.customer_id)).filter(
        Customer.is_repeat_customer == True
    ).scalar() or 0

    # Churned
    churned = db.query(func.count(Customer.customer_id)).filter(
        Customer.is_churned == True
    ).scalar() or 0

    # VIPs
    vips = db.query(func.count(Customer.customer_id)).filter(
        Customer.is_vip == True
    ).scalar() or 0

    # By channel
    by_channel = db.query(
        Customer.first_order_channel,
        func.count(Customer.customer_id).label("count"),
        func.sum(Customer.total_revenue).label("revenue")
    ).filter(
        Customer.first_order_channel.isnot(None)
    ).group_by(
        Customer.first_order_channel
    ).all()

    return {
        "total_customers": total,
        "new_customers_30d": new_customers,
        "repeat_customers": repeat,
        "repeat_rate": round((repeat / total * 100), 2) if total > 0 else 0,
        "churned_customers": churned,
        "churn_rate": round((churned / total * 100), 2) if total > 0 else 0,
        "vip_customers": vips,
        "by_channel": [
            {
                "channel": r.first_order_channel,
                "count": r.count,
                "revenue": float(r.revenue or 0),
                "percentage": round((r.count / total * 100), 2) if total > 0 else 0
            }
            for r in by_channel
        ]
    }


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db)
):
    """Get single customer details."""
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    return CustomerResponse.model_validate(customer)


@router.get("/{customer_id}/orders")
def get_customer_orders(
    customer_id: int,
    db: Session = Depends(get_db)
):
    """Get customer's order history."""
    orders = db.query(Order).filter(
        Order.customer_id == customer_id
    ).order_by(Order.order_created_at.desc()).all()

    return [
        {
            "order_id": o.order_id,
            "external_order_id": o.external_order_id,
            "order_date": o.order_created_at.isoformat(),
            "status": o.order_status,
            "total_amount": float(o.total_amount),
            "items": o.total_items,
            "channel": o.utm_source
        }
        for o in orders
    ]
