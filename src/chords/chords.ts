import type { LessonNote } from '../types'

export interface ChordShape {
  id: string
  name: string
  symbol: string
  frets: (number | null)[]
  fingers: (number | null)[]
  tip: string
}
export const chords: ChordShape[] = [
  {
    id: 'em',
    name: 'E minor',
    symbol: 'Em',
    frets: [0, 2, 2, 0, 0, 0],
    fingers: [null, 2, 3, null, null, null],
    tip: 'Place fingers 2 and 3 just behind the second fret on strings 5 and 4. Let all six strings ring.',
  },
  {
    id: 'am',
    name: 'A minor',
    symbol: 'Am',
    frets: [null, 0, 2, 2, 1, 0],
    fingers: [null, null, 2, 3, 1, null],
    tip: 'Mute the low E. Curve your fingers so the open first string can ring clearly.',
  },
  {
    id: 'c',
    name: 'C major',
    symbol: 'C',
    frets: [null, 3, 2, 0, 1, 0],
    fingers: [null, 3, 2, null, 1, null],
    tip: 'Start your strum on string 5. Keep your first finger clear of the open high E.',
  },
  {
    id: 'g',
    name: 'G major',
    symbol: 'G',
    frets: [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, null, null, null, 3],
    tip: 'Keep a relaxed wrist. Check the three open middle strings one at a time.',
  },
  {
    id: 'd',
    name: 'D major',
    symbol: 'D',
    frets: [null, null, 0, 2, 3, 2],
    fingers: [null, null, null, 1, 3, 2],
    tip: 'Play only strings 4 through 1. Use your fingertips to avoid muting neighboring strings.',
  },
]
const tuning = [40, 45, 50, 55, 59, 64]
export function chordNotes(chord: ChordShape): LessonNote[] {
  return chord.frets.flatMap((fret, index) =>
    fret === null
      ? []
      : [
          {
            midi: tuning[index] + fret,
            string: 6 - index,
            fret,
            label: `String ${6 - index}, ${fret === 0 ? 'open' : `fret ${fret}`}`,
          },
        ],
  )
}
