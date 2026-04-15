from dataclasses import dataclass
from pathlib import Path
import os

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_version: str
    debug_mode: bool
    database_url: str
    database_auto_create: bool
    database_auto_seed: bool
    frontend_origin: str


def read_bool_env(name: str, default: bool) -> bool:
    raw_value = os.getenv(name, str(default))
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def get_settings() -> Settings:
    return Settings(
        app_name=os.getenv("APP_NAME", "Ricks Energy Manager API"),
        app_version=os.getenv("APP_VERSION", "0.1.0"),
        debug_mode=read_bool_env("DEBUG_MODE", False),
        database_url=os.getenv("DATABASE_URL", "sqlite:///./ricks_energy.db"),
        database_auto_create=read_bool_env("DATABASE_AUTO_CREATE", False),
        database_auto_seed=read_bool_env("DATABASE_AUTO_SEED", False),
        frontend_origin=os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"),
    )
