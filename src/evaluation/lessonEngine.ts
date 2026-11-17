import type { Lesson, LessonSession, PitchDetection } from '../types'

export const NOTE_COOLDOWN_MS = 220
export const MIN_NOTE_CONFIDENCE = 0.85

export function createSession(lesson: Lesson): LessonSession {
  return {
    lessonId: lesson.id,
    index: 0,
    correct: 0,
    attempts: 0,
    combo: 0,
    bestCombo: 0,
    score: 0,
    completed: lesson.notes.length === 0,
    lastOutcome: 'waiting',
    lastAcceptedAt: -Infinity,
    needsRelease: false,
    lastAcceptedMidi: null,
  }
}

/** Pure pitch evaluation shared by both presentation modes. No elapsed-time bonus. */
export function evaluateDetection(
  session: LessonSession,
  lesson: Lesson,
  detection: PitchDetection,
): LessonSession {
  if (session.completed || session.lessonId !== lesson.id || !Number.isFinite(detection.timestamp))
    return session
  if (detection.timestamp < session.lastAcceptedAt) return session
  if (detection.status === 'silence')
    return { ...session, needsRelease: false, lastOutcome: 'waiting' }
  if (
    detection.status !== 'detected' ||
    !Number.isFinite(detection.confidence) ||
    detection.confidence < MIN_NOTE_CONFIDENCE ||
    detection.midi === null ||
    !Number.isInteger(detection.midi) ||
    detection.frequency === null ||
    !Number.isFinite(detection.frequency) ||
    detection.frequency <= 0 ||
    detection.cents === null ||
    !Number.isFinite(detection.cents) ||
    Math.abs(detection.cents) > 40
  ) {
    return { ...session, lastOutcome: 'uncertain' }
  }
  const changedPitch =
    session.lastAcceptedMidi != null && detection.midi !== session.lastAcceptedMidi
  if (
    (session.needsRelease && !changedPitch) ||
    detection.timestamp - session.lastAcceptedAt < NOTE_COOLDOWN_MS
  )
    return session
  const target = lesson.notes[session.index]
  if (!target) return session
  const correct = detection.midi === target.midi
  const combo = correct ? session.combo + 1 : 0
  const index = session.index + (correct ? 1 : 0)
  return {
    ...session,
    index,
    correct: session.correct + (correct ? 1 : 0),
    attempts: session.attempts + 1,
    combo,
    bestCombo: Math.max(session.bestCombo, combo),
    score: session.score + (correct ? 100 + Math.min(combo - 1, 10) * 10 : 0),
    completed: index >= lesson.notes.length,
    lastOutcome: correct ? 'correct' : 'incorrect',
    lastAcceptedAt: detection.timestamp,
    lastAcceptedMidi: detection.midi,
    needsRelease: true,
  }
}

export function sessionAccuracy(session: LessonSession): number {
  return session.attempts > 0 ? Math.max(0, Math.min(1, session.correct / session.attempts)) : 0
}
