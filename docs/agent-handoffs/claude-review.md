# Optional independent review

Objective: review the implemented local microphone/lesson system. Claude Code is currently unavailable on PATH; this is a handoff, not a claimed executed review.

Read `AGENTS.md`, `ARCHITECTURE.md`, `AUDIO_ENGINE.md`, and `docs/PERFORMANCE.md`. Treat source as read-only initially. Inspect lifecycle races, pitch/octave ambiguity, confidence gating, hold/release semantics, timing capture timestamps, storage validation, and offline behavior. Do not request paid API billing or modify global configuration.

Acceptance: return concrete findings with file/symbol, severity, reproduction, test gap, and proposed correction. Distinguish synthetic/browser evidence from physical guitar or Android validation. Commands: `npm run check`, `npm run test:e2e`, `npm run benchmark`. Root integrates corrections and commits after review.
