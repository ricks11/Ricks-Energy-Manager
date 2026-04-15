from backend.database import Base, engine
from backend.main import seed_initial_data


def bootstrap_database() -> None:
    Base.metadata.create_all(bind=engine)
    seed_initial_data()


if __name__ == "__main__":
    bootstrap_database()
    print("Database bootstrap completed.")