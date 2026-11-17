# Working prototype milestone

November 16, 2026. The repository began with a README and the existing MIT license. This milestone adds a buildable desktop-first prototype, rather than declaring the full roadmap complete.

## Delivered

- Original React/TypeScript/Vite studio interface: dashboard, learning path, Focus/Play lesson presentation, tuner, free practice, calibration, progress, settings, chord studio, rhythm lab.
- Original SVG Guitary with deterministic teaching events, expressive states, hint/repeat/dismiss/minimize/hide controls, local preferences, reduced motion, and a mobile layout that does not cover exercise controls.
- Local microphone input with device selection, safe cancellation/cleanup, mono AudioWorklet capture, bounded Worker analysis, YIN, note/cents conversion, RMS, confidence, silence/uncertainty handling, and calibration.
- Five original note-based lessons, shared evaluation and persisted completed sessions, real points/combos, fretted notes and original melody content.
- Em/Am/C/G/D diagrams and arpeggiated pitch verification; clock-scheduled metronome, conservative microphone onset timing, tap timing, scrolling original timed tablature with misses and speed/pause/restart controls.
- Production offline precaching including the DSP Worker, a Capacitor preparation config, GitHub Actions, synthetic benchmarks, public-source research, engineering docs, and real browser screenshots.

## Decisions and agent execution

Audio analysis, evaluation, storage, and presentation are separate modules. Worklet capture stays small; DSP runs in a Worker; correctness is owned by the shared evaluator. Silence/uncertainty never earn points. Chords use an explicitly arpeggiated fallback, and adaptive/commercial AI is not a runtime dependency.

Audio, frontend, and Guitary/learning were delegated to GPT-6.1 Sol/medium. Documentation and final QA used GPT-6 Luna/medium. Initial ownership was nonoverlapping, with the lead performing integration, rhythm/chord additions, research, and deterministic verification. The refreshed client exposed all six configured specialist roles; the final QA agent was invoked through the configured `qa` role. See [AGENT_ARCHITECTURE.md](AGENT_ARCHITECTURE.md).

## Validation

- `npm run check`: TypeScript, ESLint, **50 unit tests**, production build and seven-URL offline shell generation passed.
- `npm run test:e2e`: **5 Chromium browser tests** passed. They cover navigation/preferences, permission errors, a synthetic microphone through the real audio graph, E2 recognition and track cleanup, shared-mode lesson persistence, mobile widths, offline reload/tool navigation, and an offline synthetic DSP Worker result.
- `npm run format:check` and `git diff --check`: passed.
- `npm run benchmark`: 72 synthetic cases/360 evaluations, mean error **0.536 cents**, maximum **7.045 cents**, no rejected note evaluations and 0/100 seeded-noise detections. Recorded timing is machine-specific; see [PERFORMANCE.md](PERFORMANCE.md).
- `npm audit`: no reported vulnerabilities at the time of installation/check. This is a registry audit result, not a comprehensive security review.
- Independent browser QA at 1280×720 and 390×844 reported no console/page errors or horizontal mobile overflow. Lead visual inspection additionally found and corrected a mobile mascot overlay. Actual screenshots are in `docs/screenshots/`.
- REA 6.9.0 runs with project-local Node 24.22.1; MCP initialization advertises 255 tools, the CLI reports capabilities, and own-source JS/TS analysis succeeded. Default global doctor remains unhealthy because personal registration/skills/native providers were not installed. See [REA.md](REA.md).

## Limits and continuation

Physical nylon-string guitar/microphone tests and end-to-end latency measurements are still required. Android is prepared, not built/tested. Full simultaneous chord recognition, a complete curriculum, skill mastery/achievements, persistent unfinished sessions, richer game levels, and chord/rhythm history remain roadmap work. Local history retains the latest 200 completed lessons. Offline first-ever use before installation and service-worker upgrade scenarios are not claimed as verified.

No global agent configuration was modified, Claude Code was unavailable on PATH, and no paid API service, external account workflow, push, or release was enabled. Validated source is committed locally; inspect `git log -1` for the milestone commit. Next: use the physical test procedure and turn observed acoustic failures into reproducible local fixtures.
