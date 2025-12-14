"""
Seed script to populate database with realistic mock data for Cortex Analytics demo.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import random
from datetime import datetime, date, timedelta
from decimal import Decimal
import hashlib
from sqlalchemy import text

from app.database import SessionLocal, engine
from app.models import (
    Customer, Product, Order, OrderItem, Campaign, AdSpend,
    Channel, DateDimension, Session, Attribution, CohortMetric
)

# Seed for reproducibility
random.seed(42)

# Brazilian states and cities
STATES = {
    "SP": ["São Paulo", "Campinas", "Santos", "Ribeirão Preto", "Guarulhos"],
    "RJ": ["Rio de Janeiro", "Niterói", "Petrópolis", "Nova Iguaçu"],
    "MG": ["Belo Horizonte", "Uberlândia", "Juiz de Fora", "Contagem"],
    "RS": ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas"],
    "PR": ["Curitiba", "Londrina", "Maringá", "Ponta Grossa"],
    "SC": ["Florianópolis", "Joinville", "Blumenau", "Balneário Camboriú"],
    "BA": ["Salvador", "Feira de Santana", "Vitória da Conquista"],
    "PE": ["Recife", "Olinda", "Jaboatão dos Guararapes"],
    "CE": ["Fortaleza", "Caucaia", "Juazeiro do Norte"],
    "GO": ["Goiânia", "Aparecida de Goiânia", "Anápolis"],
}

# Product categories
CATEGORIES = {
    "Eletrônicos": ["Smartphones", "Tablets", "Acessórios", "Áudio"],
    "Moda Feminina": ["Vestidos", "Blusas", "Calças", "Acessórios"],
    "Moda Masculina": ["Camisetas", "Calças", "Tênis", "Acessórios"],
    "Casa e Decoração": ["Móveis", "Iluminação", "Têxtil", "Decoração"],
    "Beleza": ["Skincare", "Maquiagem", "Perfumes", "Cabelos"],
    "Esportes": ["Fitness", "Running", "Natação", "Yoga"],
    "Kids": ["Roupas", "Brinquedos", "Calçados", "Acessórios"],
    "Pet Shop": ["Alimentação", "Acessórios", "Higiene", "Brinquedos"],
    "Livros": ["Ficção", "Negócios", "Autoajuda", "Técnicos"],
    "Games": ["Consoles", "Jogos", "Acessórios", "PC Gaming"],
}

BRANDS = [
    "Cortex Premium", "Urban Style", "Tech Plus", "Natural Life",
    "Sport Max", "Home Design", "Baby Care", "Pet Love", "Book World", "Game Zone"
]

# UTM sources and channels
UTM_SOURCES = {
    "facebook": ("cpc", "Paid Social"),
    "instagram": ("cpc", "Paid Social"),
    "google": ("cpc", "Paid Search"),
    "google_organic": ("organic", "Organic Search"),
    "direct": ("none", "Direct"),
    "email": ("email", "Email"),
    "tiktok": ("cpc", "Paid Social"),
    "referral": ("referral", "Referral"),
}

PAYMENT_METHODS = ["credit_card", "pix", "boleto", "debit_card"]

CAMPAIGN_TYPES = ["Prospecting", "Retargeting", "Lookalike", "Brand", "Remarketing"]
FUNNEL_STAGES = ["TOFU", "MOFU", "BOFU"]
CAMPAIGN_OBJECTIVES = ["Conversions", "Traffic", "Engagement", "Reach", "Sales"]


def generate_hash(value: str) -> str:
    """Generate SHA256 hash for LGPD compliance."""
    return hashlib.sha256(value.encode()).hexdigest()


def create_date_dimensions(db):
    """Create date dimension table entries."""
    print("Creating date dimensions...")

    start_date = date(2023, 1, 1)
    end_date = date(2025, 12, 31)
    current = start_date

    dates = []
    while current <= end_date:
        date_key = int(current.strftime("%Y%m%d"))

        dates.append(DateDimension(
            date_key=date_key,
            full_date=current,
            day_of_week=current.isoweekday() % 7 + 1,
            day_of_week_name=current.strftime("%A"),
            day_of_month=current.day,
            day_of_year=current.timetuple().tm_yday,
            week_of_year=current.isocalendar()[1],
            month_number=current.month,
            month_name=current.strftime("%B"),
            quarter=(current.month - 1) // 3 + 1,
            year=current.year,
            is_weekend=current.weekday() >= 5,
            is_holiday=False
        ))
        current += timedelta(days=1)

    db.bulk_save_objects(dates)
    db.commit()
    print(f"Created {len(dates)} date records.")


def create_channels(db):
    """Create marketing channels."""
    print("Creating channels...")

    channels = [
        Channel(channel_name="Paid Social", channel_group="Paid", is_paid=True),
        Channel(channel_name="Paid Search", channel_group="Paid", is_paid=True),
        Channel(channel_name="Organic Search", channel_group="Organic", is_paid=False),
        Channel(channel_name="Organic Social", channel_group="Organic", is_paid=False),
        Channel(channel_name="Direct", channel_group="Direct", is_paid=False),
        Channel(channel_name="Email", channel_group="Owned", is_paid=False),
        Channel(channel_name="Referral", channel_group="Earned", is_paid=False),
        Channel(channel_name="Affiliates", channel_group="Paid", is_paid=True),
        Channel(channel_name="Display", channel_group="Paid", is_paid=True),
        Channel(channel_name="Other", channel_group="Other", is_paid=False),
    ]

    db.bulk_save_objects(channels)
    db.commit()
    print(f"Created {len(channels)} channels.")

    return {c.channel_name: c.channel_id for c in db.query(Channel).all()}


def create_products(db):
    """Create 100 products across categories."""
    print("Creating products...")

    products = []
    product_id = 1

    for category, subcategories in CATEGORIES.items():
        for subcategory in subcategories:
            for i in range(2, 4):  # 2-3 products per subcategory
                price = Decimal(random.uniform(29.90, 999.90)).quantize(Decimal("0.01"))
                cost = price * Decimal(random.uniform(0.35, 0.55)).quantize(Decimal("0.01"))
                margin = ((price - cost) / price * 100).quantize(Decimal("0.01"))

                products.append(Product(
                    external_product_id=f"PROD-{product_id:04d}",
                    sku=f"SKU-{category[:3].upper()}-{product_id:04d}",
                    product_name=f"{random.choice(BRANDS)} {subcategory} {random.choice(['Premium', 'Plus', 'Pro', 'Basic', 'Lite'])} {i}",
                    category_level_1=category,
                    category_level_2=subcategory,
                    brand=random.choice(BRANDS),
                    current_price=price,
                    cost_price=cost,
                    margin_percent=margin,
                    is_active=random.random() > 0.1,
                    stock_quantity=random.randint(0, 500),
                ))
                product_id += 1

    db.bulk_save_objects(products)
    db.commit()
    print(f"Created {len(products)} products.")

    return list(db.query(Product).all())


def create_customers(db, channel_ids):
    """Create 500 customers with realistic distribution."""
    print("Creating customers...")

    customers = []

    # Distribution of acquisition channels
    channel_weights = {
        "Paid Social": 0.35,
        "Paid Search": 0.25,
        "Organic Search": 0.15,
        "Direct": 0.10,
        "Email": 0.05,
        "Referral": 0.05,
        "Other": 0.05,
    }

    start_date = date(2023, 1, 1)
    end_date = date(2024, 11, 30)

    for i in range(1, 501):
        state = random.choice(list(STATES.keys()))
        city = random.choice(STATES[state])

        # Acquisition date - weighted towards recent months
        days_range = (end_date - start_date).days
        acquisition_day = int(random.triangular(0, days_range, days_range * 0.7))
        first_order = start_date + timedelta(days=acquisition_day)

        channel = random.choices(
            list(channel_weights.keys()),
            weights=list(channel_weights.values())
        )[0]

        source_mapping = {
            "Paid Social": ("facebook", "cpc"),
            "Paid Search": ("google", "cpc"),
            "Organic Search": ("google_organic", "organic"),
            "Direct": ("direct", "none"),
            "Email": ("email", "email"),
            "Referral": ("referral", "referral"),
            "Other": ("other", "other"),
        }
        source, medium = source_mapping.get(channel, ("other", "other"))

        customers.append(Customer(
            external_customer_id=f"CUST-{i:05d}",
            email_hash=generate_hash(f"customer{i}@email.com"),
            phone_hash=generate_hash(f"119{random.randint(10000000, 99999999)}"),
            city=city,
            state=state,
            country="Brasil",
            postal_code=f"{random.randint(10000, 99999)}-{random.randint(100, 999)}",
            first_order_date=first_order,
            first_order_source=source,
            first_order_medium=medium,
            first_order_channel=channel,
        ))

    db.bulk_save_objects(customers)
    db.commit()
    print(f"Created {len(customers)} customers.")

    return list(db.query(Customer).all())


def create_campaigns(db):
    """Create 30 ad campaigns (Meta + Google)."""
    print("Creating campaigns...")

    campaigns = []

    # Meta campaigns
    for i in range(1, 16):
        campaign_type = random.choice(CAMPAIGN_TYPES)
        funnel = random.choice(FUNNEL_STAGES)

        campaigns.append(Campaign(
            platform="meta",
            platform_account_id="act_123456789",
            platform_campaign_id=f"META-{i:04d}",
            platform_adset_id=f"ADSET-{i:04d}",
            platform_ad_id=f"AD-{i:04d}",
            campaign_name=f"[{funnel}] {campaign_type} - {random.choice(['Conversão', 'Tráfego', 'Engajamento'])} {i}",
            adset_name=f"Público {random.choice(['Lookalike 1%', 'Retargeting 30d', 'Interesse', 'Custom'])}",
            ad_name=f"Criativo {random.choice(['Carrossel', 'Vídeo', 'Imagem', 'Collection'])} {i}",
            campaign_objective=random.choice(CAMPAIGN_OBJECTIVES),
            campaign_type=campaign_type,
            funnel_stage=funnel,
            utm_source="facebook",
            utm_medium="cpc",
            utm_campaign=f"meta_{campaign_type.lower()}_{i}",
            is_active=random.random() > 0.2,
            first_seen_date=date(2023, 1, 1) + timedelta(days=random.randint(0, 300)),
        ))

    # Google campaigns
    for i in range(1, 16):
        campaign_type = random.choice(CAMPAIGN_TYPES)
        funnel = random.choice(FUNNEL_STAGES)

        campaigns.append(Campaign(
            platform="google",
            platform_account_id="123-456-7890",
            platform_campaign_id=f"GOOGLE-{i:04d}",
            platform_adset_id=f"ADGROUP-{i:04d}",
            platform_ad_id=f"AD-G-{i:04d}",
            campaign_name=f"[{funnel}] {campaign_type} - {random.choice(['Search', 'Shopping', 'Display', 'Performance Max'])} {i}",
            adset_name=f"AdGroup {random.choice(['Brand', 'Generic', 'Product', 'DSA'])}",
            ad_name=f"Ad {random.choice(['RSA', 'Shopping', 'Display'])} {i}",
            campaign_objective=random.choice(CAMPAIGN_OBJECTIVES),
            campaign_type=campaign_type,
            funnel_stage=funnel,
            utm_source="google",
            utm_medium="cpc",
            utm_campaign=f"google_{campaign_type.lower()}_{i}",
            is_active=random.random() > 0.2,
            first_seen_date=date(2023, 1, 1) + timedelta(days=random.randint(0, 300)),
        ))

    db.bulk_save_objects(campaigns)
    db.commit()
    print(f"Created {len(campaigns)} campaigns.")

    return list(db.query(Campaign).all())


def create_orders(db, customers, products, channel_ids):
    """Create 2000+ orders with realistic patterns."""
    print("Creating orders and order items...")

    orders = []
    order_items = []
    order_id = 1

    start_date = date(2023, 1, 1)
    end_date = date(2024, 12, 10)

    # Seasonality multipliers (higher in Nov-Dec)
    seasonality = {
        1: 0.8, 2: 0.75, 3: 0.85, 4: 0.9, 5: 0.95, 6: 0.85,
        7: 0.9, 8: 0.95, 9: 1.0, 10: 1.1, 11: 1.4, 12: 1.5
    }

    # Generate orders per day
    current = start_date
    while current <= end_date:
        # Base orders per day + seasonality
        base_orders = random.randint(5, 15)
        seasonal_multiplier = seasonality.get(current.month, 1.0)

        # Weekend boost
        if current.weekday() >= 5:
            seasonal_multiplier *= 1.2

        daily_orders = int(base_orders * seasonal_multiplier)

        for _ in range(daily_orders):
            # Select customer (weighted towards repeat customers)
            customer = random.choice(customers)

            # Determine if this is a repeat order
            is_first = customer.total_orders == 0

            # Select channel based on customer's acquisition channel or random
            if is_first:
                channel_name = customer.first_order_channel
            else:
                # Repeat orders might come from different channels
                channel_name = random.choices(
                    ["Paid Social", "Paid Search", "Direct", "Email", "Organic Search"],
                    weights=[0.25, 0.2, 0.25, 0.2, 0.1]
                )[0]

            channel_id = channel_ids.get(channel_name)

            # UTM params
            utm_source = None
            utm_medium = None
            utm_campaign = None

            if channel_name == "Paid Social":
                utm_source = random.choice(["facebook", "instagram"])
                utm_medium = "cpc"
                utm_campaign = f"campaign_{random.randint(1, 15)}"
            elif channel_name == "Paid Search":
                utm_source = "google"
                utm_medium = "cpc"
                utm_campaign = f"search_{random.randint(1, 15)}"
            elif channel_name == "Email":
                utm_source = "email"
                utm_medium = "email"
                utm_campaign = f"newsletter_{current.month}"

            # Order time
            hour = random.choices(
                list(range(24)),
                weights=[1,1,1,1,1,2,3,4,5,6,8,9,10,10,9,8,7,6,5,6,7,5,3,2]
            )[0]
            order_datetime = datetime.combine(current, datetime.min.time()) + timedelta(hours=hour, minutes=random.randint(0, 59))

            # Select products (1-5 items)
            num_items = random.choices([1, 2, 3, 4, 5], weights=[0.4, 0.3, 0.15, 0.1, 0.05])[0]
            selected_products = random.sample(products, min(num_items, len(products)))

            subtotal = Decimal("0.00")
            total_items = 0
            total_quantity = 0

            items_data = []
            for product in selected_products:
                qty = random.choices([1, 2, 3], weights=[0.7, 0.2, 0.1])[0]
                item_price = product.current_price * qty

                items_data.append({
                    "product": product,
                    "quantity": qty,
                    "unit_price": product.current_price,
                    "total_price": item_price,
                })

                subtotal += item_price
                total_items += 1
                total_quantity += qty

            # Calculate order totals
            shipping = Decimal(random.choice([0, 9.90, 14.90, 19.90, 24.90])).quantize(Decimal("0.01"))
            discount = Decimal("0.00")

            # Apply discount sometimes
            if random.random() < 0.3:
                discount = (subtotal * Decimal(random.uniform(0.05, 0.2))).quantize(Decimal("0.01"))

            total = subtotal + shipping - discount

            # Order status
            status_weights = [0.02, 0.03, 0.05, 0.85, 0.05]  # cancelled, pending, shipped, delivered, paid
            status = random.choices(
                ["cancelled", "pending", "shipped", "delivered", "paid"],
                weights=status_weights
            )[0]

            # Payment method
            payment_method = random.choices(
                PAYMENT_METHODS,
                weights=[0.5, 0.3, 0.1, 0.1]
            )[0]

            date_key = int(current.strftime("%Y%m%d"))

            order = Order(
                external_order_id=f"ORD-{order_id:06d}",
                customer_id=customer.customer_id,
                date_key=date_key,
                order_created_at=order_datetime,
                order_status=status,
                payment_status="paid" if status not in ["cancelled", "pending"] else "pending",
                payment_method=payment_method,
                subtotal=subtotal,
                shipping_cost=shipping,
                discount_amount=discount,
                total_amount=total,
                total_items=total_items,
                total_quantity=total_quantity,
                utm_source=utm_source,
                utm_medium=utm_medium,
                utm_campaign=utm_campaign,
                channel_id=channel_id,
                is_first_order=is_first,
                is_repeat_order=not is_first,
            )

            # Add click IDs for attribution
            if channel_name == "Paid Social":
                order.fbc = f"fb.1.{int(order_datetime.timestamp())}.{random.randint(100000, 999999)}"
                order.fbp = f"fb.1.{int(order_datetime.timestamp())}.{random.randint(1000000000, 9999999999)}"
            elif channel_name == "Paid Search":
                order.gclid = f"Cj0KCQiA{random.randint(10000, 99999)}BhC{random.randint(10, 99)}ARIsA"

            orders.append(order)

            # Update customer stats
            customer.total_orders += 1
            customer.total_revenue += total if status != "cancelled" else Decimal("0")
            customer.last_order_date = current

            for item_data in items_data:
                order_items.append({
                    "order_id": order_id,
                    "product_id": item_data["product"].product_id,
                    "date_key": date_key,
                    "quantity": item_data["quantity"],
                    "unit_price": item_data["unit_price"],
                    "total_price": item_data["total_price"],
                })

                # Update product stats
                if status != "cancelled":
                    item_data["product"].total_units_sold += item_data["quantity"]
                    item_data["product"].total_revenue += item_data["total_price"]

            order_id += 1

        current += timedelta(days=1)

    # Save orders
    db.bulk_save_objects(orders)
    db.commit()

    # Get order IDs
    saved_orders = {o.external_order_id: o.order_id for o in db.query(Order).all()}

    # Create order items
    for item in order_items:
        db.add(OrderItem(
            order_id=item["order_id"],
            product_id=item["product_id"],
            date_key=item["date_key"],
            quantity=item["quantity"],
            unit_price=item["unit_price"],
            total_price=item["total_price"],
        ))

    db.commit()
    print(f"Created {len(orders)} orders and {len(order_items)} order items.")

    return orders


def create_ad_spend(db, campaigns):
    """Create daily ad spend data for campaigns."""
    print("Creating ad spend data...")

    spend_records = []

    start_date = date(2023, 1, 1)
    end_date = date(2024, 12, 10)

    for campaign in campaigns:
        if not campaign.is_active and random.random() > 0.3:
            continue

        campaign_start = campaign.first_seen_date or start_date
        current = campaign_start

        # Base daily spend for this campaign
        base_spend = Decimal(random.uniform(50, 500)).quantize(Decimal("0.01"))

        while current <= end_date:
            date_key = int(current.strftime("%Y%m%d"))

            # Skip some days randomly
            if random.random() < 0.1:
                current += timedelta(days=1)
                continue

            # Vary spend
            daily_spend = base_spend * Decimal(random.uniform(0.5, 1.5))
            daily_spend = daily_spend.quantize(Decimal("0.01"))

            # Generate metrics based on spend
            cpm = Decimal(random.uniform(5, 25)).quantize(Decimal("0.01"))
            impressions = int(float(daily_spend) / float(cpm) * 1000)

            ctr = Decimal(random.uniform(0.5, 3.0)).quantize(Decimal("0.01"))
            clicks = int(impressions * float(ctr) / 100)

            reach = int(impressions * random.uniform(0.6, 0.9))

            # Conversions (based on funnel stage)
            conversion_rate = {
                "TOFU": 0.005,
                "MOFU": 0.015,
                "BOFU": 0.035,
            }.get(campaign.funnel_stage, 0.01)

            conversions = int(clicks * conversion_rate * random.uniform(0.5, 1.5))
            conv_value = Decimal(conversions * random.uniform(100, 300)).quantize(Decimal("0.01"))

            cpc = (daily_spend / Decimal(max(clicks, 1))).quantize(Decimal("0.0001")) if clicks > 0 else None

            spend_records.append(AdSpend(
                date_key=date_key,
                campaign_id=campaign.campaign_id,
                impressions=impressions,
                reach=reach,
                clicks=clicks,
                link_clicks=int(clicks * 0.8),
                spend=daily_spend,
                conversions_platform=conversions,
                conversions_value_platform=conv_value,
                cpm=cpm,
                cpc=cpc,
                ctr=ctr,
            ))

            current += timedelta(days=1)

    db.bulk_save_objects(spend_records)
    db.commit()
    print(f"Created {len(spend_records)} ad spend records.")


def update_customer_metrics(db):
    """Update customer metrics and RFM scores."""
    print("Updating customer metrics...")

    customers = db.query(Customer).all()

    for customer in customers:
        if customer.total_orders > 0:
            customer.average_order_value = (customer.total_revenue / customer.total_orders).quantize(Decimal("0.01"))
            customer.is_repeat_customer = customer.total_orders > 1

            if customer.last_order_date:
                customer.days_since_last_order = (date.today() - customer.last_order_date).days
                customer.customer_lifetime_days = (date.today() - customer.first_order_date).days if customer.first_order_date else None
                customer.is_churned = customer.days_since_last_order > 90

    db.commit()

    # Calculate RFM scores
    customers_with_orders = [c for c in customers if c.total_orders > 0]

    # Sort by recency
    customers_with_orders.sort(key=lambda x: x.days_since_last_order or 9999)
    for i, c in enumerate(customers_with_orders):
        c.rfm_recency_score = 5 - int(i / len(customers_with_orders) * 5)

    # Sort by frequency
    customers_with_orders.sort(key=lambda x: x.total_orders, reverse=True)
    for i, c in enumerate(customers_with_orders):
        c.rfm_frequency_score = 5 - int(i / len(customers_with_orders) * 5)

    # Sort by monetary
    customers_with_orders.sort(key=lambda x: x.total_revenue, reverse=True)
    for i, c in enumerate(customers_with_orders):
        c.rfm_monetary_score = 5 - int(i / len(customers_with_orders) * 5)

    # Assign segments
    for c in customers_with_orders:
        r, f, m = c.rfm_recency_score, c.rfm_frequency_score, c.rfm_monetary_score

        if r >= 4 and f >= 4 and m >= 4:
            c.rfm_segment = "Champions"
        elif r >= 4 and f >= 3:
            c.rfm_segment = "Loyal Customers"
        elif r >= 4 and f <= 2:
            c.rfm_segment = "Recent Customers"
        elif r >= 3 and f >= 3:
            c.rfm_segment = "Potential Loyalists"
        elif r <= 2 and f >= 4:
            c.rfm_segment = "At Risk"
        elif r <= 2 and f >= 2:
            c.rfm_segment = "Hibernating"
        elif r <= 1:
            c.rfm_segment = "Lost"
        else:
            c.rfm_segment = "Other"

        # Mark VIPs (top 10%)
        c.is_vip = i < len(customers_with_orders) * 0.1

    db.commit()
    print("Customer metrics updated.")


def update_product_abc(db):
    """Update product ABC classification."""
    print("Updating product ABC classification...")

    products = db.query(Product).filter(Product.total_revenue > 0).order_by(Product.total_revenue.desc()).all()

    total_revenue = sum(float(p.total_revenue) for p in products)
    cumulative = 0

    for p in products:
        cumulative += float(p.total_revenue)
        percentage = cumulative / total_revenue if total_revenue > 0 else 0

        if percentage <= 0.8:
            p.abc_classification = "A"
        elif percentage <= 0.95:
            p.abc_classification = "B"
        else:
            p.abc_classification = "C"

    db.commit()
    print("Product ABC classification updated.")


def create_attributions(db, channel_ids):
    """Create attribution records for orders."""
    print("Creating attribution records...")

    orders = db.query(Order).filter(Order.order_status != "cancelled").all()
    campaigns = {c.campaign_id: c for c in db.query(Campaign).all()}

    attributions = []

    for order in orders:
        # Last click attribution
        campaign_id = None

        # Try to find matching campaign
        if order.utm_source and order.utm_campaign:
            for cid, campaign in campaigns.items():
                if (campaign.utm_source == order.utm_source and
                    order.utm_campaign and campaign.utm_campaign and
                    order.utm_campaign in campaign.utm_campaign):
                    campaign_id = cid
                    break

        attributions.append(Attribution(
            order_id=order.order_id,
            campaign_id=campaign_id,
            channel_id=order.channel_id,
            attribution_model="last_click",
            attributed_revenue=order.total_amount,
            attributed_orders=Decimal("1.0000"),
            days_to_conversion=random.randint(0, 7),
            touchpoint_position="last",
        ))

    db.bulk_save_objects(attributions)
    db.commit()
    print(f"Created {len(attributions)} attribution records.")


def main():
    """Main seed function."""
    print("=" * 60)
    print("CORTEX ANALYTICS - SEEDING DATABASE")
    print("=" * 60)

    db = SessionLocal()

    try:
        # Check if data already exists
        existing_customers = db.query(Customer).count()
        if existing_customers > 0:
            print(f"Database already has {existing_customers} customers.")
            response = input("Do you want to clear and reseed? (yes/no): ")
            if response.lower() != "yes":
                print("Aborting seed.")
                return

            # Clear existing data
            print("Clearing existing data...")
            db.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
            for table in ["fct_attribution", "fct_cohort_metrics", "fct_sessions",
                         "fct_ad_spend", "fct_order_items", "fct_orders",
                         "dim_campaigns", "dim_products", "dim_customers",
                         "dim_channels", "dim_dates"]:
                db.execute(text(f"TRUNCATE TABLE {table}"))
            db.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
            db.commit()

        # Create dimensions
        create_date_dimensions(db)
        channel_ids = create_channels(db)
        products = create_products(db)
        customers = create_customers(db, channel_ids)
        campaigns = create_campaigns(db)

        # Create facts
        orders = create_orders(db, customers, products, channel_ids)
        create_ad_spend(db, campaigns)

        # Update metrics
        update_customer_metrics(db)
        update_product_abc(db)
        create_attributions(db, channel_ids)

        print("=" * 60)
        print("SEED COMPLETED SUCCESSFULLY!")
        print("=" * 60)

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
