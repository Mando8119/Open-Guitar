# Audio engine

The audio path is local and monophonic. A learner explicitly starts capture; the app does not request microphone access at startup. Microphone samples pass from `getUserMedia` through `src/audio/capture-worklet.js` in 4096-sample frames to `src/audio/dsp-worker.ts`, which runs `detectPitch` from `src/pitch/detector.ts`.

## Detection behavior

The detector removes the frame mean, calculates RMS, rejects frames below the configurable noise floor, downsamples by box averaging, and applies the YIN difference and cumulative-mean normalization. It seeks a single fundamental in approximately 55–1500 Hz, then maps it to equal-tempered MIDI pitch with cents relative to the nearest note. It is intended for individual guitar notes, not speech transcription or polyphonic chord recognition. A strong overtone, noisy room, pickup, or weak fundamental can affect results.

The returned detection includes frequency, MIDI/note/octave, cents, confidence, RMS, timestamp, and status. The lesson evaluator separately requires confidence of at least 0.85 and pitch within 40 cents. Uncertain and silent frames do not earn points. It also gates repeated detections so one sustained note cannot advance repeated targets.

## Lifecycle and privacy

`AudioEngine.start()` asks for microphone permission, creates the context/worklet/Worker, and reports immutable snapshots. `stop()` disconnects nodes, terminates the Worker, stops all stream tracks, and closes the context. Device selection and noise-floor calibration are supported. The live microphone stream is never sent to speakers; worklet output is silent. Audio samples stay on-device and are not persisted.

Use localhost during development or serve over HTTPS for microphone access. A physical guitar check is still needed to judge real-world accuracy and latency. See the synthetic benchmark notes in [Development](DEVELOPMENT.md).
