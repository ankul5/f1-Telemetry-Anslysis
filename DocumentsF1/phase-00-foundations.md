# PitWall AI — Phase 0: Foundations

**Project context:** PitWall AI is a mobile app (React Native + Expo Go) with 4 screens: Live, Driver Stats, Strategy Maker & Simulation, and an AI Assistant. Backend is FastAPI + PostgreSQL. Data comes from FastF1 (2018+ telemetry) and Jolpica-F1 (Ergast-compatible, 1950–present results/standings). This is the first of 6 build phases — later phases assume everything in this one exists and works.

## Goal
Stand up both apps and confirm the full chain (mobile → backend → database) works end to end, with a first slice of real F1 data sitting in Postgres.

## Tasks

**Mobile app**
- `npx create-expo-app pitwall-ai` with TypeScript template
- Add `expo-router`; scaffold 4 tabs: `live`, `drivers`, `strategy`, `assistant` (each just a placeholder screen for now)
- Add `axios` (or fetch) and `@tanstack/react-query` for API calls

**Backend**
- FastAPI project with structure: `app/main.py`, `app/routers/`, `app/models/`, `app/services/`, `app/ingestion/`
- `GET /api/health` → `{ "status": "ok" }`
- Set up PostgreSQL (local Docker, or a free hosted instance e.g. Neon/Supabase)
- SQLAlchemy models (or raw SQL) for a minimal schema: `drivers`, `constructors`, `seasons`, `races`, `results`

**Data ingestion (first slice, not full history)**
- Script using `fastf1` to load one season + one race weekend; store session/lap/result basics into Postgres
- Script using the Jolpica-F1 REST API to pull one season's driver list and results

**Connect them**
- Mobile app calls `GET /api/health` on load and shows "Backend connected" so the whole chain is verified

## Definition of Done
- Expo Go shows a 4-tab app shell (tabs can be empty placeholders)
- Backend runs locally and `/api/health` returns 200
- Postgres contains real data for at least one season/race pulled from FastF1 and Jolpica-F1
- Mobile app confirms it can reach the backend

## Explicitly out of scope for this phase
Do not build driver search, live data, strategy simulation, the AI assistant, or any real UI polish yet — those are later phases.
