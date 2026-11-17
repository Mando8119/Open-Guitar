# Architecture

OpenGuitar keeps capture and signal processing in `src/audio/`, pitch analysis in `src/pitch/`, lesson rules in `src/evaluation/`, and presentation in React components. The shared types live in `src/types/index.ts`; the initial interfaces are described in [CONTRACTS.md](docs/CONTRACTS.md).

## Audio path

The user starts capture from the interface. `AudioEngine` requests a mono-preferred microphone stream, creates an `AudioContext`, and connects the source to an `AudioWorklet`. The worklet emits 4096-sample frames to a module Worker, which calls the YIN-based detector. Structured detections return to the UI. The worklet does not write microphone audio to its output; the connection to the destination only keeps capture processing scheduled. Cleanup stops tracks and closes the context.

Frames carry a monotonic timestamp mapped to `performance.now()`. The detector reports silence, uncertain, out-of-range, or detected states. Only confident, in-tune detections reach lesson evaluation.

## Learning and presentation

`src/evaluation/lessonEngine.ts` is a pure note-session evaluator. It rejects uncertain input, requires a separate pluck/release (or changed pitch) and applies a cooldown. Both serious and game presentation modes use it; mode changes the feedback and score display, not the pitch acceptance rule. Passing accuracy is reported separately from reaching the end of a sequence.

The curriculum currently has five short monophonic lessons. The tuner uses pitch-to-note conversion directly. Chord Studio reuses the evaluator to check each chord tone in sequence; it does not recognize a simultaneous chord. Rhythm Lab combines a level-change onset detector/tap exercise, a metronome, and an original timed melody. These tool results are not currently persisted as lesson progress.

Guitary's SVG and teaching response mapping are separate from audio and scoring. `src/storage/progress.ts` validates versioned browser data and keeps at most 200 completed lesson sessions. Preferences and results are stored in `localStorage`; microphone samples are not.

## Offline and mobile

In production, `src/main.tsx` registers `public/sw.js`. The service worker uses a same-origin app-shell cache and caches successful GET responses at runtime. This is an initial offline mechanism; a complete cold-start/offline experience after cache warm-up has not been verified. `capacitor.config.ts` sets up a potential Capacitor app identity and `dist` web directory. It is configuration preparation, not a validated Android app.
