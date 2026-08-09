# PitWall AI — Phase 3: Strategy Maker & Simulation

**Project context:** PitWall AI is a mobile app (React Native + Expo Go) with 4 screens: Live, Driver Stats, Strategy Maker & Simulation, and an AI Assistant. Backend is FastAPI + PostgreSQL. This is Phase 3 of 6 — typically the longest phase, since it includes model training.

**Assumes already done:** Phase 0 (foundations), Phase 1 (driver stats), Phase 2 (live screen), Phase 2b (race replay engine — this phase reuses its `<RaceReplayPlayer>` component).

**Reference repo note:** `IAmTomShaw/f1-race-replay` (https://github.com/IAmTomShaw/f1-race-replay) is not built against directly in this phase — the replay-player capability it inspired was already built in Phase 2b. Here you just feed that same player simulated frames instead of real ones.

## Goal
Let a user build a tyre strategy for a real past race, run it through a trained model, and watch the simulated result play out lap by lap against what actually happened.

## Tasks

**Model training (do this first — longest lead time)**
- Pull FastF1 stint-level data (2018+): compound, tyre age, lap time, circuit, driver, fuel-load proxy
- Train an XGBoost regressor predicting lap time from `(compound, tyre_age, circuit, driver)`
- Save the trained model artifact; add a simple retraining script for later data updates

**Backend**
- `POST /api/strategy/simulate` — body: `{ raceId, driverId, stints: [{ compound, laps }] }`
- Logic: for each lap, predict lap time from the model given compound + tyre age at that lap; add a pit-loss constant (flat, or circuit-specific if you have the data) each time a stint ends
- Response: `{ totalTime, projectedFinishDelta, degradationCurve, frames: [{ lap, predictedTime, cumulativeTime }] }` — the `frames` array is what powers the playback UI
- Also return the actual historical result for the same race, for comparison

**Mobile — Strategy tab**
- Pick a circuit + driver (reuse driver data from Phase 1); optionally let the user open the real race's replay first (via Phase 2b's search/detail view) before building an alternate strategy for it
- Stint builder: add/reorder/remove stints, each with a tyre compound + lap count
- "Run Simulation" → results view: summary card (predicted total time, finish delta vs. actual), degradation chart
- Playback: feed the simulation's `frames` into the same `<RaceReplayPlayer>` component from Phase 2b — don't build a second player. Consider offering both the real race's replay and the simulated replay back to back for direct comparison

## Definition of Done
- Picking a real past race + driver, building a 2-stop strategy, and running it produces a sane predicted total time
- The playback control moves through the simulated race lap by lap
- The result is compared against the real historical outcome for that race

## Explicitly out of scope for this phase
Do not build the AI assistant's conversational layer yet (Phase 4) — a simulation result and its raw numbers are enough here. Multi-driver / full-grid simulation is a stretch goal, not required.
