from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DailyReading(Base):
    __tablename__ = "daily_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meter_kwh: Mapped[float] = mapped_column(Float, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(160), nullable=False)
    phone: Mapped[str] = mapped_column(String(40), nullable=False)
    meter_id: Mapped[str] = mapped_column(String(40), nullable=False)
    member_tier: Mapped[str] = mapped_column(String(40), nullable=False)
    member_code: Mapped[str] = mapped_column(String(60), nullable=False)
    avatar_url: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    alert_threshold_days: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    push_notifications: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    dark_mode: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    language: Mapped[str] = mapped_column(String(64), nullable=False, default="English (US)")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )


class EnergyWallet(Base):
    __tablename__ = "energy_wallets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    balance_kwh: Mapped[float] = mapped_column(Float, nullable=False, default=1240.0)
    average_daily_consumption: Mapped[float] = mapped_column(Float, nullable=False, default=103.3)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )


class EnergyEvent(Base):
    __tablename__ = "energy_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    energy_kwh: Mapped[float | None] = mapped_column(Float, nullable=True)
    amount_eur: Mapped[float | None] = mapped_column(Float, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )
