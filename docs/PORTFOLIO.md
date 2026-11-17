# Portfolio notes

OpenGuitar demonstrates a local microphone analysis pipeline, a pure shared lesson evaluator, an original React interface and SVG guide, and small guitar/rhythm practice tools.

## Claims supported by source

- Audio is captured on explicit user action and analyzed locally through an AudioWorklet and Worker.
- The detector uses YIN-style monophonic pitch analysis; it is not a chord transcription system.
- Five original note lessons use one evaluator in serious and game modes.
- Completed lesson results and preferences are stored in browser local storage, with lesson history capped at 200 records.
- Chord diagrams and arpeggiated checks, a chromatic tuner/calibration view, rhythm exercises, metronome, and timed melody are implemented.

## Evidence limits

The benchmark uses 72 unique synthetic note cases and 360 measured frames, plus seeded noise trials. It is evidence about repeatable synthetic inputs on the machine running it, not physical-guitar accuracy or end-to-end latency. No Android device validation is established by the Capacitor configuration. Offline cache behavior also needs browser verification. Keep any portfolio performance claims tied to recorded test conditions and report physical tests separately from synthetic measurements.
