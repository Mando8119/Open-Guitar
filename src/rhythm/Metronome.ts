/** Audio clock scheduling stays independent of repaint cadence. */
export class Metronome {
  private context: AudioContext | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private nextTime = 0
  private step = 0
  private generation = 0
  bpm = 80
  beatsPerBar = 4
  sound = false
  onInterrupted: (() => void) | null = null
  async start(bpm: number, beatsPerBar: number, sound: boolean): Promise<number> {
    this.stop()
    const generation = this.generation
    this.bpm = bpm
    this.beatsPerBar = beatsPerBar
    this.sound = sound
    const context = new AudioContext()
    this.context = context
    try {
      await context.resume()
    } catch (error) {
      this.stop()
      throw error
    }
    if (generation !== this.generation) {
      void context.close().catch(() => {})
      throw new Error('Metronome start cancelled')
    }
    this.nextTime = context.currentTime + 0.15
    const origin = performance.now() + 150
    this.step = 0
    context.onstatechange = () => {
      if (context.state !== 'running' && this.timer) {
        this.stop()
        this.onInterrupted?.()
      }
    }
    const schedule = () => {
      // Timer throttling must not replay clicks that are already in the past.
      if (this.nextTime < context.currentTime) {
        const skipped = Math.ceil((context.currentTime - this.nextTime) / (60 / this.bpm))
        this.nextTime += (skipped * 60) / this.bpm
        this.step += skipped
      }
      while (this.nextTime < context.currentTime + 0.12) {
        if (this.sound) {
          const oscillator = context.createOscillator()
          const gain = context.createGain()
          oscillator.frequency.value = this.step % this.beatsPerBar === 0 ? 1100 : 760
          gain.gain.setValueAtTime(0, this.nextTime)
          gain.gain.linearRampToValueAtTime(0.09, this.nextTime + 0.002)
          gain.gain.exponentialRampToValueAtTime(0.0001, this.nextTime + 0.04)
          oscillator.connect(gain)
          gain.connect(context.destination)
          oscillator.start(this.nextTime)
          oscillator.stop(this.nextTime + 0.045)
          oscillator.onended = () => {
            oscillator.disconnect()
            gain.disconnect()
          }
        }
        this.nextTime += 60 / this.bpm
        this.step++
      }
    }
    schedule()
    this.timer = setInterval(schedule, 25)
    return origin
  }
  stop() {
    this.generation++
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    if (this.context) {
      this.context.onstatechange = null
      void this.context.close().catch(() => {})
    }
    this.context = null
  }
}
