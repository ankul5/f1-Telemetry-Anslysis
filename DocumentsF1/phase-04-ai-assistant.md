# PitWall AI — Phase 4: F1 AI Assistant

**Project context:** PitWall AI is a mobile app (React Native + Expo Go) with 4 screens: Live, Driver Stats, Strategy Maker & Simulation, and an AI Assistant. Backend is FastAPI + PostgreSQL. This is Phase 4 of 6.

**Assumes already done:** Phase 0–3, including a working strategy simulation endpoint that returns predictions and per-lap frames, and a driver stats database.

## Goal
An assistant screen that answers strategy and driver questions using real data and the trained model's output — grounded and explainable, not a freeform chatbot.

## Tasks

**Explanation service (backend)**
- Given a simulation result or a driver-stats lookup, generate a templated natural-language summary from the underlying numbers — e.g. explain *why* a strategy loses time by pointing at the degradation curve or pit-loss count, not just restating the total
- Keep this rule-based/templated for the MVP — no external LLM dependency required

**Backend endpoint**
- `POST /api/ai/query` — body: `{ question, context: { raceId?, driverId?, simulationId? } }`
- Route recognized question patterns (best strategy for a circuit, compare two drivers, explain a simulation result) to the relevant data + explanation template
- Return plain-language `answer` text plus any supporting numbers

**Mobile — Assistant tab**
- Chat-style UI (message list + input)
- Quick-prompt buttons for common questions ("Best tyre strategy for this circuit?", "Compare two drivers")
- Free-text input routed to the same backend endpoint

**Stretch (only if time remains after the above works)**
- Wire in a hosted LLM call that takes the retrieved stats/simulation context as grounding and phrases the final answer more conversationally, instead of the fixed templates

## Definition of Done
- Asking a supported question about a driver or a just-run simulation returns a correct, grounded answer
- Quick-prompt buttons work end to end
- Unsupported/unclear questions fail gracefully rather than hallucinating an answer

## Explicitly out of scope for this phase
Skip broader open-domain Q&A — the assistant should only answer questions its data can actually support. Final visual polish is Phase 5.
