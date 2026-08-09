import sys
import time
from datetime import date

import requests
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models.models import Season, Driver, Constructor, Race, Result, Standing

JOLPICA_BASE_URL = "https://api.jolpi.ca/ergast/f1"
ERGAST_FALLBACK_URL = "https://jolpi.ca/ergast/f1"

# Jolpica allows 4 requests/sec and 500/hour for anonymous callers. Backfilling
# ~24 seasons means hundreds of requests, so pace them to stay under the burst limit.
REQUEST_DELAY_SECONDS = 0.3


def fetch_json(endpoint: str):
    urls = [f"{JOLPICA_BASE_URL}/{endpoint}", f"{ERGAST_FALLBACK_URL}/{endpoint}"]
    for url in urls:
        try:
            resp = requests.get(url, timeout=20)
            if resp.status_code == 429:
                # Rate limited — back off once and retry the same URL before falling through.
                print("  Rate limited by Jolpica, backing off 60s...")
                time.sleep(60)
                resp = requests.get(url, timeout=20)
            if resp.status_code == 200:
                return resp.json()
        except Exception as e:
            print(f"Warning: Failed to fetch from {url}: {e}")
        finally:
            time.sleep(REQUEST_DELAY_SECONDS)
    raise RuntimeError(f"Failed to fetch data for endpoint {endpoint} from both primary and fallback APIs.")

def ingest_jolpica_season(year: int = 2023):
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        print(f"--- Ingesting Jolpica-F1 Data for Season {year} ---")
        
        # 1. Season
        season_obj = db.query(Season).filter(Season.year == year).first()
        if not season_obj:
            season_obj = Season(year=year, url=f"https://en.wikipedia.org/wiki/{year}_Formula_One_World_Championship")
            db.add(season_obj)
            db.commit()
            print(f"Added Season {year}")

        # 2. Drivers
        drivers_data = fetch_json(f"{year}/drivers.json")
        driver_list = drivers_data.get("MRData", {}).get("DriverTable", {}).get("Drivers", [])
        print(f"Fetched {len(driver_list)} drivers")
        
        for d in driver_list:
            driver_id = d.get("driverId")
            existing = db.query(Driver).filter(Driver.driver_id == driver_id).first()
            if not existing:
                driver_obj = Driver(
                    driver_id=driver_id,
                    permanent_number=d.get("permanentNumber"),
                    code=d.get("code"),
                    given_name=d.get("givenName", ""),
                    family_name=d.get("familyName", ""),
                    date_of_birth=d.get("dateOfBirth"),
                    nationality=d.get("nationality")
                )
                db.add(driver_obj)
        db.commit()

        # 3. Race Results (includes constructors, races, and results)
        results_data = fetch_json(f"{year}/results.json?limit=1000")
        races_list = results_data.get("MRData", {}).get("RaceTable", {}).get("Races", [])
        print(f"Fetched {len(races_list)} races with results")

        for r in races_list:
            race_id = f"{year}_{r.get('round')}"
            circuit_name = r.get("Circuit", {}).get("circuitName", "")
            
            # Race record
            existing_race = db.query(Race).filter(Race.race_id == race_id).first()
            if not existing_race:
                race_obj = Race(
                    race_id=race_id,
                    season_year=year,
                    round=int(r.get("round")),
                    race_name=r.get("raceName", ""),
                    circuit_name=circuit_name,
                    date=r.get("date")
                )
                db.add(race_obj)
                db.commit()

            # Results records
            for res in r.get("Results", []):
                c_data = res.get("Constructor", {})
                c_id = c_data.get("constructorId")
                if c_id:
                    existing_c = db.query(Constructor).filter(Constructor.constructor_id == c_id).first()
                    if not existing_c:
                        c_obj = Constructor(
                            constructor_id=c_id,
                            name=c_data.get("name", ""),
                            nationality=c_data.get("nationality")
                        )
                        db.add(c_obj)
                        db.commit()

                d_id = res.get("Driver", {}).get("driverId")
                
                # Check existing result
                existing_res = db.query(Result).filter(
                    Result.race_id == race_id,
                    Result.driver_id == d_id
                ).first()

                if not existing_res and d_id and c_id:
                    res_obj = Result(
                        race_id=race_id,
                        driver_id=d_id,
                        constructor_id=c_id,
                        number=int(res.get("number")) if res.get("number") else None,
                        position=int(res.get("position")) if res.get("position") else None,
                        points=float(res.get("points")) if res.get("points") else 0.0,
                        grid=int(res.get("grid")) if res.get("grid") else None,
                        laps=int(res.get("laps")) if res.get("laps") else None,
                        status=res.get("status")
                    )
                    db.add(res_obj)
        db.commit()

        # 4. Driver championship standings (end of season)
        standings_data = fetch_json(f"{year}/driverStandings.json?limit=100")
        standings_lists = (
            standings_data.get("MRData", {})
            .get("StandingsTable", {})
            .get("StandingsLists", [])
        )
        standing_rows = standings_lists[0].get("DriverStandings", []) if standings_lists else []
        print(f"Fetched {len(standing_rows)} driver standings")

        for s in standing_rows:
            d_id = s.get("Driver", {}).get("driverId")
            if not d_id:
                continue
            # Guard the FK: a standings row can name a driver the season roster missed.
            if not db.query(Driver).filter(Driver.driver_id == d_id).first():
                dd = s.get("Driver", {})
                db.add(Driver(
                    driver_id=d_id,
                    permanent_number=dd.get("permanentNumber"),
                    code=dd.get("code"),
                    given_name=dd.get("givenName", ""),
                    family_name=dd.get("familyName", ""),
                    date_of_birth=dd.get("dateOfBirth"),
                    nationality=dd.get("nationality"),
                ))
                db.commit()

            # Constructors is a list because a driver can switch teams mid-season.
            constructors = s.get("Constructors", [])
            c_id = constructors[-1].get("constructorId") if constructors else None
            if c_id and not db.query(Constructor).filter(Constructor.constructor_id == c_id).first():
                c_obj = Constructor(
                    constructor_id=c_id,
                    name=constructors[-1].get("name", ""),
                    nationality=constructors[-1].get("nationality"),
                )
                db.add(c_obj)
                db.commit()

            existing_standing = db.query(Standing).filter(
                Standing.season_year == year,
                Standing.driver_id == d_id,
            ).first()
            if existing_standing:
                continue

            db.add(Standing(
                season_year=year,
                driver_id=d_id,
                constructor_id=c_id,
                position=int(s["position"]) if s.get("position") else None,
                points=float(s["points"]) if s.get("points") else 0.0,
                wins=int(s["wins"]) if s.get("wins") else 0,
            ))
        db.commit()

        print(f"--- Jolpica Ingestion Complete for Season {year} ---")

    except Exception as e:
        db.rollback()
        print(f"Error during Jolpica ingestion: {e}")
        raise
    finally:
        db.close()

def ingest_all_seasons(start: int = 2002, end: int | None = None):
    """Backfill every season from `start` to `end` inclusive.

    ingest_jolpica_season is idempotent, so re-running this is safe and will only
    fill gaps. A season that fails (network blip, API outage) is logged and skipped
    rather than aborting the whole backfill.
    """
    if end is None:
        end = date.today().year

    failed = []
    for year in range(start, end + 1):
        try:
            ingest_jolpica_season(year)
        except Exception as e:
            print(f"!!! Season {year} failed, continuing: {e}")
            failed.append(year)

    print(f"\n=== Backfill {start}-{end} complete ===")
    if failed:
        print(f"Failed seasons (re-run to retry): {failed}")
    else:
        print("All seasons ingested successfully.")


if __name__ == "__main__":
    if "--all" in sys.argv:
        ingest_all_seasons()
    elif len(sys.argv) > 1 and sys.argv[1].isdigit():
        ingest_jolpica_season(int(sys.argv[1]))
    else:
        ingest_jolpica_season(2023)
