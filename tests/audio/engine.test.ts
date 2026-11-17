import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AudioEngine } from '../../src/audio/AudioEngine'
import type { PitchDetection } from '../../src/types'

class FakeTrack {
  onended: (() => void) | null = null
  readyState = 'live'
  stop = vi.fn(() => {
    this.readyState = 'ended'
  })
}
class FakeStream {
  track = new FakeTrack()
  getTracks() {
    return [this.track]
  }
  getAudioTracks() {
    return [this.track]
  }
}
class FakeContext {
  static instances: FakeContext[] = []
  static moduleGate: Promise<void> | null = null
  state = 'suspended'
  sampleRate = 48000
  currentTime = 1
  destination = {}
  onstatechange: (() => void) | null = null
  audioWorklet = {
    addModule: vi.fn(async () => {
      await FakeContext.moduleGate
    }),
  }
  source = { connect: vi.fn(), disconnect: vi.fn() }
  createMediaStreamSource = vi.fn(() => this.source)
  resume = vi.fn(async () => {
    this.state = 'running'
  })
  close = vi.fn(async () => {
    this.state = 'closed'
  })
  constructor() {
    FakeContext.instances.push(this)
  }
}
class FakeWorklet {
  static instances: FakeWorklet[] = []
  onprocessorerror: (() => void) | null = null
  port = { onmessage: null as ((event: { data: unknown }) => void) | null, close: vi.fn() }
  connect = vi.fn()
  disconnect = vi.fn()
  constructor() {
    FakeWorklet.instances.push(this)
  }
}
class FakeWorker {
  static instances: FakeWorker[] = []
  onmessage: ((event: { data: unknown }) => void) | null = null
  onerror: (() => void) | null = null
  onmessageerror: (() => void) | null = null
  postMessage = vi.fn()
  terminate = vi.fn()
  constructor() {
    FakeWorker.instances.push(this)
  }
}

const engines: AudioEngine[] = []
let stream: FakeStream
let media: {
  getUserMedia: ReturnType<typeof vi.fn>
  enumerateDevices: ReturnType<typeof vi.fn>
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
}
function createEngine() {
  const engine = new AudioEngine()
  engines.push(engine)
  return engine
}
beforeEach(() => {
  FakeContext.instances = []
  FakeContext.moduleGate = null
  FakeWorklet.instances = []
  FakeWorker.instances = []
  stream = new FakeStream()
  media = {
    getUserMedia: vi.fn(async () => stream),
    enumerateDevices: vi.fn(async () => [
      { kind: 'audioinput', deviceId: 'usb' },
      { kind: 'audiooutput', deviceId: 'speaker' },
    ]),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  vi.stubGlobal('navigator', { mediaDevices: media })
  vi.stubGlobal('AudioContext', FakeContext)
  vi.stubGlobal('AudioWorkletNode', FakeWorklet)
  vi.stubGlobal('Worker', FakeWorker)
})
afterEach(() => {
  engines.splice(0).forEach((engine) => engine.stop())
  vi.unstubAllGlobals()
})

describe('microphone lifecycle', () => {
  it('constructs without prompting and exposes stable immutable snapshots', async () => {
    const engine = createEngine()
    expect(media.getUserMedia).not.toHaveBeenCalled()
    const snapshot = engine.getSnapshot()
    expect(engine.getSnapshot()).toBe(snapshot)
    expect(Object.isFrozen(snapshot)).toBe(true)
    expect(Object.isFrozen(snapshot.devices)).toBe(true)
    const listener = vi.fn()
    const unsubscribe = engine.subscribe(listener)
    await engine.refreshDevices()
    expect(engine.getSnapshot().devices).toHaveLength(1)
    expect(Object.isFrozen(engine.getSnapshot().devices)).toBe(true)
    expect(snapshot.devices).toHaveLength(0)
    expect(listener).toHaveBeenCalledOnce()
    unsubscribe()
    engine.stop()
    expect(listener).toHaveBeenCalledOnce()
  })

  it('releases permission grants that arrive after stop', async () => {
    let grant!: (stream: FakeStream) => void
    media.getUserMedia.mockImplementation(
      () =>
        new Promise((resolve) => {
          grant = resolve
        }),
    )
    const engine = createEngine()
    const pending = engine.start()
    expect(engine.getSnapshot().status).toBe('requesting')
    engine.stop()
    grant(stream)
    await pending
    expect(stream.track.stop).toHaveBeenCalledOnce()
    expect(FakeContext.instances).toHaveLength(0)
    expect(engine.getSnapshot().status).toBe('idle')
  })

  it('prevents an older permission request replacing a newer capture', async () => {
    const older = new FakeStream()
    let grant!: (stream: FakeStream) => void
    media.getUserMedia.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          grant = resolve
        }),
    )
    const engine = createEngine()
    const pending = engine.start()
    await engine.start('usb')
    grant(older)
    await pending
    expect(older.track.stop).toHaveBeenCalledOnce()
    expect(stream.track.stop).not.toHaveBeenCalled()
    expect(engine.getSnapshot().status).toBe('listening')
    expect(media.getUserMedia.mock.calls[1][0].audio.deviceId).toEqual({ exact: 'usb' })
  })

  it('closes a context when stopped during worklet loading and never creates a worker', async () => {
    let finishLoading!: () => void
    FakeContext.moduleGate = new Promise((resolve) => {
      finishLoading = resolve
    })
    const engine = createEngine()
    const pending = engine.start()
    await Promise.resolve()
    expect(FakeContext.instances).toHaveLength(1)
    engine.stop()
    finishLoading()
    await pending
    expect(stream.track.stop).toHaveBeenCalledOnce()
    expect(FakeContext.instances[0].close).toHaveBeenCalledOnce()
    expect(FakeWorker.instances).toHaveLength(0)
    expect(engine.getSnapshot().status).toBe('idle')
  })

  it('sends worklet frames to a worker, bounds backlog, ignores stale responses, and closes resources', async () => {
    const engine = createEngine()
    engine.setNoiseFloor(0.025)
    await engine.start()
    const context = FakeContext.instances[0]
    const worker = FakeWorker.instances[0]
    const worklet = FakeWorklet.instances[0]
    expect(engine.getSnapshot().status).toBe('listening')
    expect(context.source.connect).toHaveBeenCalledWith(worklet)
    expect(context.source.connect).not.toHaveBeenCalledWith(context.destination)
    worklet.port.onmessage!({ data: { samples: new Float32Array(4096), endTime: 1 } })
    worklet.port.onmessage!({ data: { samples: new Float32Array(4096), endTime: 1 } })
    expect(worker.postMessage).toHaveBeenCalledOnce()
    const message = worker.postMessage.mock.calls[0][0]
    expect(message.noiseFloor).toBe(0.025)
    expect(message.timestamp).toBeGreaterThanOrEqual(0)
    const detection: PitchDetection = {
      frequency: 110,
      midi: 45,
      note: 'A',
      octave: 2,
      cents: 0,
      confidence: 0.99,
      rms: 0.2,
      timestamp: message.timestamp,
      status: 'detected',
    }
    worker.onmessage!({ data: detection })
    expect(engine.getSnapshot().detection).toEqual(detection)
    expect(Object.isFrozen(engine.getSnapshot().detection)).toBe(true)
    worklet.port.onmessage!({ data: { samples: new Float32Array(4096), endTime: 1 } })
    expect(worker.postMessage).toHaveBeenCalledTimes(2)
    const staleMessage = worker.onmessage!
    engine.stop()
    staleMessage({ data: detection })
    expect(engine.getSnapshot().detection).toBeNull()
    expect(engine.getSnapshot().status).toBe('idle')
    expect(stream.track.stop).toHaveBeenCalledOnce()
    expect(context.close).toHaveBeenCalledOnce()
    expect(context.source.disconnect).toHaveBeenCalledOnce()
    expect(worklet.disconnect).toHaveBeenCalledOnce()
    expect(worklet.port.close).toHaveBeenCalledOnce()
    expect(worker.terminate).toHaveBeenCalledOnce()
  })

  it('reports denial without opening an audio context', async () => {
    media.getUserMedia.mockRejectedValue(new DOMException('denied', 'NotAllowedError'))
    const engine = createEngine()
    await engine.start()
    expect(engine.getSnapshot().status).toBe('error')
    expect(engine.getSnapshot().error).toContain('denied')
    expect(FakeContext.instances).toHaveLength(0)
  })

  it('releases capture on microphone disconnection and worker failure', async () => {
    const engine = createEngine()
    await engine.start()
    stream.track.onended!()
    expect(engine.getSnapshot().error).toContain('disconnected')
    expect(stream.track.stop).toHaveBeenCalledOnce()
    stream = new FakeStream()
    await engine.start()
    FakeWorker.instances[1].onerror!()
    expect(engine.getSnapshot().error).toContain('analysis stopped')
    expect(stream.track.stop).toHaveBeenCalledOnce()
  })
})
