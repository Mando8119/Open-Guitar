# Performance and verification evidence

Measured November 16, 2026 on this Windows workspace with Node 24.14.0. The reproducible source is `scripts/benchmark.ts`; the recorded machine-readable output is [benchmark-results.json](benchmark-results.json).

| Synthetic measurement               | Result                                           |
| ----------------------------------- | ------------------------------------------------ |
| Generated inputs                    | 72 open/fretted-note and sample-rate cases       |
| Sample rates                        | 44.1 and 48 kHz                                  |
| Measured evaluations                | 360 (five passes over the inputs, after warm-up) |
| Mean / maximum absolute pitch error | 0.536 / 7.045 cents                              |
| Rejected note evaluations           | 0 / 360                                          |
| Mean / p95 analysis time            | 0.778 / 1.454 ms                                 |
| Seeded white-noise false detections | 0 / 100 trials                                   |
| Capture-frame duration at 48 kHz    | 85.33 ms                                         |

These cases include multiple strings/fret offsets that can share the same pitch; they are not 72 independent real instruments or necessarily 72 distinct frequencies. Timing varies with load, JIT, and hardware. Processing time excludes acquisition, input hardware, transport, rendering, and human perception. CPU utilization and end-to-end latency have not been measured. Confidence is periodicity, not calibrated probability.

Vitest also checks 44.1/48/96 kHz inputs, silence, noise, fretted notes, harmonic interference, pitch conversion, cancellation/races, bounded Worker backlog, immutable snapshots, silent worklet output, progress validation, and shared evaluation. Chromium tests use an explicitly synthetic MediaStream through the real capture/DSP path and an isolated test browser. Their completed test lessons are not user-earned progress.

## Physical guitar test procedure

Physical testing has **not** been performed. Use Chrome on Windows with the nylon-string guitar and desktop microphone first:

1. Run `npm run dev`; open `http://127.0.0.1:5173`. Open Input calibration and enable the microphone intentionally.
2. Select the desktop input. Measure room noise for three seconds without playing. Verify silence does not produce confident notes; adjust the threshold if needed.
3. In Guitar tuner, select the expected string: E2 82.41 Hz, A2 110 Hz, D3 146.83 Hz, G3 196 Hz, B3 246.94 Hz, E4 329.63 Hz. Pluck only that string and record the detected note, frequency, confidence, and cents. Mute between trials.
4. Repeat at least ten trials per string, then test frets 1, 2, 5, and 12. Compare with an independent known-good tuner; record microphone distance and room conditions. Check for octave substitutions and high-confidence wrong notes.
5. Complete “Your first clear note.” A held note must advance only once; four separate plucks should complete it. Try a wrong string and silence; neither should earn a correct hit. Switch Focus/Play midway and verify the same note position remains.
6. Reload after a completed lesson and check the journal. Deny microphone permission, disconnect the device, and stop/restart capture to check messages and release of the browser's recording indicator.
7. Build and preview once online, wait for cache installation, then disconnect networking and reload. Repeat a tuner/lesson check. Uncached first-ever offline use is outside the current design.

Record browser/OS, microphone, sample rate where available, expected/observed pitch, trial count, cents distribution, false positives/negatives, and observations. Do not infer measured latency from the DSP benchmark. For latency, use a controlled physical/audio-loopback experiment and separate input-device, frame, processing, and display delays. Keep recordings local unless explicit upload approval is given.

Polyphonic chord recognition, noisy-room robustness, hearing aid/accessibility testing, Android/WebView behavior, and Samsung device latency remain unverified. The chord page verifies successive pitches; the rhythm microphone mode is a conservative level-rise/periodicity prototype for single notes.
