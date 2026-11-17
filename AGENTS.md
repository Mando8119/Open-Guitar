# OpenGuitar development rules

Build working software; keep audio, evaluation, and presentation separate. Preserve the MIT license.

## Delegation and cost

- Use a lead architect for interfaces, integration, and difficult DSP. Delegate independent substantial work when it helps; use at most three concurrent specialists (four agents including lead).
- Specialist roles: Audio DSP, Frontend, Guitary/learning, Research, QA, Documentation. Give each task objective, context, owned files, interfaces, acceptance criteria, tests, deliverables, and capability requirement.
- Use `gpt-6.1-sol` / medium for feature implementation; `gpt-6-luna` / medium for narrow research, documentation, and routine QA. Escalate only for an identified problem. Select only models exposed by the active client. Do not claim monetary savings or unlimited subscription usage.
- Assign nonoverlapping files. Agents must not revert others' edits, alter dependencies, commit, or spawn further agents without the lead's assignment.
- Lead reviews changes and runs deterministic checks before committing. Do not push, publish, enable paid APIs, change global agent settings, or access external accounts without user approval.

## Engineering

- TypeScript strict; React + Vite; CSS/SVG original graphics. No commercial AI runtime dependency.
- Microphone samples stay local. Start capture only from user action. Stop tracks and contexts on cleanup. Never connect live microphone audio to speakers.
- AudioWorklet captures frames; Worker runs DSP; UI consumes structured detections. Uncertain/silent frames never earn points. Shared lesson evaluation drives both modes.
- Use a monotonic clock for timing. Persist real results only. Label simulated input explicitly and exclude it from earned progress.
- Document synthetic measurements separately from physical guitar and Android validation.
- Prefer `rg` for search. Use `npm run check`, `npm run test:e2e`, and `npm run benchmark` as appropriate. Maintain buildable milestones and concise handoffs in `docs/agent-handoffs/`.

## Ownership for initial implementation

- Lead: tooling, shared contracts, documentation, integration/browser QA, offline/platform/rhythm/chords additions.
- Audio DSP: `src/audio/`, `src/pitch/`, `tests/audio/`, `scripts/benchmark.ts`.
- Learning/Guitary: `src/lessons/`, `src/evaluation/`, `src/storage/`, `src/mascot/`, `tests/learning/`.
- Frontend: `src/App.tsx`, `src/styles.css`, `src/components/`, `src/pages/`.

See `docs/CONTRACTS.md` for the frozen initial interfaces. Request interface changes from the lead.
