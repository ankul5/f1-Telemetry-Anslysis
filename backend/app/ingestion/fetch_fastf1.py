import os
import fastf1
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models.models import Race, Driver, SessionLap

# Enable FastF1 Cache
CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

def ingest_fastf1_race(year: int = 2023, round_num: int = 1):
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        print(f"--- FastF1 Ingesting Season {year} Round {round_num} ---")
        race_id = f"{year}_{round_num}"

        # Ensure race exists
        race = db.query(Race).filter(Race.race_id == race_id).first()
        if not race:
            race = Race(
                race_id=race_id,
                season_year=year,
                round=round_num,
                race_name=f"{year} Race {round_num}",
                circuit_name="Bahrain International Circuit" if round_num == 1 else "Circuit"
            )
            db.add(race)
            db.commit()

        # Load session using FastF1
        session = fastf1.get_session(year, round_num, 'R')
        session.load(laps=True, telemetry=False, weather=False, messages=False)

        laps_df = session.laps
        print(f"Loaded {len(laps_df)} laps from FastF1")

        # Map FastF1 Driver Codes to Driver IDs or Driver Records
        # Query drivers table
        drivers_in_db = db.query(Driver).all()
        code_to_driver_id = {d.code: d.driver_id for d in drivers_in_db if d.code}
        num_to_driver_id = {str(d.permanent_number): d.driver_id for d in drivers_in_db if d.permanent_number}

        laps_inserted = 0
        for _, row in laps_df.iterrows():
            driver_code = str(row.get("Driver", ""))
            driver_num = str(row.get("DriverNumber", ""))

            driver_id = code_to_driver_id.get(driver_code) or num_to_driver_id.get(driver_num) or f"driver_{driver_code.lower()}"

            # Ensure driver exists if missing
            existing_driver = db.query(Driver).filter(Driver.driver_id == driver_id).first()
            if not existing_driver:
                existing_driver = Driver(
                    driver_id=driver_id,
                    code=driver_code if len(driver_code) == 3 else None,
                    permanent_number=driver_num if driver_num else None,
                    given_name=driver_code,
                    family_name="Driver"
                )
                db.add(existing_driver)
                db.commit()

            lap_number = int(row["LapNumber"]) if not pd_isna(row["LapNumber"]) else None
            if lap_number is None:
                continue

            lap_time = row["LapTime"]
            lap_time_seconds = lap_time.total_seconds() if (lap_time is not None and not pd_isna(lap_time)) else None
            tyre_compound = str(row["Compound"]) if not pd_isna(row["Compound"]) else None
            stint = int(row["Stint"]) if not pd_isna(row["Stint"]) else None

            # Check if lap already exists
            existing_lap = db.query(SessionLap).filter(
                SessionLap.race_id == race_id,
                SessionLap.driver_id == driver_id,
                SessionLap.lap_number == lap_number
            ).first()

            if not existing_lap:
                session_lap = SessionLap(
                    race_id=race_id,
                    driver_id=driver_id,
                    lap_number=lap_number,
                    lap_time_seconds=lap_time_seconds,
                    tyre_compound=tyre_compound,
                    stint=stint
                )
                db.add(session_lap)
                laps_inserted += 1

        db.commit()
        print(f"--- FastF1 Ingestion Complete. Inserted {laps_inserted} laps for Race {race_id} ---")

    except Exception as e:
        db.rollback()
        print(f"Error during FastF1 ingestion: {e}")
        raise
    finally:
        db.close()

def pd_isna(val):
    import pandas as pd
    return pd.isna(val)

if __name__ == "__main__":
    ingest_fastf1_race(2023, 1)
