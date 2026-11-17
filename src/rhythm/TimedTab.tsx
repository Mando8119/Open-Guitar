import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import type { PitchDetection } from '../types'
import { frequencyToNote } from '../pitch/detector'

const sequence = [
  { midi: 64, string: 1, fret: 0 },
  { midi: 65, string: 1, fret: 1 },
  { midi: 67, string: 1, fret: 3 },
  { midi: 65, string: 1, fret: 1 },
  { midi: 64, string: 1, fret: 0 },
  { midi: 62, string: 2, fret: 3 },
  { midi: 60, string: 2, fret: 1 },
  { midi: 59, string: 2, fret: 0 },
]
type Outcome = 'hit' | 'wrong' | 'missed' | null
export default function TimedTab({
  detection,
  listening,
  onStartMicrophone,
}: {
  detection: PitchDetection | null
  listening: boolean
  onStartMicrophone: () => void
}) {
  const [bpm, setBpm] = useState(60)
  const [running, setRunning] = useState(false)
  const [position, setPosition] = useState(0)
  const [outcomes, setOutcomes] = useState<Outcome[]>(sequence.map(() => null))
  const clock = useRef({
    origin: 0,
    elapsed: 0,
    lastPitch: null as number | null,
    lastAt: -Infinity,
    resumedAt: 0,
    requireRelease: false,
  })
  const completed = outcomes.every((outcome) => outcome !== null)
  const period = 60_000 / bpm
  const tolerance = Math.min(240, period * 0.25)
  useEffect(() => {
    if (!running) return
    let frame: number
    const tick = () => {
      const elapsed = performance.now() - clock.current.origin
      setPosition(elapsed / period)
      setOutcomes((previous) =>
        previous.map((value, i) =>
          value === null && elapsed > (i + 2) * period + tolerance ? 'missed' : value,
        ),
      )
      // Allow bounded Worker delivery time before finalizing the summary.
      if (elapsed > (sequence.length + 1) * period + tolerance + 500) {
        setRunning(false)
        clock.current.elapsed = elapsed
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, period, tolerance])
  useEffect(() => {
    if (!running || !listening || !detection) return
    if (detection.timestamp < clock.current.resumedAt) return
    if (detection.status === 'silence') {
      clock.current.lastPitch = null
      clock.current.requireRelease = false
      return
    }
    if (clock.current.requireRelease) return
    if (
      detection.status !== 'detected' ||
      detection.confidence < 0.85 ||
      detection.midi === null ||
      Math.abs(detection.cents ?? 100) > 40
    )
      return
    const timestamp = detection.timestamp
    if (clock.current.lastPitch === detection.midi || timestamp - clock.current.lastAt < 220) return
    clock.current.lastPitch = detection.midi
    clock.current.lastAt = timestamp
    const elapsed = timestamp - clock.current.origin
    const index = Math.round(elapsed / period) - 2
    if (
      index >= 0 &&
      index < sequence.length &&
      Math.abs(elapsed - (index + 2) * period) <= tolerance
    ) {
      // Captured-in-time frames may reconcile a provisional RAF-marked miss.
      setOutcomes((previous) =>
        previous.map((value, i) =>
          i === index && (value === null || value === 'missed')
            ? detection.midi === sequence[i].midi
              ? 'hit'
              : 'wrong'
            : value,
        ),
      )
    }
  }, [running, listening, detection, period, tolerance])
  function reset() {
    setRunning(false)
    setPosition(0)
    setOutcomes(sequence.map(() => null))
    clock.current = {
      origin: 0,
      elapsed: 0,
      lastPitch: null,
      lastAt: -Infinity,
      resumedAt: 0,
      requireRelease: false,
    }
  }
  function toggle() {
    if (running) {
      clock.current.elapsed = performance.now() - clock.current.origin
      setRunning(false)
    } else {
      const now = performance.now()
      clock.current.requireRelease = clock.current.elapsed > 0
      clock.current.resumedAt = now
      clock.current.origin = now - clock.current.elapsed
      setRunning(true)
    }
  }
  return (
    <section className="rhythm-card timed-tab">
      <span className="tool-eyebrow">ORIGINAL MELODY · FIRST LIGHT</span>
      <h2>Let the notes come to you.</h2>
      <p>
        Play when each fret reaches the amber line. Two beats to settle in, then eight notes on
        strings 1 and 2.
      </p>
      <div
        className="tab-viewport"
        role="img"
        aria-label={`Timed six-string tablature: ${sequence.map((note) => `string ${note.string} fret ${note.fret}`).join(', ')}`}
      >
        <div className="tab-playhead" />
        {[1, 2, 3, 4, 5, 6].map((string, index) => (
          <div className="timed-string" key={string} style={{ top: `${22 + index * 28}px` }}>
            <span>{['e', 'B', 'G', 'D', 'A', 'E'][index]}</span>
          </div>
        ))}
        {sequence.map((note, index) => (
          <span
            key={index}
            className={`timed-fret ${outcomes[index] ?? ''}`}
            style={{
              left: `${100 + (index + 2 - position) * 86}px`,
              top: `${10 + (note.string - 1) * 28}px`,
            }}
          >
            {note.fret}
          </span>
        ))}
      </div>
      <div className="timed-note-list">
        {sequence.map((note, i) => {
          const converted = frequencyToNote(440 * 2 ** ((note.midi - 69) / 12))
          return (
            <span key={i} className={outcomes[i] ?? ''}>
              {converted.note}
              {converted.octave}
              {outcomes[i] === 'hit'
                ? ' ✓'
                : outcomes[i] === 'missed'
                  ? ' —'
                  : outcomes[i] === 'wrong'
                    ? ' ×'
                    : ''}
            </span>
          )
        })}
      </div>
      <div className="rhythm-actions">
        <button className="tool-primary" disabled={completed} onClick={toggle}>
          {running ? <Pause size={16} /> : <Play size={16} />}{' '}
          {running ? 'Pause melody' : position > 0 ? 'Resume melody' : 'Start melody'}
        </button>
        <button className="tool-secondary" onClick={reset}>
          <RotateCcw size={16} /> Restart melody
        </button>
        <label>
          Speed{' '}
          <select
            aria-label="Melody speed"
            value={bpm}
            disabled={running || position > 0}
            onChange={(event) => setBpm(Number(event.target.value))}
          >
            <option value={40}>Slow · 40 BPM</option>
            <option value={60}>Steady · 60 BPM</option>
            <option value={80}>Flow · 80 BPM</option>
          </select>
        </label>
        {!listening && (
          <button className="tool-secondary" onClick={onStartMicrophone}>
            Enable microphone
          </button>
        )}
      </div>
      <p role="status">
        {completed
          ? `${outcomes.filter((v) => v === 'hit').length} / ${sequence.length} notes matched in time · ${outcomes.filter((v) => v === 'missed').length} missed.`
          : 'Pitch and timing are checked together. Mute before playing after a pause. No microphone means no earned hits.'}
      </p>
      <p className="tool-footnote">
        An original practice phrase. Results stay in this view. Timing windows are ±{tolerance} ms;
        system input latency is not calibrated.
      </p>
    </section>
  )
}
