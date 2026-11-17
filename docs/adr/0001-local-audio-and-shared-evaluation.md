# ADR 0001: Local audio and shared lesson evaluation

- **Status:** Accepted for the current implementation
- **Context:** Guitar practice needs microphone pitch feedback while keeping user audio private and ensuring that serious and game modes judge the same performance consistently.

## Decision

Request microphone access only after a user action. Process frames locally through an AudioWorklet and Worker; do not persist or upload microphone samples or play the live stream through speakers. Return structured pitch detections to the interface. Keep correctness and lesson progression in a pure shared evaluator, independent of display mode.

## Consequences

Audio lifecycle and cleanup are explicit, and app behavior can be tested with synthetic frames without treating them as earned results. Both modes share confidence, pitch, cooldown, release, scoring, and progression rules. The current detector is monophonic; chord practice therefore checks a shape by successive notes. Local browser storage holds preferences and completed lesson records, not audio.

The decision does not guarantee acoustic accuracy, low latency, offline operation, or Android compatibility. Those require physical/browser/device validation. See [Audio engine](../../AUDIO_ENGINE.md) and [Android status](../ANDROID.md).
