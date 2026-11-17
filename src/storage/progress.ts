import type { Preferences, ProgressData, SessionRecord } from '../types'

export const PROGRESS_STORAGE_KEY = 'openguitar.progress.v1'
export const MAX_SESSION_HISTORY = 200
export const defaultPreferences: Preferences = {
  mode: 'serious',
  mascotVisible: true,
  reducedMotion: false,
  guidance: 'normal',
  sound: false,
  inputDeviceId: '',
  noiseFloor: 0.008,
  animationIntensity: 'subtle',
}
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const boundedNumber = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
const shortString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 160

function preferences(value: unknown): Preferences {
  const source = object(value) ? value : {}
  return {
    mode: source.mode === 'game' ? 'game' : 'serious',
    mascotVisible:
      typeof source.mascotVisible === 'boolean'
        ? source.mascotVisible
        : defaultPreferences.mascotVisible,
    reducedMotion:
      typeof source.reducedMotion === 'boolean'
        ? source.reducedMotion
        : defaultPreferences.reducedMotion,
    guidance: source.guidance === 'quiet' ? 'quiet' : 'normal',
    sound: typeof source.sound === 'boolean' ? source.sound : defaultPreferences.sound,
    inputDeviceId:
      typeof source.inputDeviceId === 'string' && source.inputDeviceId.length <= 512
        ? source.inputDeviceId
        : '',
    noiseFloor: boundedNumber(source.noiseFloor, 0.0001, 0.2)
      ? source.noiseFloor
      : defaultPreferences.noiseFloor,
    animationIntensity: source.animationIntensity === 'full' ? 'full' : 'subtle',
  }
}

function session(value: unknown): SessionRecord | null {
  if (
    !object(value) ||
    !shortString(value.id) ||
    !shortString(value.lessonId) ||
    typeof value.completedAt !== 'string' ||
    value.completedAt.length > 40 ||
    !Number.isFinite(Date.parse(value.completedAt)) ||
    !boundedNumber(value.accuracy, 0, 1) ||
    !boundedNumber(value.correct, 0, 10000) ||
    !Number.isInteger(value.correct) ||
    !boundedNumber(value.attempts, 1, 100000) ||
    !Number.isInteger(value.attempts) ||
    value.correct > value.attempts ||
    !boundedNumber(value.durationSeconds, 0, 86400) ||
    !boundedNumber(value.score, 0, 10000000) ||
    !Number.isInteger(value.score) ||
    !boundedNumber(value.bestCombo, 0, value.correct) ||
    !Number.isInteger(value.bestCombo) ||
    (value.mode !== 'serious' && value.mode !== 'game') ||
    Math.abs(value.accuracy - value.correct / value.attempts) > 0.000001
  )
    return null
  return {
    id: value.id,
    lessonId: value.lessonId,
    completedAt: value.completedAt,
    accuracy: value.accuracy,
    correct: value.correct,
    attempts: value.attempts,
    durationSeconds: value.durationSeconds,
    mode: value.mode,
    score: value.score,
    bestCombo: value.bestCombo,
  }
}

function normalize(value: unknown): ProgressData {
  if (!object(value) || value.version !== 1)
    return { version: 1, sessions: [], preferences: { ...defaultPreferences } }
  const seen = new Set<string>()
  const sessions: SessionRecord[] = []
  if (Array.isArray(value.sessions)) {
    for (const item of value.sessions.slice(-MAX_SESSION_HISTORY * 2)) {
      const parsed = session(item)
      if (parsed && !seen.has(parsed.id)) {
        seen.add(parsed.id)
        sessions.push(parsed)
      }
    }
  }
  return {
    version: 1,
    sessions: sessions.slice(-MAX_SESSION_HISTORY),
    preferences: preferences(value.preferences),
  }
}

export function loadProgress(): ProgressData {
  try {
    const raw = globalThis.localStorage?.getItem(PROGRESS_STORAGE_KEY)
    if (!raw || raw.length > 1_000_000) return normalize(null)
    return normalize(JSON.parse(raw) as unknown)
  } catch {
    return normalize(null)
  }
}

export function saveProgress(data: ProgressData): boolean {
  try {
    if (!globalThis.localStorage) return false
    globalThis.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(normalize(data)))
    return true
  } catch {
    return false
  }
}

export function recordSession(data: ProgressData, record: SessionRecord): ProgressData {
  const clean = normalize(data)
  const parsed = session(record)
  if (!parsed || clean.sessions.some((item) => item.id === parsed.id)) return clean
  return { ...clean, sessions: [...clean.sessions, parsed].slice(-MAX_SESSION_HISTORY) }
}
