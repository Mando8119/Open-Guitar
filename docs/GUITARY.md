# Guitary

Guitary is OpenGuitar's original SVG guitar guide, implemented in `src/mascot/Guitary.tsx` with its animation styles in `guitary.css`. It is an inline vector component, not a downloaded image or an audio/evaluation dependency.

The component supports idle, greeting, explaining, listening, thinking, confused, correcting, encouraging, celebrating, waiting, and sleeping states. Teaching events map to an accessible text response in `teaching.ts`; the SVG also names its current state for assistive technology. Reduced motion and subtle/full animation intensity are user preferences. Motion is decorative; essential lesson feedback remains text and the evaluated note result.

Guitary does not listen to or interpret audio. It receives state from the app, while the audio engine and lesson evaluator remain independent. Its messages can guide practice, but they are not a measure of skill or a persisted achievement.
