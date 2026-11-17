import { describe, expect, it } from 'vitest'
import {
  createSession,
  evaluateDetection,
  sessionAccuracy,
} from '../../src/evaluation/lessonEngine'
import { lessons } from '../../src/lessons/curriculum'
import type { PitchDetection } from '../../src/types'

const lesson = lessons[0]!
function detection(
  timestamp: number,
  midi = 40,
  status: PitchDetection['status'] = 'detected',
): PitchDetection {
  return {
    timestamp,
    midi,
    frequency: 82.4,
    cents: 0,
    octave: 2,
    note: 'E',
    rms: 0.1,
    confidence: 0.98,
    status,
  }
}
describe('shared lesson evaluator', () => {
  it('requires separate plucks, never farming a held correct note', () => {
    const initial = createSession(lesson)
    const one = evaluateDetection(initial, lesson, detection(0))
    expect(initial.attempts).toBe(0)
    expect(one.correct).toBe(1)
    expect(evaluateDetection(one, lesson, detection(1000))).toBe(one)
    const released = evaluateDetection(one, lesson, detection(1100, 40, 'silence'))
    expect(evaluateDetection(released, lesson, detection(1200)).correct).toBe(2)
  })
  it('does not release on uncertain frames or count low confidence', () => {
    const one = evaluateDetection(createSession(lesson), lesson, detection(0))
    const uncertain = evaluateDetection(one, lesson, detection(300, 40, 'uncertain'))
    expect(uncertain.needsRelease).toBe(true)
    expect(evaluateDetection(uncertain, lesson, detection(500)).correct).toBe(1)
    const quiet = evaluateDetection(createSession(lesson), lesson, {
      ...detection(0),
      confidence: 0.6,
    })
    expect(quiet.attempts).toBe(0)
    expect(quiet.score).toBe(0)
  })
  it('counts a held wrong note only once and applies cooldown after release', () => {
    const wrong = evaluateDetection(createSession(lesson), lesson, detection(0, 45))
    expect(wrong.attempts).toBe(1)
    expect(wrong.score).toBe(0)
    expect(evaluateDetection(wrong, lesson, detection(800, 45)).attempts).toBe(1)
    const released = evaluateDetection(wrong, lesson, detection(30, 45, 'silence'))
    expect(evaluateDetection(released, lesson, detection(100)).correct).toBe(0)
    const right = evaluateDetection(released, lesson, detection(230))
    expect(right.correct).toBe(1)
    expect(sessionAccuracy(right)).toBe(0.5)
  })
  it('allows changed pitch, rejects stale frames, and freezes completed results', () => {
    const map = lessons[1]!
    let state = createSession(map)
    for (const [i, note] of map.notes.entries())
      state = evaluateDetection(state, map, detection(i * 300, note.midi))
    expect(state.completed).toBe(true)
    expect(state.bestCombo).toBe(6)
    expect(sessionAccuracy(state)).toBe(1)
    expect(evaluateDetection(state, map, detection(5000, 1))).toBe(state)
    const one = evaluateDetection(createSession(lesson), lesson, detection(1000))
    expect(evaluateDetection(one, lesson, detection(500, 40, 'silence'))).toBe(one)
  })
  it('completion does not imply passing after many wrong pitches', () => {
    let state = createSession(lesson)
    for (let i = 0; i < 4; i++) {
      state = evaluateDetection(state, lesson, detection(i * 600, 45))
      state = evaluateDetection(state, lesson, detection(i * 600 + 300))
    }
    expect(state.completed).toBe(true)
    expect(sessionAccuracy(state)).toBeLessThan(lesson.passingAccuracy)
    expect(state.bestCombo).toBe(1)
  })
})
