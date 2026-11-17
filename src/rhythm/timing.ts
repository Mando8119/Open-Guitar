export function nearestBeatError(
  timestamp: number,
  origin: number,
  bpm: number,
  subdivision = 1,
): number {
  const period = 60_000 / bpm / subdivision
  const elapsed = timestamp - origin
  return elapsed - Math.round(elapsed / period) * period
}
export function timingGrade(errorMs: number, toleranceMs = 120): 'on-time' | 'early' | 'late' {
  return Math.abs(errorMs) <= toleranceMs ? 'on-time' : errorMs < 0 ? 'early' : 'late'
}

export class LevelOnsetDetector {
  private previous = 0
  private lastOnset = -Infinity
  process(rms: number, timestamp: number): boolean {
    const triggered =
      rms >= 0.015 &&
      rms > Math.max(0.008, this.previous * 1.8) &&
      timestamp - this.lastOnset >= 200
    this.previous = rms
    if (triggered) this.lastOnset = timestamp
    return triggered
  }
  reset() {
    this.previous = 0
    this.lastOnset = -Infinity
  }
}
