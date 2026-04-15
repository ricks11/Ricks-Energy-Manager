from datetime import datetime

from pydantic import BaseModel, Field


class ProfileOut(BaseModel):
    full_name: str
    email: str
    phone: str
    meter_id: str
    member_tier: str
    member_code: str
    avatar_url: str


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    email: str | None = Field(default=None, min_length=5, max_length=160)
    phone: str | None = Field(default=None, min_length=5, max_length=40)


class PreferencesOut(BaseModel):
    alert_threshold_days: int
    push_notifications: bool
    dark_mode: bool
    language: str


class PreferencesUpdate(BaseModel):
    alert_threshold_days: int | None = Field(default=None, ge=1, le=7)
    push_notifications: bool | None = None
    dark_mode: bool | None = None
    language: str | None = Field(default=None, min_length=2, max_length=64)


class EnergySummaryOut(BaseModel):
    balance_kwh: float
    estimated_days_remaining: int
    average_daily_consumption: float
    service_status: str
    meter_id: str
    last_updated: datetime


class HistoryChartPoint(BaseModel):
    label: str
    kwh: float


class HistoryLogOut(BaseModel):
    id: int
    occurred_at: datetime
    event_type: str
    event_label: str
    note: str | None
    energy_kwh: float | None
    amount_eur: float | None


class HistoryOut(BaseModel):
    current_period_kwh: float
    percent_change: float
    chart: list[HistoryChartPoint]
    logs: list[HistoryLogOut]


class TopUpRequest(BaseModel):
    kwh: float = Field(gt=0, le=100000)
    payment_method: str = Field(min_length=2, max_length=64)


class TopUpOut(BaseModel):
    added_kwh: float
    total_cost_eur: float
    new_balance_kwh: float
    estimated_extension_days: int


class MeterReadingCreate(BaseModel):
    meter_kwh: float = Field(ge=0)


class MeterReadingOut(BaseModel):
    id: int
    meter_kwh: float
    recorded_at: datetime
