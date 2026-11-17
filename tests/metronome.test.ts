import { afterEach, describe, expect, it, vi } from 'vitest'
import { Metronome } from '../src/rhythm/Metronome'

class TestAudioContext {
  static instances: TestAudioContext[] = []
  static resumeGate: Promise<void> | null = null
  currentTime = 0
  state = 'running'
  onstatechange: (() => void) | null = null
  destination = {}
  starts: number[] = []
  close = vi.fn(async () => {
    this.state = 'closed'
  })
  constructor() {
    TestAudioContext.instances.push(this)
  }
  async resume() {
    if (TestAudioContext.resumeGate) await TestAudioContext.resumeGate
  }
  createOscillator() {
    return {
      frequency: { value: 0 },
      connect() {},
      disconnect() {},
      start: (time: number) => this.starts.push(time),
      stop() {},
      onended: null,
    }
  }
  createGain() {
    return {
      gain: {
        setValueAtTime() {},
        linearRampToValueAtTime() {},
        exponentialRampToValueAtTime() {},
      },
      connect() {},
      disconnect() {},
    }
  }
}
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  TestAudioContext.instances = []
  TestAudioContext.resumeGate = null
})

describe('metronome real-time lifecycle', () => {
  it('skips expired clicks after scheduling stalls', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('AudioContext', TestAudioContext)
    const metronome = new Metronome()
    await metronome.start(60, 4, true)
    const context = TestAudioContext.instances[0]
    context.currentTime = 5.1
    vi.advanceTimersByTime(25)
    expect(context.starts.length).toBeGreaterThan(0)
    expect(context.starts.every((time) => time >= context.currentTime)).toBe(true)
    metronome.stop()
    expect(context.close).toHaveBeenCalledOnce()
  })
  it('stops and reports interrupted audio instead of grading against a stale clock', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('AudioContext', TestAudioContext)
    const metronome = new Metronome()
    const interrupted = vi.fn()
    metronome.onInterrupted = interrupted
    await metronome.start(80, 4, false)
    const context = TestAudioContext.instances[0]
    context.state = 'suspended'
    context.onstatechange?.()
    expect(interrupted).toHaveBeenCalledOnce()
    expect(context.close).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('cannot activate a pending start after stop', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('AudioContext', TestAudioContext)
    let release!: () => void
    TestAudioContext.resumeGate = new Promise<void>((resolve) => {
      release = resolve
    })
    const metronome = new Metronome()
    const pending = metronome.start(80, 4, true)
    metronome.stop()
    release()
    await expect(pending).rejects.toThrow('cancelled')
    expect(vi.getTimerCount()).toBe(0)
  })
})
