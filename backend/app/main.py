from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import (
    dashboard_router,
    customers_router,
    orders_router,
    products_router,
    campaigns_router,
    predictions_router
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="API for Cortex Analytics E-commerce Dashboard"
)

# CORS configuration
allowed_origins = [
    "https://dash-modelo-ecommerce.up.railway.app",
    "https://modelo-ecommerce.capdigital.company",
    "https://cortex-ecommerce-production.up.railway.app",
    "https://cortex-ecommerce.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
app.include_router(orders_router, prefix=settings.API_V1_PREFIX)
app.include_router(customers_router, prefix=settings.API_V1_PREFIX)
app.include_router(products_router, prefix=settings.API_V1_PREFIX)
app.include_router(campaigns_router, prefix=settings.API_V1_PREFIX)
app.include_router(predictions_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
