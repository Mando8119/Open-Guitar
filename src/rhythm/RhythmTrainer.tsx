import { useCallback, useEffect, useRef, useState } from 'react'
import { Hand, Mic, Play, Square } from 'lucide-react'
import type { PitchDetection } from '../types'
import { Metronome } from './Metronome'
import { LevelOnsetDetector, nearestBeatError, timingGrade } from './timing'
import TimedTab from './TimedTab'
import './rhythm.css'

export default function RhythmTrainer({
  detection,
  listening,
  onStartMicrophone,
  soundEnabled,
}: {
  detection: PitchDetection | null
  listening: boolean
  onStartMicrophone: () => void
  soundEnabled: boolean
}) {
  const [bpm, setBpm] = useState(80)
  const [beats, setBeats] = useState(4)
  const [origin, setOrigin] = useState<number | null>(null)
  const [beat, setBeat] = useState(-1)
  const [errors, setErrors] = useState<{ value: number; source: string }[]>([])
  const [input, setInput] = useState<'tap' | 'microphone'>('tap')
  const [error, setError] = useState('')
  const metronome = useRef(new Metronome())
  const onset = useRef(new LevelOnsetDetector())
  const [starting, setStarting] = useState(false)
  useEffect(() => {
    const instance = metronome.current
    instance.onInterrupted = () => {
      setOrigin(null)
      setBeat(-1)
      setError('Audio was interrupted. Restart the metronome to realign the beat.')
    }
    return () => {
      instance.onInterrupted = null
      instance.stop()
    }
  }, [])
  useEffect(() => {
    if (origin === null) return
    let frame = 0
    const tick = () => {
      setBeat(Math.max(-1, Math.floor((performance.now() - origin) / (60_000 / bpm))))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [origin, bpm])
  const record = useCallback(
    (timestamp: number, source: string) => {
      if (origin === null || timestamp < origin) return
      setErrors((previous) => [
        ...previous.slice(-31),
        { value: nearestBeatError(timestamp, origin, bpm), source },
      ])
    },
    [origin, bpm],
  )
  useEffect(() => {
    if (
      origin === null ||
      input !== 'microphone' ||
      !listening ||
      !detection ||
      detection.timestamp < origin
    )
      return
    const isOnset = onset.current.process(detection.rms, detection.timestamp)
    if (isOnset && detection.status === 'detected' && detection.confidence >= 0.9)
      record(detection.timestamp, 'Microphone')
  }, [detection, listening, input, record, origin])
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (
        event.code !== 'Space' ||
        event.repeat ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement ||
        event.target instanceof HTMLButtonElement
      )
        return
      if (input === 'tap' && origin !== null) {
        event.preventDefault()
        record(performance.now(), 'Tap')
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [record, input, origin])
  async function start() {
    setStarting(true)
    setError('')
    setErrors([])
    onset.current.reset()
    try {
      setOrigin(await metronome.current.start(bpm, beats, soundEnabled && input === 'tap'))
    } catch {
      setError('Could not start audio. Try starting the metronome again.')
    } finally {
      setStarting(false)
    }
  }
  function stop() {
    metronome.current.stop()
    setOrigin(null)
    setBeat(-1)
  }
  const last = errors.at(-1)
  return (
    <div className="rhythm-tools">
      <section className="rhythm-card">
        <div className="rhythm-heading">
          <div>
            <span className="tool-eyebrow">MAKE SPACE FOR THE BEAT</span>
            <h2>A steady little habit.</h2>
          </div>
          <span className="rhythm-bpm">
            {bpm}
            <small>BPM</small>
          </span>
        </div>
        <div className="rhythm-controls">
          <label>
            Tempo{' '}
            <input
              aria-label="Tempo"
              type="range"
              min="40"
              max="180"
              value={bpm}
              disabled={origin !== null || starting}
              onChange={(event) => setBpm(Number(event.target.value))}
            />
          </label>
          <label>
            Time signature{' '}
            <select
              aria-label="Time signature"
              value={beats}
              disabled={origin !== null || starting}
              onChange={(event) => setBeats(Number(event.target.value))}
            >
              <option value={4}>4 / 4</option>
              <option value={3}>3 / 4</option>
              <option value={6}>6 / 8</option>
            </select>
          </label>
          <label>
            Input{' '}
            <select
              aria-label="Rhythm input"
              value={input}
              disabled={origin !== null || starting}
              onChange={(event) => setInput(event.target.value as 'tap' | 'microphone')}
            >
              <option value="tap">Tap / spacebar</option>
              <option value="microphone">Microphone onsets</option>
            </select>
          </label>
        </div>
        <div
          className="beat-lights"
          aria-label={`Beat ${beat < 0 ? 'waiting' : (beat % beats) + 1}`}
          role="status"
        >
          {Array.from({ length: beats }, (_, i) => (
            <span key={i} className={beat >= 0 && beat % beats === i ? 'active' : ''}>
              {i + 1}
            </span>
          ))}
        </div>
        <div className="rhythm-actions">
          {origin === null ? (
            <button className="tool-primary" disabled={starting} onClick={() => void start()}>
              <Play size={16} />
              {starting ? 'Starting…' : 'Start metronome'}
            </button>
          ) : (
            <button className="tool-secondary" onClick={stop}>
              <Square size={16} /> Stop
            </button>
          )}
          {input === 'tap' && (
            <button
              className="rhythm-tap"
              disabled={origin === null}
              onClick={() => record(performance.now(), 'Tap')}
            >
              <Hand size={18} /> Tap the beat
            </button>
          )}
          {input === 'microphone' && !listening && (
            <button className="tool-secondary" onClick={onStartMicrophone}>
              <Mic size={16} /> Enable microphone
            </button>
          )}
        </div>
        {error && <p role="alert">{error}</p>}
        <p className="rhythm-feedback" role="status">
          {last
            ? `${last.source} · ${Math.round(Math.abs(last.value))} ms ${timingGrade(last.value) === 'on-time' ? 'from the beat · on time' : last.value < 0 ? 'early' : 'late'}`
            : origin !== null
              ? 'Settle in, then play or tap on the beat.'
              : 'Choose your tempo and start. Timing feedback comes from your input.'}
        </p>
        <div className="timing-track" aria-label="Recent timing offsets">
          <span>EARLY</span>
          <div className="timing-center" />
          {errors.map((value, index) => (
            <i
              key={index}
              title={`${Math.round(value.value)} ms`}
              style={{
                left: `${50 + Math.max(-45, Math.min(45, value.value / 6))}%`,
                opacity: 0.2 + (0.8 * (index + 1)) / errors.length,
              }}
            />
          ))}
          <span>LATE</span>
        </div>
        <p className="tool-footnote">
          {input === 'microphone'
            ? 'Experimental level-rise timing for clear single notes. Uncertain/noise frames receive no timing feedback. Audible clicks are disabled in microphone mode. Capture-window and device latency affect results; this is not a polyphonic strumming evaluator.'
            : `Visual metronome${soundEnabled ? ' with audio clicks' : '; enable sound in Settings for audio clicks'}. Taps within ±120 ms count as on time. 6/8 counts six eighth-note pulses; the tempo sets pulses per minute.`}{' '}
          Results stay in this practice view.
        </p>
      </section>
      <TimedTab detection={detection} listening={listening} onStartMicrophone={onStartMicrophone} />
    </div>
  )
}
