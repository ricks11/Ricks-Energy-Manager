from datetime import date, datetime, time, timedelta, timezone

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import desc
from sqlalchemy.orm import Session

from backend.config import get_settings
from backend.database import Base, SessionLocal, engine, get_db
from backend.models import DailyReading, EnergyEvent, EnergyWallet, UserPreference, UserProfile, utc_now
from backend.schemas import (
    EnergySummaryOut,
    HistoryChartPoint,
    HistoryLogOut,
    HistoryOut,
    MeterReadingCreate,
    MeterReadingOut,
    PreferencesOut,
    PreferencesUpdate,
    ProfileOut,
    ProfileUpdate,
    TopUpOut,
    TopUpRequest,
)


settings = get_settings()
RATE_EUR_PER_KWH = 0.25
TOP_UP_EXTENSION_BASE_KWH_PER_DAY = 7.0

EVENT_LABELS: dict[str, str] = {
    "grid_consumption": "Grid Consumption",
    "solar_top_up": "Solar Top-up",
    "manual_wallet_load": "Manual Wallet Load",
    "top_up_purchase": "Top-up Purchase",
    "meter_reading": "Meter Reading",
}

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def seed_initial_data() -> None:
    db = SessionLocal()
    try:
        if db.query(UserProfile).first() is None:
            db.add(
                UserProfile(
                    full_name="Alexander Thorne",
                    email="a.thorne@kinetic.io",
                    phone="+1 (555) 0482-990",
                    meter_id="4829-X",
                    member_tier="Elite Member",
                    member_code="4829-X-2024",
                    avatar_url=(
                        "https://lh3.googleusercontent.com/aida-public/"
                        "AB6AXuAX2i4wMD24KXjbnQZPWsW0OMhyHTXMQ4IjNy8mfzinYjgsvdsojetVDD37"
                        "ka4XSX9p7sr2_URp6dA6rnBlzT4ohJbiatUEvTWMdQsXG0mqfr7cAqfT_gUKrq8I"
                        "4Y7yaeDYt6vaxcbipXbhRzpqUkizDo5wSNtUP_vrVGnX6FKVlRPgv0M_G7gEu4tN"
                        "cTqS1KXav7U-z8vuPDvRMVKQjGUwXV4JlWu9fSL4xBU1tZRdH0ooBAtPzKvwvQpb"
                        "Nyk4zcDVElpYorUy-EhX"
                    ),
                )
            )

        if db.query(UserPreference).first() is None:
            db.add(
                UserPreference(
                    alert_threshold_days=2,
                    push_notifications=True,
                    dark_mode=True,
                    language="English (US)",
                )
            )

        if db.query(EnergyWallet).first() is None:
            db.add(
                EnergyWallet(
                    balance_kwh=1240.0,
                    average_daily_consumption=103.3,
                )
            )

        if db.query(DailyReading).first() is None:
            sample_readings = [19.4, 17.8, 22.1, 18.6, 20.9, 21.7, 22.3]
            today = date.today()

            for index, meter_kwh in enumerate(sample_readings):
                reading_date = today - timedelta(days=6 - index)
                db.add(
                    DailyReading(
                        meter_kwh=meter_kwh,
                        recorded_at=datetime.combine(
                            reading_date,
                            time(hour=19, minute=0),
                            tzinfo=timezone.utc,
                        ),
                    )
                )

        if db.query(EnergyEvent).first() is None:
            now = datetime.now(timezone.utc)
            db.add_all(
                [
                    EnergyEvent(
                        event_type="grid_consumption",
                        note="Main grid usage",
                        energy_kwh=4.2,
                        occurred_at=now - timedelta(hours=2),
                    ),
                    EnergyEvent(
                        event_type="solar_top_up",
                        note="Solar recharge",
                        energy_kwh=12.0,
                        occurred_at=now - timedelta(hours=8),
                    ),
                    EnergyEvent(
                        event_type="grid_consumption",
                        note="Main grid usage",
                        energy_kwh=1.8,
                        occurred_at=now - timedelta(days=1, hours=1),
                    ),
                    EnergyEvent(
                        event_type="manual_wallet_load",
                        note="Wallet balance load",
                        amount_eur=50.0,
                        occurred_at=now - timedelta(days=1, hours=6),
                    ),
                ]
            )

        db.commit()
    finally:
        db.close()


def require_profile(db: Session) -> UserProfile:
    profile = db.query(UserProfile).first()
    if profile is None:
        raise HTTPException(status_code=500, detail="Profile record not initialized")
    return profile


def require_preferences(db: Session) -> UserPreference:
    preferences = db.query(UserPreference).first()
    if preferences is None:
        raise HTTPException(status_code=500, detail="Preferences record not initialized")
    return preferences


def require_wallet(db: Session) -> EnergyWallet:
    wallet = db.query(EnergyWallet).first()
    if wallet is None:
        raise HTTPException(status_code=500, detail="Energy wallet record not initialized")
    return wallet


def format_event_label(event_type: str) -> str:
    return EVENT_LABELS.get(event_type, event_type.replace("_", " ").title())


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    seed_initial_data()


@app.get("/", tags=["system"])
def read_root() -> dict[str, str]:
    return {"message": "Ricks Energy Manager API is running."}


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


@app.get("/profile", response_model=ProfileOut, tags=["profile"])
def get_profile(db: Session = Depends(get_db)) -> ProfileOut:
    profile = require_profile(db)
    return ProfileOut(
        full_name=profile.full_name,
        email=profile.email,
        phone=profile.phone,
        meter_id=profile.meter_id,
        member_tier=profile.member_tier,
        member_code=profile.member_code,
        avatar_url=profile.avatar_url,
    )


@app.put("/profile", response_model=ProfileOut, tags=["profile"])
def update_profile(payload: ProfileUpdate, db: Session = Depends(get_db)) -> ProfileOut:
    profile = require_profile(db)

    if payload.full_name is not None:
        profile.full_name = payload.full_name
    if payload.email is not None:
        profile.email = payload.email
    if payload.phone is not None:
        profile.phone = payload.phone

    profile.updated_at = utc_now()
    db.commit()
    db.refresh(profile)

    return ProfileOut(
        full_name=profile.full_name,
        email=profile.email,
        phone=profile.phone,
        meter_id=profile.meter_id,
        member_tier=profile.member_tier,
        member_code=profile.member_code,
        avatar_url=profile.avatar_url,
    )


@app.get("/preferences", response_model=PreferencesOut, tags=["preferences"])
def get_preferences(db: Session = Depends(get_db)) -> PreferencesOut:
    preferences = require_preferences(db)
    return PreferencesOut(
        alert_threshold_days=preferences.alert_threshold_days,
        push_notifications=preferences.push_notifications,
        dark_mode=preferences.dark_mode,
        language=preferences.language,
    )


@app.put("/preferences", response_model=PreferencesOut, tags=["preferences"])
def update_preferences(payload: PreferencesUpdate, db: Session = Depends(get_db)) -> PreferencesOut:
    preferences = require_preferences(db)

    if payload.alert_threshold_days is not None:
        preferences.alert_threshold_days = payload.alert_threshold_days
    if payload.push_notifications is not None:
        preferences.push_notifications = payload.push_notifications
    if payload.dark_mode is not None:
        preferences.dark_mode = payload.dark_mode
    if payload.language is not None:
        preferences.language = payload.language

    preferences.updated_at = utc_now()
    db.commit()
    db.refresh(preferences)

    return PreferencesOut(
        alert_threshold_days=preferences.alert_threshold_days,
        push_notifications=preferences.push_notifications,
        dark_mode=preferences.dark_mode,
        language=preferences.language,
    )


@app.get("/energy/summary", response_model=EnergySummaryOut, tags=["energy"])
def get_energy_summary(db: Session = Depends(get_db)) -> EnergySummaryOut:
    profile = require_profile(db)
    wallet = require_wallet(db)

    if wallet.average_daily_consumption <= 0:
        estimated_days = 0
    else:
        estimated_days = max(0, int(round(wallet.balance_kwh / wallet.average_daily_consumption)))

    return EnergySummaryOut(
        balance_kwh=round(wallet.balance_kwh, 2),
        estimated_days_remaining=estimated_days,
        average_daily_consumption=round(wallet.average_daily_consumption, 2),
        service_status="ok",
        meter_id=profile.meter_id,
        last_updated=wallet.updated_at,
    )


@app.get("/history", response_model=HistoryOut, tags=["history"])
def get_history(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> HistoryOut:
    latest_readings = (
        db.query(DailyReading)
        .order_by(desc(DailyReading.recorded_at))
        .limit(7)
        .all()
    )
    latest_readings.reverse()

    if latest_readings:
        chart = [
            HistoryChartPoint(
                label=reading.recorded_at.strftime("%a"),
                kwh=round(reading.meter_kwh, 2),
            )
            for reading in latest_readings
        ]
    else:
        chart = [
            HistoryChartPoint(label=label, kwh=0.0)
            for label in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        ]

    current_period_kwh = round(sum(point.kwh for point in chart), 2)

    previous_readings = (
        db.query(DailyReading)
        .order_by(desc(DailyReading.recorded_at))
        .offset(7)
        .limit(7)
        .all()
    )
    previous_period_kwh = sum(reading.meter_kwh for reading in previous_readings)

    if previous_period_kwh > 0:
        percent_change = round(
            ((current_period_kwh - previous_period_kwh) / previous_period_kwh) * 100,
            2,
        )
    else:
        percent_change = 0.0

    events = (
        db.query(EnergyEvent)
        .order_by(desc(EnergyEvent.occurred_at))
        .limit(limit)
        .all()
    )

    logs = [
        HistoryLogOut(
            id=event.id,
            occurred_at=event.occurred_at,
            event_type=event.event_type,
            event_label=format_event_label(event.event_type),
            note=event.note,
            energy_kwh=event.energy_kwh,
            amount_eur=event.amount_eur,
        )
        for event in events
    ]

    return HistoryOut(
        current_period_kwh=current_period_kwh,
        percent_change=percent_change,
        chart=chart,
        logs=logs,
    )


@app.post(
    "/top-ups",
    response_model=TopUpOut,
    status_code=status.HTTP_201_CREATED,
    tags=["topup"],
)
def create_top_up(payload: TopUpRequest, db: Session = Depends(get_db)) -> TopUpOut:
    wallet = require_wallet(db)

    added_kwh = round(payload.kwh, 2)
    total_cost_eur = round(added_kwh * RATE_EUR_PER_KWH, 2)

    wallet.balance_kwh = round(wallet.balance_kwh + added_kwh, 2)
    wallet.updated_at = utc_now()

    db.add(
        EnergyEvent(
            event_type="top_up_purchase",
            note=f"Top-up via {payload.payment_method}",
            energy_kwh=added_kwh,
            amount_eur=total_cost_eur,
            occurred_at=utc_now(),
        )
    )

    db.commit()
    db.refresh(wallet)

    estimated_extension_days = max(
        0,
        int(round(added_kwh / TOP_UP_EXTENSION_BASE_KWH_PER_DAY)),
    )

    return TopUpOut(
        added_kwh=added_kwh,
        total_cost_eur=total_cost_eur,
        new_balance_kwh=wallet.balance_kwh,
        estimated_extension_days=estimated_extension_days,
    )


@app.post(
    "/readings",
    response_model=MeterReadingOut,
    status_code=status.HTTP_201_CREATED,
    tags=["energy"],
)
def create_meter_reading(
    payload: MeterReadingCreate,
    db: Session = Depends(get_db),
) -> MeterReadingOut:
    reading = DailyReading(meter_kwh=payload.meter_kwh, recorded_at=utc_now())
    db.add(reading)
    db.add(
        EnergyEvent(
            event_type="meter_reading",
            note="Manual meter reading registered",
            energy_kwh=payload.meter_kwh,
            occurred_at=utc_now(),
        )
    )
    db.commit()
    db.refresh(reading)

    return MeterReadingOut(
        id=reading.id,
        meter_kwh=reading.meter_kwh,
        recorded_at=reading.recorded_at,
    )

