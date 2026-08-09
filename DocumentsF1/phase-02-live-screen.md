# PitWall AI — Phase 2: Live Screen

**Project context:** PitWall AI is a mobile app (React Native + Expo Go) with 4 screens: Live, Driver Stats, Strategy Maker & Simulation, and an AI Assistant. Backend is FastAPI + PostgreSQL. This is Phase 2 of 6. This screen is built independently — it does not depend on any external reference repo.

**Assumes already done:** Phase 0 (foundations) and Phase 1 (driver stats screen working on real 2002+ data).

## Goal
A Live tab that shows real session data: best-effort live during an actual race weekend, falling back cleanly to the most recently completed session when nothing is live.

## Tasks

**Data source decision**
- During an active session: use OpenF1 (free tier, 2023+) or FastF1's live-timing recorder for a best-effort live snapshot
- No active session: fall back to the most recently completed session's final classification, pulled from FastF1/Jolpica data already in Postgres

**Backend endpoints**
- `GET /api/sessions?season=&round=` → list of available sessions (for picking a race weekend)
- `GET /api/sessions/{sessionId}/live` → current snapshot: leaderboard (position, driver, gap, tyre compound), lap number, session clock, weather
- Decide polling interval (e.g. every 5–10s) if the mobile app polls this endpoint while the screen is open

**Mobile — Live tab**
- Leaderboard list: position, driver, gap to leader, tyre compound
- Banner: current lap / session status, weather chip
- Tap a driver → telemetry panel (speed, gear, DRS, current lap time) where data is available
- Clear "no live session right now — showing latest results" state when falling back

## Definition of Done
- With no live session running, the tab shows a real, correct final classification for the most recent race
- Tapping a driver shows their available telemetry
- The "no live session" fallback state is visually distinct from an actual live leaderboard

## Explicitly out of scope for this phase
Do not build strategy simulation or the AI assistant yet. Don't invest in a full WebSocket streaming architecture unless polling proves insufficient — keep it simple first.
