from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str = "cortex-secret-key"
    DEBUG: bool = False

    # API Settings
    API_V1_PREFIX: str = "/api"
    PROJECT_NAME: str = "Cortex Analytics - E-commerce Dashboard"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
