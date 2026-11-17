import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Mic, RotateCcw } from 'lucide-react'
import { createSession, evaluateDetection, sessionAccuracy } from '../evaluation/lessonEngine'
import type { Lesson, PitchDetection } from '../types'
import { chordNotes, chords, type ChordShape } from './chords'
import './chords.css'

function Diagram({ chord }: { chord: ChordShape }) {
  return (
    <svg
      viewBox="0 0 240 265"
      className="chord-diagram"
      role="img"
      aria-label={`${chord.name}: low to high strings ${chord.frets.map((f) => (f === null ? 'muted' : f === 0 ? 'open' : `fret ${f}`)).join(', ')}`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <line
          key={`f${i}`}
          x1="35"
          x2="205"
          y1={55 + i * 43}
          y2={55 + i * 43}
          stroke="currentColor"
          opacity={i === 0 ? 0.8 : 0.2}
          strokeWidth={i === 0 ? 5 : 1}
        />
      ))}
      {chord.frets.map((fret, i) => (
        <g key={i}>
          <line
            x1={35 + i * 34}
            x2={35 + i * 34}
            y1="55"
            y2="227"
            stroke="currentColor"
            opacity=".3"
            strokeWidth={1 + (5 - i) * 0.25}
          />
          {fret === null || fret === 0 ? (
            <text x={35 + i * 34} y="34" textAnchor="middle" fill="currentColor" fontSize="17">
              {fret === null ? '×' : '○'}
            </text>
          ) : (
            <g>
              <circle
                cx={35 + i * 34}
                cy={55 + (fret - 0.5) * 43}
                r="13"
                fill="var(--amber, #f4b66a)"
              />
              <text
                x={35 + i * 34}
                y={60 + (fret - 0.5) * 43}
                textAnchor="middle"
                fill="#171b18"
                fontSize="13"
                fontWeight="700"
              >
                {chord.fingers[i]}
              </text>
            </g>
          )}
          <text
            x={35 + i * 34}
            y="252"
            textAnchor="middle"
            fill="currentColor"
            opacity=".5"
            fontSize="12"
          >
            {6 - i}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default function ChordTrainer({
  detection,
  listening,
  onStartMicrophone,
}: {
  detection: PitchDetection | null
  listening: boolean
  onStartMicrophone: () => void
}) {
  const [selected, setSelected] = useState(0)
  const chord = chords[selected]
  const lesson: Lesson = useMemo(
    () => ({
      id: `chord-${chord.id}`,
      title: chord.name,
      subtitle: 'Arpeggiated verification',
      module: 'Chords',
      duration: 3,
      objectives: ['Hear each string clearly'],
      instructions: [chord.tip],
      notes: chordNotes(chord),
      passingAccuracy: 0.8,
    }),
    [chord],
  )
  const [session, setSession] = useState(() => createSession(lesson))
  const [startedAt, setStartedAt] = useState(() => performance.now())
  useEffect(() => {
    // This prop is a frame from the external microphone stream; accumulate it once.
    if (detection && listening && detection.timestamp >= startedAt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSession((previous) =>
        previous.lessonId === lesson.id ? evaluateDetection(previous, lesson, detection) : previous,
      )
    }
  }, [detection, listening, lesson, startedAt])
  function choose(index: number, timestamp: number) {
    setStartedAt(timestamp)
    setSelected(index)
    const next = chords[index]
    setSession(createSession({ ...lesson, id: `chord-${next.id}`, notes: chordNotes(next) }))
  }
  return (
    <div className="chord-trainer">
      <div className="chord-picker" aria-label="Choose a chord">
        {chords.map((shape, index) => (
          <button
            key={shape.id}
            className={index === selected ? 'selected' : ''}
            onClick={(event) => choose(index, event.timeStamp)}
            aria-pressed={index === selected}
          >
            <strong>{shape.symbol}</strong>
            <span>{shape.name}</span>
          </button>
        ))}
      </div>
      <div className="chord-layout">
        <section className="chord-card">
          <span className="tool-eyebrow">FINGER BY FINGER</span>
          <h2>{chord.name}</h2>
          <Diagram chord={chord} />
          <p>{chord.tip}</p>
        </section>
        <section className="chord-card chord-check">
          <span className="tool-eyebrow">ARPEGGIATED CHECK</span>
          <h2>Give every string a voice.</h2>
          <p>
            Hold the shape, then pluck each indicated string from low to high. Let it fall quiet
            between notes.
          </p>
          <div className="chord-sequence">
            {lesson.notes.map((note, i) => (
              <div
                key={i}
                className={i < session.index ? 'done' : i === session.index ? 'current' : ''}
              >
                <span>{i < session.index ? '✓' : i + 1}</span>
                <div>
                  <strong>String {note.string}</strong>
                  <small>{note.fret === 0 ? 'Open' : `Fret ${note.fret}`}</small>
                </div>
                {i === session.index && !session.completed && <ArrowRight size={18} />}
              </div>
            ))}
          </div>
          {!listening && (
            <button className="tool-primary" onClick={onStartMicrophone}>
              <Mic size={17} /> Enable microphone
            </button>
          )}
          <p role="status" className="chord-result">
            {session.completed
              ? `Sequence checked · ${Math.round(sessionAccuracy(session) * 100)}% note accuracy`
              : session.lastOutcome === 'incorrect'
                ? 'A different pitch was heard. Check the highlighted string.'
                : listening
                  ? 'Listening for the highlighted string…'
                  : 'Microphone off. Explore the diagram or connect to check notes.'}
          </p>
          <button
            className="tool-secondary"
            onClick={(event) => {
              setStartedAt(event.timeStamp)
              setSession(createSession(lesson))
            }}
          >
            <RotateCcw size={15} /> Try again
          </button>
          <button
            className="tool-secondary"
            onClick={(event) => choose(selected === 0 ? 1 : 0, event.timeStamp)}
          >
            Practice {selected === 0 ? 'Em → Am' : 'Am → Em'} <ArrowRight size={15} />
          </button>
          <p className="tool-footnote">
            Checks successive pitches, not simultaneous chords or finger placement. Transition
            checks are untimed. Chord results are shown here for this visit.
          </p>
        </section>
      </div>
    </div>
  )
}
