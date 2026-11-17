/** Deterministic synthetic signals; these are not recordings of a guitar. */
export function seededNoise(seed = 173) {
  let state = seed >>> 0
  return () => {
    state = (1664525 * state + 1013904223) >>> 0
    return (state / 0x100000000) * 2 - 1
  }
}

export function guitarSignal(
  frequency: number,
  sampleRate = 48000,
  length = 4096,
  options: {
    phase?: number
    noise?: number
    harmonics?: number[]
    decay?: number
    amplitude?: number
  } = {},
) {
  const noise = seededNoise(43)
  const harmonics = options.harmonics ?? [1, 0.45, 0.23, 0.1, 0.06]
  const normalization = harmonics.reduce((sum, value) => sum + Math.abs(value), 0)
  return Float32Array.from({ length }, (_, i) => {
    const time = i / sampleRate
    const wave = harmonics.reduce(
      (sum, amplitude, h) =>
        sum +
        amplitude *
          Math.sin(2 * Math.PI * frequency * time * (h + 1) + (options.phase ?? 0) * (h + 1)),
      0,
    )
    return (
      (((options.amplitude ?? 0.6) * wave) / normalization) *
        Math.exp(-time * (options.decay ?? 2)) +
      noise() * (options.noise ?? 0)
    )
  })
}

export const openStringFrequencies = [
  82.406889, 110, 146.832384, 195.997718, 246.941651, 329.627557,
]
