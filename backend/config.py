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
    frontend_origin: str


def get_settings() -> Settings:
    return Settings(
        app_name=os.getenv("APP_NAME", "Ricks Energy Manager API"),
        app_version=os.getenv("APP_VERSION", "0.1.0"),
        debug_mode=os.getenv("DEBUG_MODE", "False").lower() == "true",
        database_url=os.getenv("DATABASE_URL", "sqlite:///./ricks_energy.db"),
        frontend_origin=os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"),
    )
