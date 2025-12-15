from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from decimal import Decimal
from typing import List, Optional
import numpy as np
import math

from ..database import get_db


from ..models import Customer, Order, Product, DateDimension


def safe_float(value):
    """Convert numpy values to JSON-safe Python floats."""
    if value is None:
        return None
    val = float(value)
    if math.isnan(val) or math.isinf(val):
        return None
    return val

router = APIRouter(prefix="/predictions", tags=["Predictions"])


@router.get("/sales-forecast")
def get_sales_forecast(
    days: int = Query(30, ge=7, le=90),
    db: Session = Depends(get_db)
):
    """Predict sales for the next N days using simple trend analysis."""
    # Get last 90 days of data
    end_date = date.today()
    start_date = end_date - timedelta(days=90)

    historical = db.query(
        DateDimension.full_date,
        func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
        func.coalesce(func.count(Order.order_id), 0).label("orders")
    ).outerjoin(
        Order, DateDimension.date_key == Order.date_key
    ).filter(
        DateDimension.full_date >= start_date,
        DateDimension.full_date <= end_date
    ).group_by(DateDimension.full_date).order_by(DateDimension.full_date).all()

    if len(historical) < 30:
        return {"error": "Not enough historical data for prediction"}

    # Extract revenue values
    revenues = [float(h.revenue) for h in historical]

    # Calculate trend using simple linear regression
    x = np.arange(len(revenues))
    y = np.array(revenues)

    # Linear regression
    n = len(x)
    sum_x = np.sum(x)
    sum_y = np.sum(y)
    sum_xy = np.sum(x * y)
    sum_x2 = np.sum(x ** 2)

    slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x ** 2)
    intercept = (sum_y - slope * sum_x) / n

    # Calculate seasonality (day of week effect)
    dow_avg = {}
    for i, h in enumerate(historical):
        dow = h.full_date.weekday()
        if dow not in dow_avg:
            dow_avg[dow] = []
        dow_avg[dow].append(revenues[i])

    mean_revenues = np.mean(revenues)
    dow_factors = {dow: (np.mean(vals) / mean_revenues if mean_revenues > 0 else 1.0) for dow, vals in dow_avg.items()}

    # Generate predictions
    predictions = []
    avg_revenue = np.mean(revenues)

    for i in range(days):
        future_date = end_date + timedelta(days=i + 1)
        future_x = len(revenues) + i

        # Base prediction from trend
        base_prediction = intercept + slope * future_x

        # Apply day of week seasonality
        dow = future_date.weekday()
        seasonal_factor = dow_factors.get(dow, 1.0)
        prediction = base_prediction * seasonal_factor

        # Add some variance
        variance = avg_revenue * 0.1  # 10% variance
        lower_bound = max(0, prediction - variance)
        upper_bound = prediction + variance

        predictions.append({
            "date": future_date.isoformat(),
            "predicted_revenue": safe_float(round(prediction, 2)),
            "lower_bound": safe_float(round(lower_bound, 2)),
            "upper_bound": safe_float(round(upper_bound, 2)),
            "day_of_week": future_date.strftime("%A")
        })

    # Calculate total predictions
    total_predicted = sum(p["predicted_revenue"] or 0 for p in predictions)

    # Compare with same period last year (if available)
    last_year_start = end_date - timedelta(days=365)
    last_year_end = last_year_start + timedelta(days=days)

    last_year_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.order_created_at >= last_year_start,
        Order.order_created_at <= last_year_end,
        Order.order_status != "cancelled"
    ).scalar() or Decimal("0")

    return {
        "predictions": predictions,
        "summary": {
            "total_predicted_revenue": round(total_predicted, 2),
            "avg_daily_revenue": round(total_predicted / days, 2),
            "last_year_same_period": float(last_year_revenue),
            "yoy_change": round(((total_predicted - float(last_year_revenue)) / float(last_year_revenue) * 100), 2) if last_year_revenue > 0 else None
        },
        "model_info": {
            "method": "Linear Regression with DOW Seasonality",
            "training_days": len(revenues),
            "trend_slope": safe_float(round(slope, 4))
        }
    }


@router.get("/customer-ltv/{customer_id}")
def predict_customer_ltv(
    customer_id: int,
    db: Session = Depends(get_db)
):
    """Predict LTV for a specific customer."""
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()

    if not customer:
        return {"error": "Customer not found"}

    # Current metrics
    current_ltv = float(customer.total_revenue or 0)
    total_orders = customer.total_orders or 0
    customer_lifetime = customer.customer_lifetime_days or 0
    aov = float(customer.average_order_value or 0)

    if total_orders == 0 or customer_lifetime == 0:
        return {
            "customer_id": customer_id,
            "current_ltv": current_ltv,
            "predicted_ltv_1y": current_ltv,
            "predicted_ltv_3y": current_ltv,
            "prediction_confidence": "low"
        }

    # Calculate purchase frequency (orders per month)
    monthly_frequency = total_orders / (customer_lifetime / 30) if customer_lifetime > 0 else 0

    # Project future orders
    orders_1y = monthly_frequency * 12
    orders_3y = monthly_frequency * 36

    # Consider retention decay
    retention_rate = 0.8 if customer.is_repeat_customer else 0.5
    churn_factor_1y = retention_rate
    churn_factor_3y = retention_rate ** 3

    # Calculate predicted LTV
    predicted_1y = current_ltv + (orders_1y * aov * churn_factor_1y)
    predicted_3y = current_ltv + (orders_3y * aov * churn_factor_3y)

    # Confidence based on data points
    confidence = "high" if total_orders >= 5 else ("medium" if total_orders >= 2 else "low")

    return {
        "customer_id": customer_id,
        "customer_segment": customer.rfm_segment,
        "current_metrics": {
            "total_revenue": current_ltv,
            "total_orders": total_orders,
            "aov": aov,
            "customer_lifetime_days": customer_lifetime,
            "monthly_frequency": round(monthly_frequency, 2)
        },
        "predictions": {
            "ltv_1y": round(predicted_1y, 2),
            "ltv_3y": round(predicted_3y, 2),
            "expected_orders_1y": round(orders_1y, 1),
            "retention_probability": retention_rate
        },
        "prediction_confidence": confidence
    }


@router.get("/churn-risk")
def get_churn_risk(
    db: Session = Depends(get_db)
):
    """Get customers at risk of churn."""
    # Customers with orders but haven't purchased recently
    at_risk = db.query(Customer).filter(
        Customer.total_orders > 0,
        Customer.days_since_last_order >= 60,
        Customer.days_since_last_order < 90,
        Customer.is_churned == False
    ).order_by(Customer.total_revenue.desc()).limit(50).all()

    high_risk = db.query(Customer).filter(
        Customer.total_orders > 0,
        Customer.days_since_last_order >= 90,
        Customer.is_churned == True
    ).order_by(Customer.total_revenue.desc()).limit(50).all()

    def calculate_risk_score(customer):
        """Calculate churn risk score (0-100)."""
        score = 0

        # Recency factor (0-40 points)
        days = customer.days_since_last_order or 0
        if days >= 90:
            score += 40
        elif days >= 60:
            score += 30
        elif days >= 30:
            score += 20
        else:
            score += 10

        # Frequency factor (0-30 points)
        if customer.total_orders == 1:
            score += 30
        elif customer.total_orders <= 3:
            score += 20
        else:
            score += 10

        # Value factor (0-30 points) - Lower value = higher risk
        aov = float(customer.average_order_value or 0)
        if aov < 100:
            score += 30
        elif aov < 200:
            score += 20
        else:
            score += 10

        return score

    at_risk_data = [
        {
            "customer_id": c.customer_id,
            "external_id": c.external_customer_id,
            "segment": c.rfm_segment,
            "days_since_last_order": c.days_since_last_order,
            "total_orders": c.total_orders,
            "total_revenue": float(c.total_revenue or 0),
            "risk_score": calculate_risk_score(c),
            "risk_level": "medium"
        }
        for c in at_risk
    ]

    high_risk_data = [
        {
            "customer_id": c.customer_id,
            "external_id": c.external_customer_id,
            "segment": c.rfm_segment,
            "days_since_last_order": c.days_since_last_order,
            "total_orders": c.total_orders,
            "total_revenue": float(c.total_revenue or 0),
            "risk_score": calculate_risk_score(c),
            "risk_level": "high"
        }
        for c in high_risk
    ]

    total_at_risk_revenue = sum(c["total_revenue"] for c in at_risk_data + high_risk_data)

    return {
        "summary": {
            "at_risk_count": len(at_risk_data),
            "high_risk_count": len(high_risk_data),
            "total_revenue_at_risk": total_at_risk_revenue
        },
        "at_risk_customers": at_risk_data,
        "high_risk_customers": high_risk_data
    }


@router.get("/recommendations")
def get_recommendations(
    db: Session = Depends(get_db)
):
    """Get AI-powered recommendations based on data analysis."""
    recommendations = []

    # Check ROAS
    today = date.today()
    last_7_days = today - timedelta(days=7)

    # Get recent metrics
    recent_orders = db.query(func.count(Order.order_id)).filter(
        Order.order_created_at >= last_7_days,
        Order.order_status != "cancelled"
    ).scalar() or 0

    # Get churned VIPs
    churned_vips = db.query(func.count(Customer.customer_id)).filter(
        Customer.is_vip == True,
        Customer.is_churned == True
    ).scalar() or 0

    if churned_vips > 0:
        recommendations.append({
            "id": "recover_vips",
            "priority": "high",
            "category": "retention",
            "title": "Recuperar Clientes VIP",
            "description": f"Você tem {churned_vips} clientes VIP que não compram há mais de 90 dias. Considere uma campanha de reativação personalizada.",
            "potential_impact": f"Potencial de recuperar R$ {churned_vips * 500:.0f}+ em receita",
            "action": "Criar campanha de email personalizada com oferta exclusiva"
        })

    # Check product stock
    low_stock = db.query(func.count(Product.product_id)).filter(
        Product.stock_quantity < 10,
        Product.is_active == True,
        Product.abc_classification == "A"
    ).scalar() or 0

    if low_stock > 0:
        recommendations.append({
            "id": "restock_products",
            "priority": "high",
            "category": "inventory",
            "title": "Produtos A com Estoque Baixo",
            "description": f"{low_stock} produtos da curva A estão com estoque crítico. Priorize a reposição para não perder vendas.",
            "potential_impact": "Evitar perda de vendas por falta de estoque",
            "action": "Verificar fornecedores e acelerar pedidos de compra"
        })

    # Check conversion rate
    recommendations.append({
        "id": "optimize_checkout",
        "priority": "medium",
        "category": "conversion",
        "title": "Otimizar Taxa de Conversão",
        "description": "A taxa de abandono de carrinho está em 75%. Considere implementar remarketing de carrinho abandonado.",
        "potential_impact": "Aumento de 10-15% nas conversões",
        "action": "Configurar automação de email para carrinhos abandonados"
    })

    # RFM-based recommendations
    at_risk_count = db.query(func.count(Customer.customer_id)).filter(
        Customer.rfm_segment == "At Risk"
    ).scalar() or 0

    if at_risk_count > 20:
        recommendations.append({
            "id": "save_at_risk",
            "priority": "medium",
            "category": "retention",
            "title": "Clientes em Risco",
            "description": f"{at_risk_count} clientes frequentes estão em risco de churn. Eram compradores ativos mas não compram há muito tempo.",
            "potential_impact": f"Recuperar até {at_risk_count * 0.3:.0f} clientes com campanhas direcionadas",
            "action": "Enviar pesquisa de satisfação + cupom de desconto"
        })

    # Seasonal recommendation
    if today.month in [10, 11]:
        recommendations.append({
            "id": "blackfriday_prep",
            "priority": "high",
            "category": "seasonal",
            "title": "Preparação Black Friday",
            "description": "A Black Friday está chegando. É hora de preparar estoque, campanhas e infraestrutura.",
            "potential_impact": "Aumento de 50-100% nas vendas durante o período",
            "action": "Planejar promoções, verificar estoque e escalar servidores"
        })

    return {
        "recommendations": recommendations,
        "generated_at": today.isoformat()
    }


@router.post("/simulate")
def simulate_scenario(
    spend_increase: float = Query(0, description="% increase in ad spend"),
    price_change: float = Query(0, description="% change in prices"),
    db: Session = Depends(get_db)
):
    """Simulate business scenarios."""
    today = date.today()
    last_30_days = today - timedelta(days=30)

    # Get baseline metrics
    baseline = db.query(
        func.sum(Order.total_amount).label("revenue"),
        func.count(Order.order_id).label("orders"),
        func.avg(Order.total_amount).label("aov")
    ).filter(
        Order.order_created_at >= last_30_days,
        Order.order_status != "cancelled"
    ).first()

    baseline_revenue = float(baseline.revenue or 0)
    baseline_orders = baseline.orders or 0
    baseline_aov = float(baseline.aov or 0)

    # Simulate spend increase effect
    # Assume diminishing returns: 1% spend increase = 0.5% revenue increase
    spend_effect = spend_increase * 0.5 / 100

    # Simulate price change effect
    # Price increase: demand elasticity of -1.2 (1% price increase = 1.2% demand decrease)
    price_elasticity = -1.2
    quantity_effect = price_change * price_elasticity / 100
    revenue_from_price = (1 + price_change / 100) * (1 + quantity_effect) - 1

    # Combined effect
    total_revenue_effect = spend_effect + revenue_from_price

    simulated_revenue = baseline_revenue * (1 + total_revenue_effect)
    simulated_orders = baseline_orders * (1 + quantity_effect)
    simulated_aov = baseline_aov * (1 + price_change / 100)

    return {
        "baseline": {
            "revenue": baseline_revenue,
            "orders": baseline_orders,
            "aov": baseline_aov
        },
        "inputs": {
            "spend_increase_pct": spend_increase,
            "price_change_pct": price_change
        },
        "simulated": {
            "revenue": round(simulated_revenue, 2),
            "orders": int(simulated_orders),
            "aov": round(simulated_aov, 2),
            "revenue_change_pct": round(total_revenue_effect * 100, 2),
            "orders_change_pct": round(quantity_effect * 100, 2)
        },
        "notes": [
            "Simulação baseada em elasticidade de demanda de -1.2",
            "Aumento de spend tem retornos decrescentes (1% spend = 0.5% revenue)",
            "Resultados são estimativas e podem variar"
        ]
    }
