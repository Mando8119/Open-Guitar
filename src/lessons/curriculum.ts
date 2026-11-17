import type { Lesson, LessonNote } from '../types'

const note = (midi: number, string: number, fret: number, label: string): LessonNote => ({
  midi,
  string,
  fret,
  label,
})
const E = note(40, 6, 0, 'E2'),
  A = note(45, 5, 0, 'A2'),
  D = note(50, 4, 0, 'D3')
const G = note(55, 3, 0, 'G3'),
  B = note(59, 2, 0, 'B3'),
  e = note(64, 1, 0, 'E4')
const F = note(65, 1, 1, 'F4'),
  Fs = note(66, 1, 2, 'F♯4'),
  g = note(67, 1, 3, 'G4')

export const lessons: Lesson[] = [
  {
    id: 'first-clear-note',
    title: 'Your first clear note',
    subtitle: 'Meet the low E string',
    module: 'Foundations',
    duration: 3,
    objectives: [
      'Identify string 6, the thickest string.',
      'Make four separate, clear open E notes.',
    ],
    instructions: [
      'Use standard E A D G B E tuning before starting.',
      'Rest your picking hand near the bridge. Pluck only the thickest string without fretting.',
      'Let the note sound, then gently mute it before the next pluck. Aim for at least 80% accuracy.',
    ],
    notes: [E, E, E, E],
    passingAccuracy: 0.8,
  },
  {
    id: 'open-string-map',
    title: 'The open-string map',
    subtitle: 'Six strings, six voices',
    module: 'Open strings',
    duration: 5,
    objectives: [
      'Find all six strings by number.',
      'Move from low E to high E with one clean note per string.',
    ],
    instructions: [
      'String numbers count from the thinnest string: high E is 1; low E is 6.',
      'Play the displayed open string without pressing a fret.',
      'Keep neighboring strings quiet. Complete the six targets with at least 80% accuracy.',
    ],
    notes: [E, A, D, G, B, e],
    passingAccuracy: 0.8,
  },
  {
    id: 'first-frets',
    title: 'A finger on the fretboard',
    subtitle: 'E, F, F♯ and G',
    module: 'Fretting',
    duration: 5,
    objectives: ['Place a fingertip just behind a fret.', 'Play frets 0–3 on the thinnest string.'],
    instructions: [
      'Use the thinnest string throughout. Keep your thumb relaxed behind the neck.',
      'For fretted notes, press just behind the metal fret toward the headstock. Use only enough pressure for a clear sound.',
      'Play open E, then frets 1, 2 and 3, then return. Finish with at least 80% accuracy.',
    ],
    notes: [e, F, Fs, g, Fs, F, e],
    passingAccuracy: 0.8,
  },
  {
    id: 'string-crossing',
    title: 'Crossing the strings',
    subtitle: 'A steady route between neighbors',
    module: 'String transitions',
    duration: 4,
    objectives: [
      'Switch between adjacent strings with control.',
      'Mute each note before returning to the same pitch.',
    ],
    instructions: [
      'Use open strings 3, 2 and 1: G, B and high E.',
      'Move your pick a small distance. Let your hand stay relaxed.',
      'Follow the route up and back. Each target needs a separate note; aim for at least 85% accuracy.',
    ],
    notes: [G, B, e, B, G, B, e, B],
    passingAccuracy: 0.85,
  },
  {
    id: 'little-lantern',
    title: 'Little lantern',
    subtitle: 'Your first original melody',
    module: 'First melodies',
    duration: 6,
    objectives: [
      'Combine open and fretted notes.',
      'Play a short melodic phrase with clean transitions.',
    ],
    instructions: [
      'This original melody uses B on string 2 and E, F and G on string 1.',
      'Read the string and fret before each note. This lesson checks pitch; take as much time as you need.',
      'Mute and pluck again for repeated notes. Finish the phrase with at least 85% accuracy.',
    ],
    notes: [e, e, g, F, e, B, e, F, g, e],
    passingAccuracy: 0.85,
  },
]
