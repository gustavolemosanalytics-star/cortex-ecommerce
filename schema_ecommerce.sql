-- ============================================================
-- CORTEX ANALYTICS - SCHEMA E-COMMERCE
-- Versão: 1.0
-- Banco: MySQL 8.0+
-- ============================================================

-- ============================================================
-- CONFIGURAÇÃO INICIAL
-- ============================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Criar database para o cliente (ajustar nome)
-- CREATE DATABASE cortex_cliente_xxx CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE cortex_cliente_xxx;

-- ============================================================
-- TABELAS DE DIMENSÃO
-- ============================================================

-- -----------------------------------------------------
-- dim_dates - Calendário
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_dates (
    date_key INT PRIMARY KEY,                    -- Formato YYYYMMDD
    full_date DATE NOT NULL UNIQUE,
    day_of_week TINYINT NOT NULL,                -- 1=Domingo, 7=Sábado
    day_of_week_name VARCHAR(20) NOT NULL,
    day_of_month TINYINT NOT NULL,
    day_of_year SMALLINT NOT NULL,
    week_of_year TINYINT NOT NULL,
    month_number TINYINT NOT NULL,
    month_name VARCHAR(20) NOT NULL,
    quarter TINYINT NOT NULL,
    year SMALLINT NOT NULL,
    is_weekend BOOLEAN NOT NULL DEFAULT FALSE,
    is_holiday BOOLEAN NOT NULL DEFAULT FALSE,
    holiday_name VARCHAR(100) NULL,
    fiscal_year SMALLINT NULL,
    fiscal_quarter TINYINT NULL,
    
    INDEX idx_full_date (full_date),
    INDEX idx_year_month (year, month_number)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- dim_customers - Clientes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_customers (
    customer_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    external_customer_id VARCHAR(100) NOT NULL,  -- ID do e-commerce
    email_hash VARCHAR(64) NULL,                 -- SHA256 do email (LGPD)
    phone_hash VARCHAR(64) NULL,                 -- SHA256 do telefone
    
    -- Dados demográficos
    city VARCHAR(100) NULL,
    state VARCHAR(50) NULL,
    country VARCHAR(50) DEFAULT 'Brasil',
    postal_code VARCHAR(20) NULL,
    
    -- Dados de aquisição
    first_order_date DATE NULL,
    first_order_source VARCHAR(100) NULL,        -- utm_source
    first_order_medium VARCHAR(100) NULL,        -- utm_medium
    first_order_campaign VARCHAR(255) NULL,      -- utm_campaign
    first_order_channel VARCHAR(50) NULL,        -- Paid Social, Paid Search, Organic, etc
    acquisition_cost DECIMAL(12,2) NULL,         -- CAC individual se rastreável
    
    -- Métricas calculadas (atualizadas por job)
    total_orders INT DEFAULT 0,
    total_revenue DECIMAL(14,2) DEFAULT 0,
    total_items_purchased INT DEFAULT 0,
    average_order_value DECIMAL(12,2) DEFAULT 0,
    last_order_date DATE NULL,
    days_since_last_order INT NULL,
    customer_lifetime_days INT NULL,
    
    -- Segmentação RFM
    rfm_recency_score TINYINT NULL,              -- 1-5
    rfm_frequency_score TINYINT NULL,            -- 1-5
    rfm_monetary_score TINYINT NULL,             -- 1-5
    rfm_segment VARCHAR(50) NULL,                -- Champions, Loyal, At Risk, etc
    
    -- Flags
    is_repeat_customer BOOLEAN DEFAULT FALSE,
    is_vip BOOLEAN DEFAULT FALSE,
    is_churned BOOLEAN DEFAULT FALSE,
    
    -- Controle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE INDEX idx_external_id (external_customer_id),
    INDEX idx_email_hash (email_hash),
    INDEX idx_first_order_date (first_order_date),
    INDEX idx_rfm_segment (rfm_segment),
    INDEX idx_acquisition_channel (first_order_channel)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- dim_products - Produtos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_products (
    product_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    external_product_id VARCHAR(100) NOT NULL,   -- ID do e-commerce
    sku VARCHAR(100) NULL,
    product_name VARCHAR(500) NOT NULL,
    
    -- Categorização
    category_level_1 VARCHAR(200) NULL,          -- Categoria principal
    category_level_2 VARCHAR(200) NULL,          -- Subcategoria
    category_level_3 VARCHAR(200) NULL,          -- Sub-subcategoria
    brand VARCHAR(200) NULL,
    
    -- Preços
    current_price DECIMAL(12,2) NULL,
    cost_price DECIMAL(12,2) NULL,               -- Custo (se disponível)
    margin_percent DECIMAL(5,2) NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    stock_quantity INT NULL,
    
    -- Métricas calculadas
    total_units_sold INT DEFAULT 0,
    total_revenue DECIMAL(14,2) DEFAULT 0,
    abc_classification CHAR(1) NULL,             -- A, B ou C
    
    -- Controle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE INDEX idx_external_id (external_product_id),
    INDEX idx_sku (sku),
    INDEX idx_category (category_level_1, category_level_2),
    INDEX idx_abc (abc_classification)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- dim_campaigns - Campanhas de Ads
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_campaigns (
    campaign_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Identificadores da plataforma
    platform VARCHAR(50) NOT NULL,               -- meta, google, tiktok
    platform_account_id VARCHAR(100) NULL,
    platform_campaign_id VARCHAR(100) NOT NULL,
    platform_adset_id VARCHAR(100) NULL,
    platform_ad_id VARCHAR(100) NULL,
    
    -- Nomes
    campaign_name VARCHAR(500) NULL,
    adset_name VARCHAR(500) NULL,
    ad_name VARCHAR(500) NULL,
    
    -- Classificação manual/parseada
    campaign_objective VARCHAR(100) NULL,        -- Conversions, Traffic, etc
    campaign_type VARCHAR(100) NULL,             -- Prospecting, Retargeting, etc
    funnel_stage VARCHAR(50) NULL,               -- TOFU, MOFU, BOFU
    
    -- UTMs padrão
    utm_source VARCHAR(100) NULL,
    utm_medium VARCHAR(100) NULL,
    utm_campaign VARCHAR(255) NULL,
    utm_content VARCHAR(255) NULL,
    utm_term VARCHAR(255) NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Controle
    first_seen_date DATE NULL,
    last_seen_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE INDEX idx_platform_ids (platform, platform_campaign_id, platform_adset_id, platform_ad_id),
    INDEX idx_platform_campaign (platform, platform_campaign_id),
    INDEX idx_campaign_name (campaign_name(100)),
    INDEX idx_funnel_stage (funnel_stage)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- dim_channels - Canais de Marketing
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_channels (
    channel_id INT PRIMARY KEY AUTO_INCREMENT,
    channel_name VARCHAR(100) NOT NULL UNIQUE,   -- Paid Social, Paid Search, Organic, Direct, Email, etc
    channel_group VARCHAR(50) NULL,              -- Paid, Organic, Direct
    is_paid BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Dados iniciais de canais
INSERT INTO dim_channels (channel_name, channel_group, is_paid) VALUES
('Paid Social', 'Paid', TRUE),
('Paid Search', 'Paid', TRUE),
('Organic Search', 'Organic', FALSE),
('Organic Social', 'Organic', FALSE),
('Direct', 'Direct', FALSE),
('Email', 'Owned', FALSE),
('Referral', 'Earned', FALSE),
('Affiliates', 'Paid', TRUE),
('Display', 'Paid', TRUE),
('Other', 'Other', FALSE);

-- ============================================================
-- TABELAS DE FATO
-- ============================================================

-- -----------------------------------------------------
-- fct_orders - Pedidos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS fct_orders (
    order_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    external_order_id VARCHAR(100) NOT NULL,     -- ID do e-commerce
    customer_id BIGINT NOT NULL,
    date_key INT NOT NULL,
    
    -- Timestamps
    order_created_at DATETIME NOT NULL,
    order_paid_at DATETIME NULL,
    order_shipped_at DATETIME NULL,
    order_delivered_at DATETIME NULL,
    order_cancelled_at DATETIME NULL,
    
    -- Status
    order_status VARCHAR(50) NOT NULL,           -- pending, paid, shipped, delivered, cancelled
    payment_status VARCHAR(50) NULL,
    payment_method VARCHAR(50) NULL,             -- credit_card, boleto, pix
    
    -- Valores
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Quantidades
    total_items INT DEFAULT 0,
    total_quantity INT DEFAULT 0,
    
    -- Atribuição
    utm_source VARCHAR(100) NULL,
    utm_medium VARCHAR(100) NULL,
    utm_campaign VARCHAR(255) NULL,
    utm_content VARCHAR(255) NULL,
    utm_term VARCHAR(255) NULL,
    channel_id INT NULL,
    
    -- Cookies de tracking
    fbc VARCHAR(255) NULL,                       -- Meta click ID
    fbp VARCHAR(255) NULL,                       -- Meta browser ID
    gclid VARCHAR(255) NULL,                     -- Google click ID
    ttclid VARCHAR(255) NULL,                    -- TikTok click ID
    
    -- Flags
    is_first_order BOOLEAN DEFAULT FALSE,
    is_repeat_order BOOLEAN DEFAULT FALSE,
    
    -- Controle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE INDEX idx_external_order (external_order_id),
    INDEX idx_customer (customer_id),
    INDEX idx_date (date_key),
    INDEX idx_order_created (order_created_at),
    INDEX idx_status (order_status),
    INDEX idx_channel (channel_id),
    INDEX idx_attribution (utm_source, utm_medium, utm_campaign),
    
    FOREIGN KEY (customer_id) REFERENCES dim_customers(customer_id),
    FOREIGN KEY (date_key) REFERENCES dim_dates(date_key),
    FOREIGN KEY (channel_id) REFERENCES dim_channels(channel_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- fct_order_items - Itens dos Pedidos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS fct_order_items (
    order_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    date_key INT NOT NULL,
    
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    unit_cost DECIMAL(12,2) NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_price DECIMAL(12,2) NOT NULL,
    
    -- Margem
    gross_margin DECIMAL(12,2) NULL,
    margin_percent DECIMAL(5,2) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_order (order_id),
    INDEX idx_product (product_id),
    INDEX idx_date (date_key),
    
    FOREIGN KEY (order_id) REFERENCES fct_orders(order_id),
    FOREIGN KEY (product_id) REFERENCES dim_products(product_id),
    FOREIGN KEY (date_key) REFERENCES dim_dates(date_key)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- fct_ad_spend - Gastos com Ads (diário por campanha)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS fct_ad_spend (
    spend_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    date_key INT NOT NULL,
    campaign_id BIGINT NOT NULL,
    
    -- Métricas de entrega
    impressions BIGINT DEFAULT 0,
    reach BIGINT DEFAULT 0,
    frequency DECIMAL(10,4) DEFAULT 0,
    
    -- Métricas de engajamento
    clicks BIGINT DEFAULT 0,
    link_clicks BIGINT DEFAULT 0,
    
    -- Custos
    spend DECIMAL(12,2) NOT NULL DEFAULT 0,
    spend_brl DECIMAL(12,2) NULL,                -- Se plataforma reporta em USD
    
    -- Conversões reportadas pela plataforma
    conversions_platform INT DEFAULT 0,
    conversions_value_platform DECIMAL(12,2) DEFAULT 0,
    
    -- Métricas calculadas
    cpm DECIMAL(12,4) NULL,
    cpc DECIMAL(12,4) NULL,
    ctr DECIMAL(8,4) NULL,
    
    -- Controle
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE INDEX idx_date_campaign (date_key, campaign_id),
    INDEX idx_date (date_key),
    INDEX idx_campaign (campaign_id),
    
    FOREIGN KEY (date_key) REFERENCES dim_dates(date_key),
    FOREIGN KEY (campaign_id) REFERENCES dim_campaigns(campaign_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- fct_sessions - Sessões do GA4
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS fct_sessions (
    session_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    date_key INT NOT NULL,
    
    -- Identificadores
    ga_session_id VARCHAR(100) NULL,
    ga_client_id VARCHAR(100) NULL,
    customer_id BIGINT NULL,                     -- Se logado ou identificado
    
    -- Fonte de tráfego
    source VARCHAR(100) NULL,
    medium VARCHAR(100) NULL,
    campaign VARCHAR(255) NULL,
    channel_id INT NULL,
    
    -- Página de entrada
    landing_page VARCHAR(500) NULL,
    
    -- Métricas de engajamento
    session_duration_seconds INT DEFAULT 0,
    pageviews INT DEFAULT 0,
    events INT DEFAULT 0,
    is_engaged BOOLEAN DEFAULT FALSE,
    
    -- Conversões
    did_add_to_cart BOOLEAN DEFAULT FALSE,
    did_begin_checkout BOOLEAN DEFAULT FALSE,
    did_purchase BOOLEAN DEFAULT FALSE,
    
    -- Device
    device_category VARCHAR(50) NULL,            -- desktop, mobile, tablet
    browser VARCHAR(100) NULL,
    operating_system VARCHAR(100) NULL,
    
    -- Geo
    country VARCHAR(50) NULL,
    region VARCHAR(100) NULL,
    city VARCHAR(100) NULL,
    
    -- Timestamp
    session_start_at DATETIME NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_date (date_key),
    INDEX idx_customer (customer_id),
    INDEX idx_source_medium (source, medium),
    INDEX idx_channel (channel_id),
    
    FOREIGN KEY (date_key) REFERENCES dim_dates(date_key),
    FOREIGN KEY (customer_id) REFERENCES dim_customers(customer_id),
    FOREIGN KEY (channel_id) REFERENCES dim_channels(channel_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- fct_attribution - Atribuição de pedidos a campanhas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS fct_attribution (
    attribution_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    campaign_id BIGINT NULL,
    channel_id INT NULL,
    
    -- Modelo de atribuição
    attribution_model VARCHAR(50) NOT NULL,      -- last_click, first_click, linear, data_driven
    
    -- Valores atribuídos
    attributed_revenue DECIMAL(12,2) NOT NULL,
    attributed_orders DECIMAL(10,4) NOT NULL,    -- Pode ser fracionário em modelos lineares
    
    -- Janela de atribuição
    days_to_conversion INT NULL,
    touchpoint_position VARCHAR(20) NULL,        -- first, middle, last
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE INDEX idx_order_campaign_model (order_id, campaign_id, attribution_model),
    INDEX idx_order (order_id),
    INDEX idx_campaign (campaign_id),
    INDEX idx_model (attribution_model),
    
    FOREIGN KEY (order_id) REFERENCES fct_orders(order_id),
    FOREIGN KEY (campaign_id) REFERENCES dim_campaigns(campaign_id),
    FOREIGN KEY (channel_id) REFERENCES dim_channels(channel_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- fct_cohort_metrics - Métricas de Cohort (agregado mensal)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS fct_cohort_metrics (
    cohort_metric_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Identificação do cohort
    cohort_month DATE NOT NULL,                  -- Primeiro dia do mês de aquisição
    months_since_acquisition INT NOT NULL,       -- 0 = mês de aquisição
    
    -- Segmentação opcional
    acquisition_channel VARCHAR(100) NULL,
    
    -- Métricas
    cohort_size INT NOT NULL,                    -- Clientes no cohort
    active_customers INT DEFAULT 0,              -- Clientes que compraram no período
    orders INT DEFAULT 0,
    revenue DECIMAL(14,2) DEFAULT 0,
    
    -- Taxas calculadas
    retention_rate DECIMAL(5,4) NULL,
    cumulative_revenue_per_customer DECIMAL(12,2) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE INDEX idx_cohort_month_period (cohort_month, months_since_acquisition, acquisition_channel),
    INDEX idx_cohort_month (cohort_month)
) ENGINE=InnoDB;

-- ============================================================
-- TABELAS RAW (dados brutos das APIs)
-- ============================================================

-- -----------------------------------------------------
-- raw_meta_ads - Dados brutos do Meta Ads
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS raw_meta_ads (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    date_start DATE NOT NULL,
    date_stop DATE NOT NULL,
    account_id VARCHAR(50) NOT NULL,
    campaign_id VARCHAR(50) NOT NULL,
    campaign_name VARCHAR(500) NULL,
    adset_id VARCHAR(50) NULL,
    adset_name VARCHAR(500) NULL,
    ad_id VARCHAR(50) NULL,
    ad_name VARCHAR(500) NULL,
    impressions BIGINT DEFAULT 0,
    reach BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    spend DECIMAL(12,4) DEFAULT 0,
    actions JSON NULL,                           -- Array de ações/conversões
    action_values JSON NULL,
    
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_date (date_start),
    INDEX idx_campaign (campaign_id),
    INDEX idx_extracted (extracted_at)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- raw_google_ads - Dados brutos do Google Ads
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS raw_google_ads (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    campaign_id VARCHAR(50) NOT NULL,
    campaign_name VARCHAR(500) NULL,
    ad_group_id VARCHAR(50) NULL,
    ad_group_name VARCHAR(500) NULL,
    ad_id VARCHAR(50) NULL,
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    cost_micros BIGINT DEFAULT 0,
    conversions DECIMAL(12,4) DEFAULT 0,
    conversions_value DECIMAL(14,4) DEFAULT 0,
    
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_date (date),
    INDEX idx_campaign (campaign_id),
    INDEX idx_extracted (extracted_at)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- raw_ecommerce_orders - Dados brutos do e-commerce
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS raw_ecommerce_orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    external_order_id VARCHAR(100) NOT NULL,
    raw_data JSON NOT NULL,                      -- JSON completo do pedido
    
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    
    UNIQUE INDEX idx_external_order (external_order_id),
    INDEX idx_extracted (extracted_at),
    INDEX idx_processed (processed_at)
) ENGINE=InnoDB;

-- ============================================================
-- VIEWS PARA REPORTS
-- ============================================================

-- -----------------------------------------------------
-- rpt_daily_performance - Performance diária consolidada
-- -----------------------------------------------------
CREATE OR REPLACE VIEW rpt_daily_performance AS
SELECT 
    d.full_date,
    d.day_of_week_name,
    d.month_name,
    d.year,
    
    -- Métricas de vendas
    COUNT(DISTINCT o.order_id) as orders,
    COUNT(DISTINCT o.customer_id) as customers,
    SUM(o.total_amount) as revenue,
    AVG(o.total_amount) as avg_order_value,
    
    -- Novos vs recorrentes
    SUM(CASE WHEN o.is_first_order THEN 1 ELSE 0 END) as new_customer_orders,
    SUM(CASE WHEN o.is_repeat_order THEN 1 ELSE 0 END) as repeat_orders,
    
    -- Métricas de ads (agregado)
    COALESCE(SUM(s.spend), 0) as ad_spend,
    COALESCE(SUM(s.impressions), 0) as impressions,
    COALESCE(SUM(s.clicks), 0) as clicks,
    
    -- Métricas calculadas
    CASE WHEN SUM(s.spend) > 0 
        THEN SUM(o.total_amount) / SUM(s.spend) 
        ELSE NULL 
    END as roas,
    CASE WHEN COUNT(DISTINCT o.order_id) > 0 
        THEN SUM(s.spend) / COUNT(DISTINCT o.order_id) 
        ELSE NULL 
    END as cpa

FROM dim_dates d
LEFT JOIN fct_orders o ON d.date_key = o.date_key AND o.order_status != 'cancelled'
LEFT JOIN fct_ad_spend s ON d.date_key = s.date_key
WHERE d.full_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
GROUP BY d.date_key, d.full_date, d.day_of_week_name, d.month_name, d.year
ORDER BY d.full_date DESC;

-- -----------------------------------------------------
-- rpt_channel_performance - Performance por canal
-- -----------------------------------------------------
CREATE OR REPLACE VIEW rpt_channel_performance AS
SELECT 
    ch.channel_name,
    ch.is_paid,
    
    -- Últimos 30 dias
    COUNT(DISTINCT o.order_id) as orders_30d,
    SUM(o.total_amount) as revenue_30d,
    COUNT(DISTINCT o.customer_id) as customers_30d,
    
    -- Ads spend (se canal pago)
    COALESCE(ads.spend_30d, 0) as spend_30d,
    
    -- ROAS
    CASE WHEN COALESCE(ads.spend_30d, 0) > 0 
        THEN SUM(o.total_amount) / ads.spend_30d 
        ELSE NULL 
    END as roas_30d,
    
    -- CPA
    CASE WHEN COUNT(DISTINCT o.order_id) > 0 
        THEN COALESCE(ads.spend_30d, 0) / COUNT(DISTINCT o.order_id) 
        ELSE NULL 
    END as cpa_30d

FROM dim_channels ch
LEFT JOIN fct_orders o ON ch.channel_id = o.channel_id 
    AND o.order_created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
    AND o.order_status != 'cancelled'
LEFT JOIN (
    SELECT 
        c.utm_source,
        SUM(s.spend) as spend_30d
    FROM fct_ad_spend s
    JOIN dim_campaigns c ON s.campaign_id = c.campaign_id
    JOIN dim_dates d ON s.date_key = d.date_key
    WHERE d.full_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
    GROUP BY c.utm_source
) ads ON LOWER(ch.channel_name) LIKE CONCAT('%', LOWER(ads.utm_source), '%')
GROUP BY ch.channel_id, ch.channel_name, ch.is_paid, ads.spend_30d;

-- -----------------------------------------------------
-- rpt_ltv_by_cohort - LTV por cohort de aquisição
-- -----------------------------------------------------
CREATE OR REPLACE VIEW rpt_ltv_by_cohort AS
SELECT 
    DATE_FORMAT(c.first_order_date, '%Y-%m') as cohort_month,
    c.first_order_channel as acquisition_channel,
    
    COUNT(DISTINCT c.customer_id) as cohort_size,
    SUM(c.total_revenue) as total_ltv,
    AVG(c.total_revenue) as avg_ltv,
    AVG(c.total_orders) as avg_orders,
    
    -- LTV por período
    SUM(CASE WHEN c.customer_lifetime_days <= 30 THEN c.total_revenue ELSE 0 END) / 
        NULLIF(COUNT(DISTINCT c.customer_id), 0) as ltv_30d,
    SUM(CASE WHEN c.customer_lifetime_days <= 90 THEN c.total_revenue ELSE 0 END) / 
        NULLIF(COUNT(DISTINCT c.customer_id), 0) as ltv_90d,
    SUM(CASE WHEN c.customer_lifetime_days <= 180 THEN c.total_revenue ELSE 0 END) / 
        NULLIF(COUNT(DISTINCT c.customer_id), 0) as ltv_180d,
    SUM(CASE WHEN c.customer_lifetime_days <= 365 THEN c.total_revenue ELSE 0 END) / 
        NULLIF(COUNT(DISTINCT c.customer_id), 0) as ltv_365d

FROM dim_customers c
WHERE c.first_order_date IS NOT NULL
GROUP BY DATE_FORMAT(c.first_order_date, '%Y-%m'), c.first_order_channel
ORDER BY cohort_month DESC, acquisition_channel;

-- -----------------------------------------------------
-- rpt_product_performance - Performance de produtos
-- -----------------------------------------------------
CREATE OR REPLACE VIEW rpt_product_performance AS
SELECT 
    p.product_id,
    p.product_name,
    p.category_level_1,
    p.category_level_2,
    p.brand,
    p.current_price,
    p.cost_price,
    p.abc_classification,
    
    -- Últimos 30 dias
    COALESCE(SUM(oi.quantity), 0) as units_sold_30d,
    COALESCE(SUM(oi.total_price), 0) as revenue_30d,
    COALESCE(SUM(oi.gross_margin), 0) as margin_30d,
    COUNT(DISTINCT oi.order_id) as orders_30d,
    
    -- Métricas de contribuição
    COALESCE(SUM(oi.total_price), 0) / 
        NULLIF((SELECT SUM(total_price) FROM fct_order_items WHERE date_key >= (SELECT date_key FROM dim_dates WHERE full_date = DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY))), 0) * 100 
        as revenue_contribution_pct

FROM dim_products p
LEFT JOIN fct_order_items oi ON p.product_id = oi.product_id
LEFT JOIN dim_dates d ON oi.date_key = d.date_key AND d.full_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY p.product_id, p.product_name, p.category_level_1, p.category_level_2, 
         p.brand, p.current_price, p.cost_price, p.abc_classification
ORDER BY revenue_30d DESC;

-- -----------------------------------------------------
-- rpt_campaign_roas - ROAS por campanha
-- -----------------------------------------------------
CREATE OR REPLACE VIEW rpt_campaign_roas AS
SELECT 
    c.platform,
    c.campaign_name,
    c.campaign_type,
    c.funnel_stage,
    
    -- Métricas de entrega (30 dias)
    SUM(s.impressions) as impressions,
    SUM(s.clicks) as clicks,
    SUM(s.spend) as spend,
    
    -- Conversões atribuídas (last click)
    attr.attributed_orders,
    attr.attributed_revenue,
    
    -- ROAS e CPA
    CASE WHEN SUM(s.spend) > 0 
        THEN attr.attributed_revenue / SUM(s.spend) 
        ELSE NULL 
    END as roas,
    CASE WHEN attr.attributed_orders > 0 
        THEN SUM(s.spend) / attr.attributed_orders 
        ELSE NULL 
    END as cpa,
    
    -- Eficiência
    CASE WHEN SUM(s.impressions) > 0 
        THEN SUM(s.clicks) / SUM(s.impressions) * 100 
        ELSE NULL 
    END as ctr,
    CASE WHEN SUM(s.clicks) > 0 
        THEN SUM(s.spend) / SUM(s.clicks) 
        ELSE NULL 
    END as cpc

FROM dim_campaigns c
JOIN fct_ad_spend s ON c.campaign_id = s.campaign_id
JOIN dim_dates d ON s.date_key = d.date_key
LEFT JOIN (
    SELECT 
        campaign_id,
        SUM(attributed_orders) as attributed_orders,
        SUM(attributed_revenue) as attributed_revenue
    FROM fct_attribution
    WHERE attribution_model = 'last_click'
    GROUP BY campaign_id
) attr ON c.campaign_id = attr.campaign_id
WHERE d.full_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY c.campaign_id, c.platform, c.campaign_name, c.campaign_type, c.funnel_stage,
         attr.attributed_orders, attr.attributed_revenue
ORDER BY spend DESC;

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

-- -----------------------------------------------------
-- sp_update_customer_metrics - Atualiza métricas de clientes
-- -----------------------------------------------------
DELIMITER //
CREATE PROCEDURE sp_update_customer_metrics()
BEGIN
    UPDATE dim_customers c
    SET 
        total_orders = (
            SELECT COUNT(*) FROM fct_orders o 
            WHERE o.customer_id = c.customer_id AND o.order_status != 'cancelled'
        ),
        total_revenue = (
            SELECT COALESCE(SUM(total_amount), 0) FROM fct_orders o 
            WHERE o.customer_id = c.customer_id AND o.order_status != 'cancelled'
        ),
        last_order_date = (
            SELECT MAX(DATE(order_created_at)) FROM fct_orders o 
            WHERE o.customer_id = c.customer_id AND o.order_status != 'cancelled'
        ),
        days_since_last_order = DATEDIFF(CURRENT_DATE, (
            SELECT MAX(DATE(order_created_at)) FROM fct_orders o 
            WHERE o.customer_id = c.customer_id AND o.order_status != 'cancelled'
        )),
        customer_lifetime_days = DATEDIFF(CURRENT_DATE, c.first_order_date),
        is_repeat_customer = (
            SELECT COUNT(*) > 1 FROM fct_orders o 
            WHERE o.customer_id = c.customer_id AND o.order_status != 'cancelled'
        ),
        updated_at = CURRENT_TIMESTAMP;
    
    -- Atualizar average_order_value
    UPDATE dim_customers 
    SET average_order_value = CASE WHEN total_orders > 0 THEN total_revenue / total_orders ELSE 0 END;
END //
DELIMITER ;

-- -----------------------------------------------------
-- sp_calculate_rfm - Calcula scores RFM
-- -----------------------------------------------------
DELIMITER //
CREATE PROCEDURE sp_calculate_rfm()
BEGIN
    -- Calcular quintis de Recência
    UPDATE dim_customers c
    JOIN (
        SELECT customer_id,
               NTILE(5) OVER (ORDER BY days_since_last_order DESC) as r_score
        FROM dim_customers
        WHERE total_orders > 0
    ) r ON c.customer_id = r.customer_id
    SET c.rfm_recency_score = r.r_score;
    
    -- Calcular quintis de Frequência
    UPDATE dim_customers c
    JOIN (
        SELECT customer_id,
               NTILE(5) OVER (ORDER BY total_orders) as f_score
        FROM dim_customers
        WHERE total_orders > 0
    ) f ON c.customer_id = f.customer_id
    SET c.rfm_frequency_score = f.f_score;
    
    -- Calcular quintis de Valor Monetário
    UPDATE dim_customers c
    JOIN (
        SELECT customer_id,
               NTILE(5) OVER (ORDER BY total_revenue) as m_score
        FROM dim_customers
        WHERE total_orders > 0
    ) m ON c.customer_id = m.customer_id
    SET c.rfm_monetary_score = m.m_score;
    
    -- Definir segmentos RFM
    UPDATE dim_customers
    SET rfm_segment = CASE
        WHEN rfm_recency_score >= 4 AND rfm_frequency_score >= 4 AND rfm_monetary_score >= 4 THEN 'Champions'
        WHEN rfm_recency_score >= 4 AND rfm_frequency_score >= 3 THEN 'Loyal Customers'
        WHEN rfm_recency_score >= 4 AND rfm_frequency_score <= 2 THEN 'Recent Customers'
        WHEN rfm_recency_score >= 3 AND rfm_frequency_score >= 3 THEN 'Potential Loyalists'
        WHEN rfm_recency_score <= 2 AND rfm_frequency_score >= 4 THEN 'At Risk'
        WHEN rfm_recency_score <= 2 AND rfm_frequency_score >= 2 THEN 'Hibernating'
        WHEN rfm_recency_score <= 1 THEN 'Lost'
        ELSE 'Other'
    END
    WHERE total_orders > 0;
    
    -- Marcar churned (sem compra há mais de 90 dias)
    UPDATE dim_customers
    SET is_churned = (days_since_last_order > 90)
    WHERE total_orders > 0;
    
    -- Marcar VIPs (top 10% em revenue)
    UPDATE dim_customers c
    JOIN (
        SELECT customer_id,
               PERCENT_RANK() OVER (ORDER BY total_revenue) as pct_rank
        FROM dim_customers
        WHERE total_orders > 0
    ) v ON c.customer_id = v.customer_id
    SET c.is_vip = (v.pct_rank >= 0.9);
END //
DELIMITER ;

-- -----------------------------------------------------
-- sp_populate_dim_dates - Popular calendário
-- -----------------------------------------------------
DELIMITER //
CREATE PROCEDURE sp_populate_dim_dates(IN start_date DATE, IN end_date DATE)
BEGIN
    DECLARE current_date_val DATE;
    SET current_date_val = start_date;
    
    WHILE current_date_val <= end_date DO
        INSERT IGNORE INTO dim_dates (
            date_key,
            full_date,
            day_of_week,
            day_of_week_name,
            day_of_month,
            day_of_year,
            week_of_year,
            month_number,
            month_name,
            quarter,
            year,
            is_weekend
        ) VALUES (
            DATE_FORMAT(current_date_val, '%Y%m%d'),
            current_date_val,
            DAYOFWEEK(current_date_val),
            DAYNAME(current_date_val),
            DAY(current_date_val),
            DAYOFYEAR(current_date_val),
            WEEK(current_date_val),
            MONTH(current_date_val),
            MONTHNAME(current_date_val),
            QUARTER(current_date_val),
            YEAR(current_date_val),
            DAYOFWEEK(current_date_val) IN (1, 7)
        );
        
        SET current_date_val = DATE_ADD(current_date_val, INTERVAL 1 DAY);
    END WHILE;
END //
DELIMITER ;

-- Popular calendário de 2020 a 2030
CALL sp_populate_dim_dates('2020-01-01', '2030-12-31');
