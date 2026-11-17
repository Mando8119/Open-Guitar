# Development

## Requirements and commands

Use Node.js 24 LTS, or a compatible Node.js 22.12+ LTS release.

```sh
npm install
npm run dev
npm run check
npx playwright install chromium
npm run test:e2e
npm run benchmark
```

`npm run check` runs TypeScript build/type checking, ESLint, Vitest, and a Vite production build. `npm run test:e2e` runs the Playwright suite. `npm run benchmark` runs deterministic synthetic pitch cases; it is not a physical instrument test. The development server binds to `127.0.0.1`, which is suitable for local browser microphone permission.

## Boundaries

- Keep capture and teardown in `src/audio/`; pitch DSP belongs in `src/pitch/` and the Worker.
- Keep lesson acceptance rules in `src/evaluation/`; serious and game modes share this evaluator.
- Keep presentation in React and teaching text/state in `src/mascot/`.
- Store only validated real lesson results. Simulated signals in tests/benchmark are not earned progress.
- Preserve the MIT license and do not move microphone samples off-device.

The initial source ownership and frozen interfaces are recorded in [AGENTS.md](AGENTS.md) and [CONTRACTS.md](docs/CONTRACTS.md). Changes across these boundaries should retain the shared contracts or be coordinated with the lead.

## Verification limits

The benchmark exercises 72 unique synthetic note cases (six open-string fundamentals at six fret offsets, across 44.1 and 48 kHz) over 360 measured frames, plus seeded-noise false-positive trials. It reports runtime and cents error for the current machine/runtime. These figures do not characterize a physical guitar, room, microphone, Android device, or end-to-end input latency. Run a manual check with a real guitar and the target browser/device before making those claims. Windows Chrome is the initial manual target.

Production precaches the UI and DSP Worker. Playwright verifies offline reload, tool navigation, and a synthetic Worker analysis after cache installation. Installed-PWA lifecycle/version updates and physical offline microphone behavior still need manual checks. `npm run test:e2e` expects a current `npm run build` and starts its servers automatically. Capacitor configuration exists, but Android toolchain/device validation is not complete.
