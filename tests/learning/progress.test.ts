import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  defaultPreferences,
  loadProgress,
  MAX_SESSION_HISTORY,
  PROGRESS_STORAGE_KEY,
  recordSession,
  saveProgress,
} from '../../src/storage/progress'
import type { ProgressData, SessionRecord } from '../../src/types'

const empty = (): ProgressData => ({
  version: 1,
  sessions: [],
  preferences: { ...defaultPreferences },
})
const record = (id = 'one'): SessionRecord => ({
  id,
  lessonId: 'first-clear-note',
  completedAt: '2026-11-16T12:00:00Z',
  accuracy: 0.8,
  correct: 4,
  attempts: 5,
  durationSeconds: 60,
  mode: 'serious',
  score: 400,
  bestCombo: 3,
})
afterEach(() => vi.unstubAllGlobals())
describe('local progress', () => {
  it('loads without browser storage and recovers from malformed data', () => {
    vi.stubGlobal('localStorage', undefined)
    expect(loadProgress()).toEqual(empty())
    expect(saveProgress(empty())).toBe(false)
    vi.stubGlobal('localStorage', { getItem: () => '{broken' })
    expect(loadProgress().sessions).toEqual([])
  })
  it('sanitizes preferences and rejects inconsistent results', () => {
    vi.stubGlobal('localStorage', {
      getItem: () =>
        JSON.stringify({
          version: 1,
          sessions: [record(), { ...record('bad'), accuracy: 1 }],
          preferences: { noiseFloor: -1, mascotVisible: false },
        }),
    })
    const data = loadProgress()
    expect(data.sessions).toHaveLength(1)
    expect(data.preferences.noiseFloor).toBe(defaultPreferences.noiseFloor)
    expect(data.preferences.mascotVisible).toBe(false)
    expect(recordSession(data, { ...record('invalid'), attempts: NaN }).sessions).toHaveLength(1)
  })
  it('deduplicates ids, keeps bounded history, and never mutates input', () => {
    const original = empty()
    let data = recordSession(original, record())
    expect(original.sessions).toHaveLength(0)
    data = recordSession(data, record())
    expect(data.sessions).toHaveLength(1)
    for (let i = 0; i < MAX_SESSION_HISTORY + 20; i++) data = recordSession(data, record(String(i)))
    expect(data.sessions).toHaveLength(MAX_SESSION_HISTORY)
    expect(data.sessions.at(-1)?.id).toBe(String(MAX_SESSION_HISTORY + 19))
  })
  it('round trips valid data and handles denied writes', () => {
    const values = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key),
      setItem: (key: string, value: string) => values.set(key, value),
    })
    const data = recordSession(empty(), record())
    expect(saveProgress(data)).toBe(true)
    expect(values.has(PROGRESS_STORAGE_KEY)).toBe(true)
    expect(loadProgress()).toEqual(data)
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new Error('quota')
      },
    })
    expect(saveProgress(data)).toBe(false)
  })
})
