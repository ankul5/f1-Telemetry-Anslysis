# PitWall AI — Phase 5: Polish, Testing & Demo Prep

**Project context:** PitWall AI is a mobile app (React Native + Expo Go) with 4 screens: Live, Driver Stats, Strategy Maker & Simulation, and an AI Assistant. This is the final phase — all 4 screens should already work individually.

**Assumes already done:** Phases 0–4, all four tabs functional against real data.

## Goal
Make the app demo-safe and reliable for evaluation — no crashes, no dependence on a live network connection during the demo itself.

## Tasks

**Reliability**
- Add loading and error states to every screen (search, driver profile, live tab, simulation, assistant)
- Add a React Query persistence layer so driver data and past simulation results are cached on-device and usable offline
- Preload/pre-cache a handful of marquee races and drivers specifically for the demo, so evaluation doesn't depend on a live network or a live session actually happening

**Testing**
- Manual QA pass on Expo Go across both Android and iOS
- Spot-check the simulation model's outputs against a few known real races for sanity (predicted totals should be in a plausible range)
- Basic backend tests for each endpoint built in Phases 1–4

**Documentation**
- README covering setup, architecture, and how to run both the Expo app and the FastAPI backend
- Short architecture write-up and any diagrams needed for the report/poster/thesis submission

## Definition of Done
- App runs start-to-finish on a phone via Expo Go without crashing across all 4 tabs
- Demo works even with a flaky or absent network connection, using pre-cached data
- README and architecture notes are ready to hand to your mentor/for the report

## Explicitly out of scope
No new features — this phase is strictly hardening and documenting what already exists.
