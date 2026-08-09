# PitWall AI — Phase 2b: Race Replay Engine

**Project context:** PitWall AI is a mobile app (React Native + Expo Go) with 4 screens: Live, Driver Stats, Strategy Maker & Simulation, and an AI Assistant. Backend is FastAPI + PostgreSQL. This phase sits between Phase 2 (Live) and Phase 3 (Strategy & Simulation) — it builds a reusable replay component that Phase 3 depends on.

**Assumes already done:** Phase 0 (foundations), Phase 1 (driver stats), Phase 2 (live screen).

**Reference repo note:** `IAmTomShaw/f1-race-replay` (https://github.com/IAmTomShaw/f1-race-replay) is the direct inspiration for this phase — its core idea (turn a session into an ordered sequence of playable frames: leaderboard, gaps, tyre compounds evolving lap by lap) is what you're building here, in your own stack. Do not depend on or port the repo's code directly; it's a Python/`arcade` desktop app and won't run in Expo/FastAPI. Build the same *capability*, independently.

## Goal
Let a user search for any real past race and watch it replay lap by lap — leaderboard positions, gaps, and tyre compounds evolving over the race, with play/pause/scrub controls. This becomes a shared, reusable player used in two places: browsing old races directly, and (in Phase 3) watching a simulated strategy play out.

## Tasks

**Backend**
- `GET /api/races/{raceId}/replay` → `{ frames: [{ lap, leaderboard: [{ position, driverId, gap, tyreCompound }] }] }`
- For 2018+ races: build frames from FastF1 lap-by-lap data (richer detail available)
- For 2002–2017 races: build frames from whatever Jolpica-F1 provides per lap/stint — this will be coarser (tyre compound wasn't consistently tracked before ~2011); degrade gracefully rather than showing fake data
- Frames should be lightweight (one entry per lap, not raw telemetry) so playback is smooth on mobile

**Mobile — reusable `<RaceReplayPlayer>` component**
- Leaderboard list that re-sorts/animates as laps advance
- Lap counter, tyre compound icons per driver
- Play / pause / scrub-to-lap controls, adjustable playback speed
- Built as a standalone component (not tied to one screen) — it should accept a `frames` array as a prop, regardless of whether those frames came from a real race or a simulation

**Where it's used**
- A race search/detail view: search old races (2002–present, reusing driver/race data from Phase 1), tap into one, hit "Watch Replay"
- Reused as-is in Phase 3 for the strategy simulation's playback — Phase 3 should not build its own player

## Definition of Done
- Searching for any past race and opening it offers a working "Watch Replay" that plays the real race lap by lap
- Play/pause/scrub all work smoothly
- The player component is generic enough that Phase 3 can feed it simulated frames instead of real ones without modification

## Explicitly out of scope for this phase
No strategy building or simulation logic here — that's Phase 3, which will reuse what you build in this phase. No live-session support — that's Phase 2, already done.
