from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from decimal import Decimal
from typing import List, Optional

from ..database import get_db
from ..models import Product, OrderItem, Order, DateDimension
from ..schemas.product import ProductResponse, ProductPerformance

router = APIRouter(prefix="/products", tags=["Products"])


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


@router.get("/list")
def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    abc: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get paginated list of products."""
    query = db.query(Product)

    if category:
        query = query.filter(Product.category_level_1 == category)
    if abc:
        query = query.filter(Product.abc_classification == abc)
    if search:
        query = query.filter(
            Product.product_name.contains(search) |
            Product.sku.contains(search)
        )

    total = query.count()
    products = query.order_by(
        Product.total_revenue.desc()
    ).offset((page - 1) * limit).limit(limit).all()

    return {
        "items": [ProductResponse.model_validate(p) for p in products],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/abc-classification")
def get_abc_classification(
    db: Session = Depends(get_db)
):
    """Get ABC classification summary."""
    results = db.query(
        Product.abc_classification,
        func.count(Product.product_id).label("product_count"),
        func.sum(Product.total_revenue).label("revenue")
    ).filter(
        Product.abc_classification.isnot(None)
    ).group_by(
        Product.abc_classification
    ).order_by(
        Product.abc_classification
    ).all()

    total_revenue = sum(float(r.revenue or 0) for r in results)
    cumulative = 0

    data = []
    for r in results:
        revenue = float(r.revenue or 0)
        cumulative += revenue

        data.append({
            "classification": r.abc_classification,
            "product_count": r.product_count,
            "revenue": revenue,
            "revenue_percentage": round((revenue / total_revenue * 100), 2) if total_revenue > 0 else 0,
            "cumulative_percentage": round((cumulative / total_revenue * 100), 2) if total_revenue > 0 else 0
        })

    return data


@router.get("/top-performers")
def get_top_performers(
    limit: int = Query(10, ge=1, le=50),
    period: str = Query("30d"),
    db: Session = Depends(get_db)
):
    """Get top performing products by revenue."""
    start_date, end_date = get_date_range(period)

    results = db.query(
        Product.product_id,
        Product.product_name,
        Product.category_level_1,
        Product.abc_classification,
        Product.margin_percent,
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
        Product.category_level_1,
        Product.abc_classification,
        Product.margin_percent
    ).order_by(
        func.sum(OrderItem.total_price).desc()
    ).limit(limit).all()

    return [
        {
            "rank": i + 1,
            "product_id": r.product_id,
            "product_name": r.product_name,
            "category": r.category_level_1,
            "abc_classification": r.abc_classification,
            "units_sold": r.units_sold,
            "revenue": float(r.revenue or 0),
            "margin_percent": float(r.margin_percent or 0)
        }
        for i, r in enumerate(results)
    ]


@router.get("/by-category")
def get_products_by_category(
    period: str = Query("30d"),
    db: Session = Depends(get_db)
):
    """Get product performance by category."""
    start_date, end_date = get_date_range(period)

    results = db.query(
        Product.category_level_1,
        func.count(func.distinct(Product.product_id)).label("products"),
        func.sum(OrderItem.quantity).label("units_sold"),
        func.sum(OrderItem.total_price).label("revenue"),
        func.avg(Product.margin_percent).label("avg_margin")
    ).join(
        OrderItem, Product.product_id == OrderItem.product_id
    ).join(
        Order, OrderItem.order_id == Order.order_id
    ).filter(
        Order.order_created_at >= start_date,
        Order.order_created_at <= end_date,
        Order.order_status != "cancelled"
    ).group_by(
        Product.category_level_1
    ).order_by(
        func.sum(OrderItem.total_price).desc()
    ).all()

    total_revenue = sum(float(r.revenue or 0) for r in results)

    return [
        {
            "category": r.category_level_1,
            "products": r.products,
            "units_sold": r.units_sold,
            "revenue": float(r.revenue or 0),
            "avg_margin": round(float(r.avg_margin or 0), 2),
            "percentage": round((float(r.revenue or 0) / total_revenue * 100), 2) if total_revenue > 0 else 0
        }
        for r in results
    ]


@router.get("/trends")
def get_product_trends(
    period: str = Query("30d"),
    db: Session = Depends(get_db)
):
    """Identify trending and declining products."""
    start_date, end_date = get_date_range(period)
    period_days = (end_date - start_date).days
    mid_date = start_date + timedelta(days=period_days // 2)

    # First half performance
    first_half = db.query(
        Product.product_id,
        func.sum(OrderItem.total_price).label("revenue")
    ).join(
        OrderItem, Product.product_id == OrderItem.product_id
    ).join(
        Order, OrderItem.order_id == Order.order_id
    ).filter(
        Order.order_created_at >= start_date,
        Order.order_created_at < mid_date,
        Order.order_status != "cancelled"
    ).group_by(Product.product_id).all()

    first_half_dict = {r.product_id: float(r.revenue or 0) for r in first_half}

    # Second half performance
    second_half = db.query(
        Product.product_id,
        Product.product_name,
        Product.category_level_1,
        func.sum(OrderItem.total_price).label("revenue")
    ).join(
        OrderItem, Product.product_id == OrderItem.product_id
    ).join(
        Order, OrderItem.order_id == Order.order_id
    ).filter(
        Order.order_created_at >= mid_date,
        Order.order_created_at <= end_date,
        Order.order_status != "cancelled"
    ).group_by(
        Product.product_id,
        Product.product_name,
        Product.category_level_1
    ).all()

    trending = []
    declining = []

    for r in second_half:
        first_revenue = first_half_dict.get(r.product_id, 0)
        second_revenue = float(r.revenue or 0)

        if first_revenue > 0:
            change = ((second_revenue - first_revenue) / first_revenue) * 100
        elif second_revenue > 0:
            change = 100  # New product
        else:
            change = 0

        product_data = {
            "product_id": r.product_id,
            "product_name": r.product_name,
            "category": r.category_level_1,
            "first_half_revenue": first_revenue,
            "second_half_revenue": second_revenue,
            "change_percent": round(change, 2)
        }

        if change >= 20:
            trending.append(product_data)
        elif change <= -20:
            declining.append(product_data)

    return {
        "trending": sorted(trending, key=lambda x: x["change_percent"], reverse=True)[:10],
        "declining": sorted(declining, key=lambda x: x["change_percent"])[:10]
    }


@router.get("/stock-analysis")
def get_stock_analysis(
    db: Session = Depends(get_db)
):
    """Analyze stock levels vs sales velocity."""
    # Calculate average daily sales for last 30 days
    start_date = date.today() - timedelta(days=30)

    results = db.query(
        Product.product_id,
        Product.product_name,
        Product.stock_quantity,
        Product.current_price,
        func.sum(OrderItem.quantity).label("units_sold")
    ).outerjoin(
        OrderItem, Product.product_id == OrderItem.product_id
    ).outerjoin(
        Order, OrderItem.order_id == Order.order_id
    ).filter(
        (Order.order_created_at >= start_date) | (Order.order_id.is_(None)),
        (Order.order_status != "cancelled") | (Order.order_id.is_(None))
    ).group_by(
        Product.product_id,
        Product.product_name,
        Product.stock_quantity,
        Product.current_price
    ).all()

    analysis = []
    for r in results:
        daily_velocity = (r.units_sold or 0) / 30
        stock = r.stock_quantity or 0
        days_of_stock = stock / daily_velocity if daily_velocity > 0 else float('inf')

        if days_of_stock < 7:
            status = "critical"
        elif days_of_stock < 14:
            status = "low"
        elif days_of_stock < 60:
            status = "healthy"
        else:
            status = "overstock"

        analysis.append({
            "product_id": r.product_id,
            "product_name": r.product_name,
            "stock_quantity": stock,
            "daily_velocity": round(daily_velocity, 2),
            "days_of_stock": round(days_of_stock, 1) if days_of_stock != float('inf') else None,
            "stock_value": float(stock * (r.current_price or 0)),
            "status": status
        })

    return {
        "products": sorted(analysis, key=lambda x: x["days_of_stock"] or 9999),
        "summary": {
            "critical": len([p for p in analysis if p["status"] == "critical"]),
            "low": len([p for p in analysis if p["status"] == "low"]),
            "healthy": len([p for p in analysis if p["status"] == "healthy"]),
            "overstock": len([p for p in analysis if p["status"] == "overstock"])
        }
    }


@router.get("/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Get single product details."""
    product = db.query(Product).filter(Product.product_id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return ProductResponse.model_validate(product)
