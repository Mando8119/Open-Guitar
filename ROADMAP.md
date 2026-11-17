# Roadmap

This roadmap distinguishes working source features from validation still needed. It does not imply that a phase is complete merely because a related scaffold exists.

## Current implementation

- React/Vite TypeScript app with tuner, free practice, five guided single-note lessons, progress view, and input calibration.
- Local AudioWorklet-to-Worker YIN pitch path and local-storage lesson history capped at 200 records.
- Shared pure lesson evaluator for serious and game modes; original Guitary SVG and teaching responses.
- Five chord diagrams with arpeggiated pitch checks; no simultaneous/polyphonic chord detection.
- Rhythm onset/tap exercise, metronome, and timed single-note melody. These results are not persisted as lesson mastery.
- The production offline shell and DSP Worker pass a Chromium offline reload/analysis test. Service-worker version updates and physical offline microphone use still need manual validation. Capacitor configuration is preparation only.

## Next work

1. Validate tuner and lessons with physical guitars across strings, frets, pickups, rooms, and supported browsers; record measured latency and failure cases separately from synthetic data.
2. Extend production offline checks to service-worker version updates, installed-PWA behavior, and physical microphone input. First-load shell precaching/reload and offline Worker analysis are verified automatically.
3. Install an Android toolchain and test microphone permission, audio lifecycle, responsiveness, and latency on real Android hardware.
4. Expand curriculum and add a coherent mastery/progress model across tuner, chords, and rhythm tools.
5. Explore polyphonic chord detection only with separate accuracy targets and physical validation.

Synthetic benchmark success and automated checks are useful acceptance evidence for code behavior, not substitutes for physical guitar or Android validation.
