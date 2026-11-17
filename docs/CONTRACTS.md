# Initial shared interfaces

Frozen source of truth: `src/types/index.ts`. Specialists may import it, but ask the lead before changing it.

## Audio DSP public API

`src/pitch/detector.ts`: `detectPitch(samples: Float32Array, sampleRate: number, timestamp?: number, noiseFloor?: number): PitchDetection`; export `frequencyToNote(frequency)` returning `{midi,note,octave,cents}`. Valid detection uses status `detected`; correctness belongs to evaluator.

`src/audio/AudioEngine.ts`: class `AudioEngine` with `subscribe(listener: (snapshot: AudioSnapshot) => void): () => void`, `getSnapshot(): AudioSnapshot`, `start(deviceId?: string): Promise<void>`, `stop(): void`, `refreshDevices(): Promise<void>`, `setNoiseFloor(value: number): void`. Worklet buffers mono audio, Worker analyzes; don't echo microphone. Snapshot always immutable. Timestamps in milliseconds, monotonic browser clock.

## Learning public API

`src/lessons/curriculum.ts`: export `lessons: Lesson[]` with at least 5 note-based original lessons; modules and useful instruction. `src/evaluation/lessonEngine.ts`: `createSession(lesson: Lesson): LessonSession`; `evaluateDetection(session: LessonSession, lesson: Lesson, detection: PitchDetection): LessonSession`; `sessionAccuracy(session): number` (0..1). Require release/silence or changed pitch and cooldown to avoid one sustained note completing repeated targets. Ignore low confidence/uncertain; wrong notes count once per pluck. Score and combo only correct notes. Completion after all targets, passing separate based on accuracy.

`src/storage/progress.ts`: `defaultPreferences: Preferences`; `loadProgress(): ProgressData`; `saveProgress(data: ProgressData): boolean`; `recordSession(data: ProgressData, session: SessionRecord): ProgressData`. Guard malformed storage, dedupe ids, cap history. No browser reference at module evaluation for unit tests.

`src/mascot/teaching.ts`: `respondToEvent(event: TeachingEvent, mode?: LearningMode): TeachingResponse`. `src/mascot/Guitary.tsx`: component `{state?: MascotState; reducedMotion?: boolean; intensity?: 'subtle'|'full'; className?: string}` original SVG, accessible. Optional dedicated mascot CSS imported by component.

## Frontend

Default export `src/App.tsx`. Root owns tooling and main entry. Frontend may import above contracts immediately; implementations arriving concurrently. Components and pages are frontend-owned. Build cohesive original dark charcoal + warm amber + mint visual identity, sidebar, dashboard and functional lesson/tuner/pathway/progress/settings/calibration pages, responsive. No fake stats, fake audio, placeholder controls, or manufactured completion. Browser UI uses one shared AudioEngine, local progress, and common evaluator in both modes. Root will add rhythm/chord functionality after initial integration; navigation can include these later, avoid placeholders.
