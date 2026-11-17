import { performance } from 'node:perf_hooks'
import { detectPitch } from '../src/pitch/detector'
import { guitarSignal, openStringFrequencies, seededNoise } from '../tests/audio/signals'

// Reproducible synthetic accuracy cases. Runtime measurements depend on the
// current machine, JIT and load; they are observations, never physical validation.
const cases = [44100, 48000].flatMap((sampleRate) =>
  openStringFrequencies.flatMap((openFrequency) =>
    [0, 1, 5, 12, 19, 24].map((fret) => {
      const frequency = openFrequency * 2 ** (fret / 12)
      return {
        sampleRate,
        frequency,
        samples: guitarSignal(frequency, sampleRate, 4096, { noise: 0.003, phase: 0.7 }),
      }
    }),
  ),
)
for (let repeat = 0; repeat < 2; repeat++)
  for (const item of cases) detectPitch(item.samples, item.sampleRate)
const times: number[] = []
const centsErrors: number[] = []
let rejected = 0
for (let repeat = 0; repeat < 5; repeat++) {
  for (const item of cases) {
    const start = performance.now()
    const result = detectPitch(item.samples, item.sampleRate)
    times.push(performance.now() - start)
    if (result.status !== 'detected' || result.frequency === null) rejected++
    else centsErrors.push(Math.abs(1200 * Math.log2(result.frequency / item.frequency)))
  }
}
let noiseFalsePositives = 0
for (let seed = 1; seed <= 100; seed++) {
  const random = seededNoise(seed)
  const samples = Float32Array.from({ length: 4096 }, () => random() * 0.2)
  if (detectPitch(samples, 48000).status === 'detected') noiseFalsePositives++
}
times.sort((a, b) => a - b)
console.log(
  JSON.stringify(
    {
      kind: 'synthetic-only',
      algorithm: 'downsampled YIN',
      runtime: process.version,
      sampleRates: [44100, 48000],
      frameSamples: 4096,
      frameDurationMsAt48kHz: (4096 / 48000) * 1000,
      noteCases: cases.length,
      measuredFrames: times.length,
      rejectedFrames: rejected,
      meanAbsoluteCents: centsErrors.reduce((sum, value) => sum + value, 0) / centsErrors.length,
      maxAbsoluteCents: Math.max(...centsErrors),
      meanAnalysisMs: times.reduce((sum, value) => sum + value, 0) / times.length,
      p95AnalysisMs: times[Math.floor(times.length * 0.95)],
      maxAnalysisMs: times[times.length - 1],
      noiseTrials: 100,
      noiseFalsePositives,
      limitations: [
        'Not measured on a physical guitar.',
        'Not validated on Android.',
        'Monophonic notes only; room noise, pickups, inharmonicity and missing fundamentals can affect accuracy.',
      ],
    },
    null,
    2,
  ),
)
if (rejected > 0 || Math.max(...centsErrors) > 10 || noiseFalsePositives > 0) process.exitCode = 1
