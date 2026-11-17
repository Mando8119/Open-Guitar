# Contributing

Contributions should keep audio capture, evaluation, storage, and presentation separate. Please preserve the MIT license and keep microphone samples local. Capture must start only from a user action; clean up stream tracks, nodes, Workers, and contexts when capture ends. Never route live microphone audio to speakers.

Keep the shared interfaces in `src/types/index.ts` and [CONTRACTS.md](docs/CONTRACTS.md) aligned. Uncertain or silent audio must not count as a successful note. Serious and game modes should continue to use the same lesson evaluator. Do not treat synthetic input as earned progress.

Before submitting a change, run the checks relevant to it. The full deterministic suite is `npm run check`; browser checks are `npm run test:e2e`; the detector benchmark is `npm run benchmark`. Benchmark output is synthetic-only. If you validate a physical guitar or Android device, document the device, browser/OS, setup, and observations separately from automated results.

Do not claim chord transcription: current chord practice verifies arpeggiated notes in sequence. Android configuration is preparatory pending toolchain and device validation. Keep user-facing controls functional and describe limitations clearly.
