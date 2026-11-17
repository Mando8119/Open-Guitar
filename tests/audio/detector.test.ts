import { describe, expect, it } from 'vitest'
import { detectPitch, frequencyToNote } from '../../src/pitch/detector'
import { guitarSignal, openStringFrequencies, seededNoise } from './signals'

describe('local monophonic pitch detection', () => {
  for (const sampleRate of [44100, 48000, 96000]) {
    for (const [index, openFrequency] of openStringFrequencies.entries()) {
      it(`finds string ${6 - index} and its fretted notes at ${sampleRate} Hz`, () => {
        for (const fret of [0, 1, 5, 12, 19, 24]) {
          const frequency = openFrequency * 2 ** (fret / 12)
          for (const phase of [0, 0.7, 2.1]) {
            const result = detectPitch(
              guitarSignal(frequency, sampleRate, 4096, { phase, noise: 0.003 }),
              sampleRate,
              1234,
            )
            expect(result.status, `${frequency} Hz with phase ${phase}`).toBe('detected')
            expect(Math.abs(1200 * Math.log2(result.frequency! / frequency))).toBeLessThanOrEqual(
              10,
            )
            expect(result.confidence).toBeGreaterThanOrEqual(0.9)
            expect(result.timestamp).toBe(1234)
          }
        }
      })
    }
  }

  it('finds the fundamental with a stronger second harmonic', () => {
    for (const frequency of openStringFrequencies) {
      const result = detectPitch(
        guitarSignal(frequency, 48000, 4096, { harmonics: [0.35, 1, 0.4, 0.15] }),
        48000,
      )
      expect(result.status).toBe('detected')
      expect(Math.abs(1200 * Math.log2(result.frequency! / frequency))).toBeLessThan(10)
    }
  })

  it('rejects silence, DC offsets, and sub-threshold notes', () => {
    for (const samples of [
      new Float32Array(4096),
      new Float32Array(4096).fill(0.1),
      guitarSignal(110, 48000, 4096, { amplitude: 0.001 }),
    ]) {
      expect(detectPitch(samples, 48000).status).toBe('silence')
    }
    expect(
      detectPitch(guitarSignal(110, 48000, 4096, { amplitude: 0.2 }), 48000, 0, 0.2).status,
    ).toBe('silence')
  })

  it('rejects deterministic broadband noise and clipped non-finite frames', () => {
    for (const seed of [1, 43, 173, 998]) {
      const random = seededNoise(seed)
      const result = detectPitch(
        Float32Array.from({ length: 4096 }, () => random() * 0.2),
        48000,
      )
      expect(result.status).toBe('uncertain')
      expect(result.frequency).toBeNull()
    }
    expect(detectPitch(new Float32Array(4096).fill(NaN), 48000).status).toBe('uncertain')
  })

  it('reports frequencies outside the supported guitar range without a note', () => {
    const result = detectPitch(guitarSignal(45, 48000, 8192), 48000)
    expect(result.status).toBe('out-of-range')
    expect(result.midi).toBeNull()
  })

  it('handles invalid rate and short frames', () => {
    expect(detectPitch(new Float32Array(8), 48000).status).toBe('uncertain')
    expect(detectPitch(new Float32Array(4096), NaN).status).toBe('uncertain')
  })
})

describe('equal temperament note conversion', () => {
  it('maps concert A, low E and cents above and below a note', () => {
    expect(frequencyToNote(440)).toEqual({ midi: 69, note: 'A', octave: 4, cents: 0 })
    expect(frequencyToNote(openStringFrequencies[0])).toMatchObject({
      midi: 40,
      note: 'E',
      octave: 2,
    })
    expect(frequencyToNote(440 * 2 ** (17 / 1200)).cents).toBeCloseTo(17, 8)
    expect(frequencyToNote(440 * 2 ** (-21 / 1200)).cents).toBeCloseTo(-21, 8)
    expect(() => frequencyToNote(0)).toThrow(RangeError)
  })
})
