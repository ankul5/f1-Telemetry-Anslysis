# PitWall AI — Phase 1: Driver Stats & Records Screen

**Project context:** PitWall AI is a mobile app (React Native + Expo Go) with 4 screens: Live, Driver Stats, Strategy Maker & Simulation, and an AI Assistant. Backend is FastAPI + PostgreSQL. This is Phase 1 of 6.

**Assumes already done (Phase 0):** Expo app with 4 tab placeholders, FastAPI backend with a working `/api/health`, Postgres with a minimal schema and one season of test data ingested from FastF1 + Jolpica-F1.

## Goal
A fully working, searchable driver database screen covering 2002–present (Jolpica-F1 goes back to 1950 if you want to extend later).

## Tasks

**Data**
- Finalize Postgres schema: `drivers`, `constructors`, `seasons`, `races`, `results`, `standings` (add foreign keys: results → driver, constructor, race)
- Backfill ingestion via Jolpica-F1 for every season 2002–present: driver bios, race results, championship standings, team history
- For drivers active in 2018+, optionally enrich with a FastF1-derived summary (career fastest lap, top speed) — treat as optional, don't block the phase on it

**Backend endpoints**
- `GET /api/drivers?search=&season=` → paginated list matching name/team/season
- `GET /api/drivers/{driverId}` → career totals (wins, podiums, poles, championships), team history
- `GET /api/drivers/{driverId}/seasons/{year}` → that driver's results for one season

**Mobile — Drivers tab**
- Search bar + results list (name, current/last team, quick stat)
- Driver profile screen: career totals at top, season-by-season results table below, team history
- Handle empty search / no results gracefully

## Definition of Done
- Searching "Hamilton", "Alonso", or any 2002+ driver returns a real profile with accurate career stats and season history
- Data is coming from Postgres (not live-calling Jolpica-F1 on every request)
- Screen handles loading and empty states cleanly

## Explicitly out of scope for this phase
Do not build the live screen, strategy simulator, or AI assistant yet. Skip UI polish/theming beyond making the screen usable — that's Phase 5.
