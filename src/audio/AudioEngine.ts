import type { AudioSnapshot, PitchDetection } from '../types'
import captureWorkletUrl from './capture-worklet.js?url'

/** Owns the local microphone graph. Constructing an engine never requests audio. */
export class AudioEngine {
  private snapshot: AudioSnapshot = Object.freeze({
    status: 'idle',
    detection: null,
    error: null,
    devices: Object.freeze([]) as unknown as MediaDeviceInfo[],
  })
  private listeners = new Set<(snapshot: AudioSnapshot) => void>()
  private stream: MediaStream | null = null
  private context: AudioContext | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private worklet: AudioWorkletNode | null = null
  private worker: Worker | null = null
  private generation = 0
  private busy = false
  private noiseFloor = 0.008
  private lastTimestamp = 0

  subscribe = (listener: (snapshot: AudioSnapshot) => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): AudioSnapshot => this.snapshot

  private update(patch: Partial<AudioSnapshot>) {
    this.snapshot = Object.freeze({ ...this.snapshot, ...patch })
    for (const listener of this.listeners) listener(this.snapshot)
  }

  setNoiseFloor(value: number): void {
    if (Number.isFinite(value)) this.noiseFloor = Math.max(0.001, Math.min(0.2, value))
  }

  async refreshDevices(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return
    try {
      const devices = (await navigator.mediaDevices.enumerateDevices()).filter(
        (device) => device.kind === 'audioinput',
      )
      // Freeze a copy so subscribers cannot mutate a later snapshot's device list.
      this.update({ devices: Object.freeze(devices) as unknown as MediaDeviceInfo[] })
    } catch {
      // Enumeration is optional; capture errors are reported by start().
    }
  }

  private onDeviceChange = () => {
    void this.refreshDevices()
  }

  private release() {
    if (typeof navigator !== 'undefined')
      navigator.mediaDevices?.removeEventListener('devicechange', this.onDeviceChange)
    if (this.worklet) {
      this.worklet.port.onmessage = null
      this.worklet.onprocessorerror = null
      this.worklet.port.close()
      this.worklet.disconnect()
    }
    this.source?.disconnect()
    this.worker?.terminate()
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.onended = null
        track.stop()
      }
    }
    const context = this.context
    if (context) {
      context.onstatechange = null
      if (context.state !== 'closed') void context.close().catch(() => {})
    }
    this.worklet = null
    this.source = null
    this.worker = null
    this.stream = null
    this.context = null
    this.busy = false
  }

  stop(): void {
    this.generation++
    this.release()
    this.update({ status: 'idle', detection: null, error: null })
  }

  private fail(generation: number, message: string) {
    if (generation !== this.generation) return
    this.generation++
    this.release()
    this.update({ status: 'error', detection: null, error: message })
  }

  async start(deviceId?: string): Promise<void> {
    this.stop()
    const generation = this.generation
    this.update({ status: 'requesting', error: null })
    try {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices?.getUserMedia ||
        typeof AudioContext === 'undefined' ||
        typeof AudioWorkletNode === 'undefined' ||
        typeof Worker === 'undefined'
      ) {
        throw new Error(
          'Microphone capture needs a browser with AudioWorklet support on HTTPS or localhost.',
        )
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
          channelCount: { ideal: 1 },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      })
      if (generation !== this.generation) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      this.stream = stream
      for (const track of stream.getAudioTracks()) {
        track.onended = () =>
          this.fail(
            generation,
            'The microphone was disconnected. Reconnect it and start listening again.',
          )
      }
      if (
        stream.getAudioTracks().length === 0 ||
        stream.getAudioTracks().some((track) => track.readyState === 'ended')
      ) {
        throw new Error(
          'The microphone stopped before capture could begin. Connect an input and try again.',
        )
      }
      const context = new AudioContext({ latencyHint: 'interactive' })
      this.context = context
      await context.audioWorklet.addModule(captureWorkletUrl)
      if (generation !== this.generation) return
      const worker = new Worker(new URL('./dsp-worker.ts', import.meta.url), { type: 'module' })
      this.worker = worker
      const source = context.createMediaStreamSource(stream)
      this.source = source
      const worklet = new AudioWorkletNode(context, 'guitar-capture', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      })
      this.worklet = worklet
      worker.onmessage = (event: MessageEvent<PitchDetection>) => {
        if (generation !== this.generation) return
        this.busy = false
        this.update({ detection: Object.freeze(event.data) })
      }
      worker.onerror = () =>
        this.fail(generation, 'Audio analysis stopped. Restart the microphone to try again.')
      worker.onmessageerror = () =>
        this.fail(
          generation,
          'Audio analysis could not read a captured frame. Restart the microphone.',
        )
      worklet.onprocessorerror = () =>
        this.fail(generation, 'Audio capture stopped. Restart the microphone to try again.')
      worklet.port.onmessage = (
        event: MessageEvent<{ samples: Float32Array; endTime: number }>,
      ) => {
        if (generation !== this.generation || this.busy || context.state !== 'running') return
        this.busy = true
        // Map the AudioContext clock onto performance.now(), preserving the
        // frame end time even if message delivery is briefly delayed.
        const timestamp = Math.max(
          this.lastTimestamp,
          performance.now() - Math.max(0, context.currentTime - event.data.endTime) * 1000,
        )
        this.lastTimestamp = timestamp
        worker.postMessage(
          {
            samples: event.data.samples,
            sampleRate: context.sampleRate,
            timestamp,
            noiseFloor: this.noiseFloor,
          },
          [event.data.samples.buffer],
        )
      }
      context.onstatechange = () => {
        if (context.state === 'closed')
          this.fail(generation, 'The audio session closed. Start the microphone again.')
        else if (context.state !== 'running' && this.snapshot.status === 'listening')
          this.fail(generation, 'The audio session was interrupted. Start the microphone again.')
      }
      source.connect(worklet)
      // Worklet outputs are untouched (silence). Connecting the silent output
      // keeps capture scheduled; microphone samples never reach the speakers.
      worklet.connect(context.destination)
      await context.resume()
      if (generation !== this.generation) return
      navigator.mediaDevices.addEventListener('devicechange', this.onDeviceChange)
      this.update({ status: 'listening', error: null })
      await this.refreshDevices()
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Could not open the microphone.'
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError')
          message =
            'Microphone access was denied. Allow microphone access in your browser, then try again.'
        else if (error.name === 'NotFoundError')
          message = 'No microphone was found. Connect an input device and try again.'
        else if (error.name === 'NotReadableError')
          message = 'The microphone is unavailable or in use by another application.'
        else if (error.name === 'OverconstrainedError')
          message = 'The selected microphone is no longer available. Choose another input.'
      }
      this.fail(generation, message)
    }
  }
}
