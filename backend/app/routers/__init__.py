from .dashboard import router as dashboard_router
from .customers import router as customers_router
from .orders import router as orders_router
from .products import router as products_router
from .campaigns import router as campaigns_router
from .predictions import router as predictions_router

__all__ = [
    "dashboard_router",
    "customers_router",
    "orders_router",
    "products_router",
    "campaigns_router",
    "predictions_router"
]
