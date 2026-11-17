import type { PitchDetection } from '../types'

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

/** Equal temperament, A4 = 440 Hz. Cents are relative to the nearest note. */
export function frequencyToNote(frequency: number) {
  if (!Number.isFinite(frequency) || frequency <= 0)
    throw new RangeError('Frequency must be positive and finite.')
  const exactMidi = 69 + 12 * Math.log2(frequency / 440)
  const midi = Math.round(exactMidi)
  return {
    midi,
    note: NOTE_NAMES[((midi % 12) + 12) % 12],
    octave: Math.floor(midi / 12) - 1,
    cents: (exactMidi - midi) * 100,
  }
}

/**
 * YIN difference function and cumulative mean normalization. All expensive work
 * lives in the DSP worker. Box averaging reduces the analysis rate to 16–24 kHz;
 * the original-rate RMS remains available for calibration and the input meter.
 * A single fundamental is expected: chords and speech are not transcription.
 */
export function detectPitch(
  samples: Float32Array,
  sampleRate: number,
  timestamp = performance.now(),
  noiseFloor = 0.008,
): PitchDetection {
  const empty: PitchDetection = {
    frequency: null,
    midi: null,
    note: null,
    octave: null,
    cents: null,
    confidence: 0,
    rms: 0,
    timestamp,
    status: 'uncertain',
  }
  if (!Number.isFinite(sampleRate) || sampleRate < 8000 || samples.length < 256) return empty
  let sum = 0
  let energy = 0
  for (let i = 0; i < samples.length; i++) {
    if (!Number.isFinite(samples[i])) return empty
    sum += samples[i]
    energy += samples[i] * samples[i]
  }
  const mean = sum / samples.length
  const rms = Math.sqrt(Math.max(0, energy / samples.length - mean * mean))
  const floor = Number.isFinite(noiseFloor) ? Math.max(0.001, Math.min(0.2, noiseFloor)) : 0.008
  empty.rms = rms
  if (rms < floor) return { ...empty, status: 'silence' }

  const factor = Math.max(1, Math.floor(sampleRate / 16000))
  const rate = sampleRate / factor
  const data = new Float32Array(Math.floor(samples.length / factor))
  for (let i = 0; i < data.length; i++) {
    let value = 0
    for (let j = 0; j < factor; j++) value += samples[i * factor + j] - mean
    data[i] = value / factor
  }
  const window = Math.floor(data.length / 2)
  const maxLag = Math.min(window - 1, Math.ceil(rate / 40))
  const minLag = Math.max(2, Math.floor(rate / 1800))
  if (maxLag <= minLag) return empty
  const normalized = new Float64Array(maxLag + 1)
  normalized[0] = 1
  let cumulative = 0
  for (let lag = 1; lag <= maxLag; lag++) {
    let difference = 0
    for (let i = 0; i < window; i++) {
      const delta = data[i] - data[i + lag]
      difference += delta * delta
    }
    cumulative += difference
    normalized[lag] = cumulative > 0 ? (difference * lag) / cumulative : 1
  }
  // The first convincing valley identifies the fundamental without preferring
  // a later multiple of its period. Refine it by parabolic interpolation.
  let period = -1
  for (let lag = minLag; lag < maxLag; lag++) {
    if (normalized[lag] < 0.12) {
      while (lag + 1 < maxLag && normalized[lag + 1] < normalized[lag]) lag++
      period = lag
      break
    }
  }
  if (period < 0) return empty
  const confidence = Math.max(0, Math.min(1, 1 - normalized[period]))
  if (confidence < 0.9) return { ...empty, confidence }
  const left = normalized[period - 1]
  const center = normalized[period]
  const right = normalized[period + 1]
  const curvature = left - 2 * center + right
  const adjustment =
    curvature === 0 ? 0 : Math.max(-1, Math.min(1, (left - right) / (2 * curvature)))
  const frequency = rate / (period + adjustment)
  if (frequency < 55 || frequency > 1500) return { ...empty, confidence, status: 'out-of-range' }
  return { ...empty, ...frequencyToNote(frequency), frequency, confidence, status: 'detected' }
}
