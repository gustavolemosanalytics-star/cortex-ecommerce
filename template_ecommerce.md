# Cortex Analytics - Template Projeto E-commerce

## Estrutura de Diretórios

```
cortex-ecom-{cliente}/
│
├── README.md                           # Documentação do projeto
├── .env.example                        # Variáveis de ambiente (template)
├── .gitignore
├── requirements.txt                    # Dependências Python
├── pyproject.toml                      # Config do projeto
│
├── config/
│   ├── __init__.py
│   ├── settings.py                     # Configurações gerais
│   ├── client_config.yaml              # Config específica do cliente
│   └── logging_config.py               # Configuração de logs
│
├── src/
│   ├── __init__.py
│   │
│   ├── extractors/                     # Extração de dados
│   │   ├── __init__.py
│   │   ├── base_extractor.py           # Classe base
│   │   ├── meta_ads.py                 # Extrator Meta Ads API
│   │   ├── google_ads.py               # Extrator Google Ads API
│   │   ├── tiktok_ads.py               # Extrator TikTok Ads API
│   │   ├── nuvemshop.py                # Extrator Nuvemshop API
│   │   ├── tray.py                     # Extrator Tray API
│   │   ├── shopify.py                  # Extrator Shopify API
│   │   └── ga4.py                      # Extrator GA4 (BigQuery ou API)
│   │
│   ├── transformers/                   # Transformação de dados
│   │   ├── __init__.py
│   │   ├── base_transformer.py
│   │   ├── orders_transformer.py       # Transforma pedidos
│   │   ├── customers_transformer.py    # Transforma/enriquece clientes
│   │   ├── products_transformer.py     # Transforma produtos
│   │   ├── campaigns_transformer.py    # Unifica campanhas
│   │   └── attribution.py              # Cálculos de atribuição
│   │
│   ├── loaders/                        # Carga no banco
│   │   ├── __init__.py
│   │   ├── base_loader.py
│   │   └── mysql_loader.py             # Loader para MySQL
│   │
│   ├── models/                         # Modelos de dados
│   │   ├── __init__.py
│   │   ├── orders.py                   # Modelo Order
│   │   ├── customers.py                # Modelo Customer
│   │   ├── products.py                 # Modelo Product
│   │   └── campaigns.py                # Modelo Campaign
│   │
│   ├── analytics/                      # Cálculos analíticos
│   │   ├── __init__.py
│   │   ├── ltv_calculator.py           # Cálculo de LTV
│   │   ├── rfm_segmentation.py         # Segmentação RFM
│   │   ├── cohort_analysis.py          # Análise de cohort
│   │   ├── abc_classification.py       # Curva ABC produtos
│   │   └── attribution_models.py       # Modelos de atribuição
│   │
│   ├── converters/                     # Conversões offline
│   │   ├── __init__.py
│   │   ├── meta_capi.py                # Meta Conversions API
│   │   └── google_enhanced.py          # Google Enhanced Conversions
│   │
│   └── utils/                          # Utilitários
│       ├── __init__.py
│       ├── database.py                 # Conexão com banco
│       ├── hashing.py                  # Funções de hash (LGPD)
│       ├── date_utils.py               # Utilitários de data
│       └── notifications.py            # Alertas (Slack, Email)
│
├── pipelines/                          # Orquestração
│   ├── __init__.py
│   ├── daily_etl.py                    # Pipeline diário principal
│   ├── hourly_sync.py                  # Sync mais frequente (se necessário)
│   ├── weekly_analytics.py             # Cálculos semanais (RFM, LTV)
│   └── offline_conversions.py          # Envio de conversões
│
├── sql/
│   ├── schema.sql                      # Schema completo
│   ├── migrations/                     # Migrações de banco
│   │   └── 001_initial.sql
│   ├── views/                          # Views de report
│   │   ├── rpt_daily_performance.sql
│   │   ├── rpt_channel_performance.sql
│   │   └── rpt_ltv_cohort.sql
│   └── seeds/                          # Dados iniciais
│       └── dim_channels.sql
│
├── tracking/                           # Configurações de tracking
│   ├── gtm/
│   │   ├── container_template.json     # Template GTM exportável
│   │   └── setup_guide.md              # Guia de implementação
│   ├── meta_capi/
│   │   └── event_mapping.md            # Mapeamento de eventos
│   └── google_ec/
│       └── setup_guide.md
│
├── dashboard/                          # Frontend (se incluso)
│   ├── README.md
│   └── (estrutura Next.js/React)
│
├── tests/
│   ├── __init__.py
│   ├── test_extractors/
│   ├── test_transformers/
│   └── test_analytics/
│
├── docs/
│   ├── architecture.md                 # Arquitetura do projeto
│   ├── data_dictionary.md              # Dicionário de dados
│   ├── onboarding.md                   # Guia de onboarding
│   ├── api_credentials.md              # Como obter credenciais
│   └── troubleshooting.md              # Resolução de problemas
│
└── scripts/
    ├── setup_database.sh               # Cria banco e schema
    ├── run_backfill.py                 # Backfill de dados históricos
    └── health_check.py                 # Verificação de saúde
```

---

## Arquivos Base

### requirements.txt

```
# Core
python-dotenv==1.0.0
pyyaml==6.0.1
pydantic==2.5.0
pydantic-settings==2.1.0

# Database
mysql-connector-python==8.2.0
sqlalchemy==2.0.23

# APIs
requests==2.31.0
facebook-business==19.0.0
google-ads==23.0.0
google-analytics-data==0.18.0

# Data Processing
pandas==2.1.4
numpy==1.26.2

# Scheduling/Orchestration
schedule==1.2.1
# ou prefect==2.14.0

# Utilities
python-dateutil==2.8.2
pytz==2023.3
hashlib

# Notifications
slack-sdk==3.23.0

# Testing
pytest==7.4.3
pytest-cov==4.1.0

# Logging
structlog==23.2.0
```

### config/client_config.yaml

```yaml
# Configuração do Cliente
client:
  name: "Cliente XYZ"
  code: "xyz"
  timezone: "America/Sao_Paulo"

# Plataforma de E-commerce
ecommerce:
  platform: "nuvemshop"  # nuvemshop, tray, shopify
  store_id: "123456"
  api_url: "https://api.nuvemshop.com.br"
  # Credenciais via .env

# Plataformas de Ads
ads:
  meta:
    enabled: true
    account_id: "act_123456789"
    # access_token via .env
  google:
    enabled: true
    customer_id: "123-456-7890"
    # credentials via .env
  tiktok:
    enabled: false

# Google Analytics
analytics:
  ga4:
    enabled: true
    property_id: "123456789"

# Conversões Offline
offline_conversions:
  meta_capi:
    enabled: true
    pixel_id: "123456789"
    # access_token via .env
  google_ec:
    enabled: true
    conversion_action_id: "123456789"

# Configurações de ETL
etl:
  lookback_days: 7  # Dias para reprocessar
  batch_size: 1000
  
# Configurações de Análise
analytics_config:
  ltv_window_days: 365
  churn_threshold_days: 90
  rfm_quantiles: 5

# Alertas
alerts:
  slack_channel: "#cortex-xyz"
  email_recipients:
    - "gestor@cliente.com"
  thresholds:
    cac_increase_pct: 20
    roas_decrease_pct: 15
```

### src/extractors/base_extractor.py

```python
"""Base class for all data extractors."""
from abc import ABC, abstractmethod
from datetime import datetime, date
from typing import Optional, List, Dict, Any
import logging
from config.settings import settings

logger = logging.getLogger(__name__)


class BaseExtractor(ABC):
    """Abstract base class for data extractors."""
    
    def __init__(self, client_code: str):
        self.client_code = client_code
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    @abstractmethod
    def extract(
        self,
        start_date: date,
        end_date: date,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Extract data for the given date range."""
        pass
    
    @abstractmethod
    def validate_credentials(self) -> bool:
        """Validate API credentials."""
        pass
    
    def log_extraction(
        self,
        start_date: date,
        end_date: date,
        records_count: int,
        status: str = "success",
        error: Optional[str] = None
    ):
        """Log extraction metadata."""
        self.logger.info(
            f"Extraction completed",
            extra={
                "client": self.client_code,
                "extractor": self.__class__.__name__,
                "start_date": str(start_date),
                "end_date": str(end_date),
                "records": records_count,
                "status": status,
                "error": error
            }
        )
```

### src/extractors/meta_ads.py

```python
"""Meta Ads API extractor."""
from datetime import date
from typing import List, Dict, Any
from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.adobjects.adsinsights import AdsInsights

from .base_extractor import BaseExtractor
from config.settings import settings


class MetaAdsExtractor(BaseExtractor):
    """Extract data from Meta Ads API."""
    
    FIELDS = [
        AdsInsights.Field.date_start,
        AdsInsights.Field.date_stop,
        AdsInsights.Field.campaign_id,
        AdsInsights.Field.campaign_name,
        AdsInsights.Field.adset_id,
        AdsInsights.Field.adset_name,
        AdsInsights.Field.ad_id,
        AdsInsights.Field.ad_name,
        AdsInsights.Field.impressions,
        AdsInsights.Field.reach,
        AdsInsights.Field.clicks,
        AdsInsights.Field.spend,
        AdsInsights.Field.actions,
        AdsInsights.Field.action_values,
    ]
    
    def __init__(self, client_code: str, account_id: str, access_token: str):
        super().__init__(client_code)
        self.account_id = account_id
        self.access_token = access_token
        self._init_api()
    
    def _init_api(self):
        """Initialize Facebook Ads API."""
        FacebookAdsApi.init(access_token=self.access_token)
        self.account = AdAccount(self.account_id)
    
    def validate_credentials(self) -> bool:
        """Validate Meta Ads credentials."""
        try:
            self.account.api_get(fields=['name'])
            return True
        except Exception as e:
            self.logger.error(f"Invalid Meta credentials: {e}")
            return False
    
    def extract(
        self,
        start_date: date,
        end_date: date,
        level: str = "ad",
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Extract Meta Ads data."""
        params = {
            'time_range': {
                'since': str(start_date),
                'until': str(end_date)
            },
            'level': level,
            'time_increment': 1,  # Daily breakdown
        }
        
        try:
            insights = self.account.get_insights(
                fields=self.FIELDS,
                params=params
            )
            
            results = [dict(insight) for insight in insights]
            
            self.log_extraction(
                start_date=start_date,
                end_date=end_date,
                records_count=len(results)
            )
            
            return results
            
        except Exception as e:
            self.log_extraction(
                start_date=start_date,
                end_date=end_date,
                records_count=0,
                status="error",
                error=str(e)
            )
            raise
```

### src/extractors/nuvemshop.py

```python
"""Nuvemshop API extractor."""
from datetime import date, datetime
from typing import List, Dict, Any, Optional
import requests

from .base_extractor import BaseExtractor


class NuvemshopExtractor(BaseExtractor):
    """Extract data from Nuvemshop API."""
    
    BASE_URL = "https://api.nuvemshop.com.br/v1"
    
    def __init__(
        self,
        client_code: str,
        store_id: str,
        access_token: str
    ):
        super().__init__(client_code)
        self.store_id = store_id
        self.access_token = access_token
        self.headers = {
            "Authentication": f"bearer {access_token}",
            "User-Agent": "Cortex Analytics (contato@cortexanalytics.com.br)",
            "Content-Type": "application/json"
        }
    
    def validate_credentials(self) -> bool:
        """Validate Nuvemshop credentials."""
        try:
            response = requests.get(
                f"{self.BASE_URL}/{self.store_id}/store",
                headers=self.headers
            )
            return response.status_code == 200
        except Exception as e:
            self.logger.error(f"Invalid Nuvemshop credentials: {e}")
            return False
    
    def extract(
        self,
        start_date: date,
        end_date: date,
        resource: str = "orders",
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Extract data from Nuvemshop."""
        if resource == "orders":
            return self._extract_orders(start_date, end_date)
        elif resource == "products":
            return self._extract_products()
        elif resource == "customers":
            return self._extract_customers(start_date, end_date)
        else:
            raise ValueError(f"Unknown resource: {resource}")
    
    def _extract_orders(
        self,
        start_date: date,
        end_date: date
    ) -> List[Dict[str, Any]]:
        """Extract orders with pagination."""
        orders = []
        page = 1
        per_page = 200
        
        while True:
            params = {
                "created_at_min": f"{start_date}T00:00:00",
                "created_at_max": f"{end_date}T23:59:59",
                "page": page,
                "per_page": per_page
            }
            
            response = requests.get(
                f"{self.BASE_URL}/{self.store_id}/orders",
                headers=self.headers,
                params=params
            )
            response.raise_for_status()
            
            batch = response.json()
            if not batch:
                break
            
            orders.extend(batch)
            
            if len(batch) < per_page:
                break
            
            page += 1
        
        self.log_extraction(
            start_date=start_date,
            end_date=end_date,
            records_count=len(orders)
        )
        
        return orders
    
    def _extract_products(self) -> List[Dict[str, Any]]:
        """Extract all products."""
        products = []
        page = 1
        per_page = 200
        
        while True:
            response = requests.get(
                f"{self.BASE_URL}/{self.store_id}/products",
                headers=self.headers,
                params={"page": page, "per_page": per_page}
            )
            response.raise_for_status()
            
            batch = response.json()
            if not batch:
                break
            
            products.extend(batch)
            
            if len(batch) < per_page:
                break
            
            page += 1
        
        return products
    
    def _extract_customers(
        self,
        start_date: date,
        end_date: date
    ) -> List[Dict[str, Any]]:
        """Extract customers updated in date range."""
        customers = []
        page = 1
        per_page = 200
        
        while True:
            params = {
                "updated_at_min": f"{start_date}T00:00:00",
                "updated_at_max": f"{end_date}T23:59:59",
                "page": page,
                "per_page": per_page
            }
            
            response = requests.get(
                f"{self.BASE_URL}/{self.store_id}/customers",
                headers=self.headers,
                params=params
            )
            response.raise_for_status()
            
            batch = response.json()
            if not batch:
                break
            
            customers.extend(batch)
            
            if len(batch) < per_page:
                break
            
            page += 1
        
        return customers
```

### pipelines/daily_etl.py

```python
"""Daily ETL pipeline."""
import logging
from datetime import date, timedelta
from typing import Optional

from config.settings import settings, load_client_config
from src.extractors.meta_ads import MetaAdsExtractor
from src.extractors.google_ads import GoogleAdsExtractor
from src.extractors.nuvemshop import NuvemshopExtractor
from src.transformers.orders_transformer import OrdersTransformer
from src.transformers.campaigns_transformer import CampaignsTransformer
from src.loaders.mysql_loader import MySQLLoader
from src.utils.notifications import send_slack_notification

logger = logging.getLogger(__name__)


def run_daily_etl(
    client_code: str,
    target_date: Optional[date] = None,
    lookback_days: int = 7
):
    """
    Run daily ETL pipeline for a client.
    
    Args:
        client_code: Client identifier
        target_date: Date to process (default: yesterday)
        lookback_days: Days to look back for reprocessing
    """
    config = load_client_config(client_code)
    
    if target_date is None:
        target_date = date.today() - timedelta(days=1)
    
    start_date = target_date - timedelta(days=lookback_days)
    end_date = target_date
    
    logger.info(f"Starting ETL for {client_code}: {start_date} to {end_date}")
    
    try:
        # Initialize loader
        loader = MySQLLoader(client_code)
        
        # 1. Extract and load E-commerce data
        if config['ecommerce']['platform'] == 'nuvemshop':
            ecom_extractor = NuvemshopExtractor(
                client_code=client_code,
                store_id=config['ecommerce']['store_id'],
                access_token=settings.NUVEMSHOP_ACCESS_TOKEN
            )
            
            # Orders
            raw_orders = ecom_extractor.extract(
                start_date=start_date,
                end_date=end_date,
                resource='orders'
            )
            loader.load_raw('raw_ecommerce_orders', raw_orders)
            
            # Transform and load
            orders_transformer = OrdersTransformer(client_code)
            orders, order_items, customers = orders_transformer.transform(raw_orders)
            
            loader.upsert('dim_customers', customers, key='external_customer_id')
            loader.upsert('fct_orders', orders, key='external_order_id')
            loader.insert('fct_order_items', order_items)
        
        # 2. Extract and load Ads data
        if config['ads']['meta']['enabled']:
            meta_extractor = MetaAdsExtractor(
                client_code=client_code,
                account_id=config['ads']['meta']['account_id'],
                access_token=settings.META_ACCESS_TOKEN
            )
            
            raw_meta = meta_extractor.extract(
                start_date=start_date,
                end_date=end_date
            )
            loader.load_raw('raw_meta_ads', raw_meta)
            
            # Transform campaigns
            campaigns_transformer = CampaignsTransformer(client_code)
            campaigns, ad_spend = campaigns_transformer.transform_meta(raw_meta)
            
            loader.upsert('dim_campaigns', campaigns, key=['platform', 'platform_campaign_id', 'platform_adset_id', 'platform_ad_id'])
            loader.upsert('fct_ad_spend', ad_spend, key=['date_key', 'campaign_id'])
        
        # Similar for Google Ads...
        
        # 3. Run post-processing
        loader.execute_procedure('sp_update_customer_metrics')
        
        logger.info(f"ETL completed successfully for {client_code}")
        
        send_slack_notification(
            channel=config['alerts']['slack_channel'],
            message=f"✅ ETL diário concluído para {client_code}"
        )
        
    except Exception as e:
        logger.error(f"ETL failed for {client_code}: {e}")
        
        send_slack_notification(
            channel=config['alerts']['slack_channel'],
            message=f"❌ ETL falhou para {client_code}: {str(e)}"
        )
        
        raise


if __name__ == "__main__":
    import sys
    
    client_code = sys.argv[1] if len(sys.argv) > 1 else "default"
    run_daily_etl(client_code)
```

---

## Scripts de Setup

### scripts/setup_database.sh

```bash
#!/bin/bash

# Setup database for a new client
# Usage: ./setup_database.sh <client_code>

CLIENT_CODE=$1

if [ -z "$CLIENT_CODE" ]; then
    echo "Usage: ./setup_database.sh <client_code>"
    exit 1
fi

DB_NAME="cortex_${CLIENT_CODE}"

echo "Creating database: $DB_NAME"

mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD << EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE ${DB_NAME};
SOURCE ../sql/schema.sql;

GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;
EOF

echo "Database $DB_NAME created successfully"
```

---

## Documentação

### docs/data_dictionary.md

```markdown
# Dicionário de Dados - Cortex Analytics E-commerce

## Dimensões

### dim_customers
Tabela de clientes únicos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| customer_id | BIGINT | ID interno (PK) |
| external_customer_id | VARCHAR(100) | ID do e-commerce |
| email_hash | VARCHAR(64) | SHA256 do email (LGPD) |
| first_order_date | DATE | Data da primeira compra |
| first_order_channel | VARCHAR(50) | Canal de aquisição |
| total_orders | INT | Total de pedidos |
| total_revenue | DECIMAL | Receita total (LTV) |
| rfm_segment | VARCHAR(50) | Segmento RFM |

### dim_products
Catálogo de produtos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| product_id | BIGINT | ID interno (PK) |
| external_product_id | VARCHAR(100) | ID do e-commerce |
| sku | VARCHAR(100) | SKU do produto |
| product_name | VARCHAR(500) | Nome do produto |
| category_level_1 | VARCHAR(200) | Categoria principal |
| current_price | DECIMAL | Preço atual |
| abc_classification | CHAR(1) | Classificação ABC |

### dim_campaigns
Campanhas de ads unificadas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| campaign_id | BIGINT | ID interno (PK) |
| platform | VARCHAR(50) | meta, google, tiktok |
| platform_campaign_id | VARCHAR(100) | ID na plataforma |
| campaign_name | VARCHAR(500) | Nome da campanha |
| funnel_stage | VARCHAR(50) | TOFU, MOFU, BOFU |

## Fatos

### fct_orders
Pedidos realizados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| order_id | BIGINT | ID interno (PK) |
| external_order_id | VARCHAR(100) | ID do e-commerce |
| customer_id | BIGINT | FK para dim_customers |
| order_created_at | DATETIME | Data/hora do pedido |
| total_amount | DECIMAL | Valor total |
| fbc | VARCHAR(255) | Meta click ID |
| gclid | VARCHAR(255) | Google click ID |

### fct_ad_spend
Gastos diários com ads.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| date_key | INT | FK para dim_dates |
| campaign_id | BIGINT | FK para dim_campaigns |
| impressions | BIGINT | Impressões |
| clicks | BIGINT | Cliques |
| spend | DECIMAL | Gasto em R$ |

### fct_attribution
Atribuição de vendas a campanhas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| order_id | BIGINT | FK para fct_orders |
| campaign_id | BIGINT | FK para dim_campaigns |
| attribution_model | VARCHAR(50) | Modelo usado |
| attributed_revenue | DECIMAL | Receita atribuída |
```

---

## Checklist de Onboarding

```markdown
# Checklist - Onboarding Cliente E-commerce

## Pré-requisitos
- [ ] Contrato assinado
- [ ] Acesso ao e-commerce (API)
- [ ] Acesso às contas de ads
- [ ] Acesso ao GA4

## Semana 1: Discovery
- [ ] Call de kick-off
- [ ] Mapeamento de ferramentas
- [ ] Definição de KPIs prioritários
- [ ] Acesso a credenciais

## Semana 2: Tracking
- [ ] Auditoria GTM atual
- [ ] Setup/correção de eventos e-commerce
- [ ] Implementação Meta CAPI
- [ ] Implementação Google Enhanced Conversions
- [ ] Teste de eventos

## Semana 3: Integração
- [ ] Criar database no Railway
- [ ] Deploy do projeto
- [ ] Configurar extractors
- [ ] Backfill de dados históricos (90 dias)
- [ ] Validar integridade dos dados

## Semana 4: Entrega
- [ ] Criar views de report
- [ ] Deploy do dashboard
- [ ] Configurar alertas
- [ ] Treinamento com cliente
- [ ] Documentação entregue

## Pós-entrega
- [ ] Monitorar ETL diário (1 semana)
- [ ] Ajustar alertas conforme feedback
- [ ] Primeira revisão mensal agendada
```
