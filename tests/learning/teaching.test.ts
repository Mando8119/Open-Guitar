import { describe, expect, it } from 'vitest'
import { respondToEvent } from '../../src/mascot/teaching'
import { lessons } from '../../src/lessons/curriculum'
import type { TeachingEvent } from '../../src/types'

describe('deterministic guidance', () => {
  it('has contextual responses in both modes for every event', () => {
    const types: TeachingEvent['type'][] = [
      'APPLICATION_STARTED',
      'LESSON_STARTED',
      'CONCEPT_INTRODUCED',
      'NOTE_CORRECT',
      'NOTE_INCORRECT',
      'REPEATED_ERROR',
      'CHORD_COMPLETED',
      'TIMING_IMPROVED',
      'LESSON_COMPLETED',
      'ACHIEVEMENT_UNLOCKED',
      'HELP_REQUESTED',
      'MICROPHONE_ERROR',
    ]
    for (const type of types) {
      const serious = respondToEvent({ type }, 'serious')
      const game = respondToEvent({ type }, 'game')
      expect(serious.message.length).toBeGreaterThan(20)
      expect(game.message).not.toBe(serious.message)
      expect(respondToEvent({ type }, 'serious')).toEqual(serious)
    }
  })
  it('corrects errors without claiming success and does not claim a passing result', () => {
    expect(respondToEvent({ type: 'NOTE_INCORRECT' }).state).toBe('correcting')
    expect(respondToEvent({ type: 'MICROPHONE_ERROR' }).state).toBe('confused')
    expect(respondToEvent({ type: 'LESSON_COMPLETED' }).message).toContain('whether')
  })
  it('offers complete original lessons with concrete targets', () => {
    expect(lessons.length).toBeGreaterThanOrEqual(5)
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(lessons.length)
    for (const lesson of lessons) {
      expect(lesson.notes.length).toBeGreaterThan(0)
      expect(lesson.objectives.length).toBeGreaterThan(0)
      expect(lesson.instructions.join(' ')).toContain('accuracy')
      for (const note of lesson.notes) expect(note.string).toBeGreaterThanOrEqual(1)
    }
  })
})
