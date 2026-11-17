import { describe, expect, it } from 'vitest'
import { LevelOnsetDetector, nearestBeatError, timingGrade } from '../src/rhythm/timing'
import { chordNotes, chords } from '../src/chords/chords'

describe('musical timing', () => {
  it('measures signed offset against a monotonic beat grid', () => {
    expect(nearestBeatError(1950, 1000, 60)).toBe(-50)
    expect(nearestBeatError(2080, 1000, 60)).toBe(80)
    expect(nearestBeatError(1740, 1000, 60, 2)).toBe(240)
    expect(timingGrade(-150)).toBe('early')
    expect(timingGrade(100)).toBe('on-time')
    expect(timingGrade(200)).toBe('late')
  })
  it('requires rising signal, absolute level and a refractory interval', () => {
    const onset = new LevelOnsetDetector()
    expect(onset.process(0.001, 0)).toBe(false)
    expect(onset.process(0.05, 100)).toBe(true)
    expect(onset.process(0.05, 200)).toBe(false)
    expect(onset.process(0.001, 240)).toBe(false)
    expect(onset.process(0.05, 260)).toBe(false)
    onset.process(0.001, 400)
    expect(onset.process(0.05, 500)).toBe(true)
  })
})
describe('chord voicings', () => {
  it('omits muted strings and maps standard tuning to expected Em and Am pitches', () => {
    expect(chordNotes(chords[0]).map((note) => note.midi)).toEqual([40, 47, 52, 55, 59, 64])
    expect(chordNotes(chords[1]).map((note) => note.midi)).toEqual([45, 52, 57, 60, 64])
    expect(chordNotes(chords[4]).map((note) => note.string)).toEqual([4, 3, 2, 1])
  })
})
