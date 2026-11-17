import { detectPitch } from '../pitch/detector'

interface AnalyzeMessage {
  samples: Float32Array
  sampleRate: number
  timestamp: number
  noiseFloor: number
}

// Separate module scope keeps worker globals out of main-thread application code.
self.onmessage = (event: MessageEvent<AnalyzeMessage>) => {
  const { samples, sampleRate, timestamp, noiseFloor } = event.data
  self.postMessage(detectPitch(samples, sampleRate, timestamp, noiseFloor))
}
