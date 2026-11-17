export type LearningMode = 'serious' | 'game'
export type DetectionStatus = 'detected' | 'uncertain' | 'silence' | 'out-of-range'
export interface PitchDetection {
  frequency: number | null
  midi: number | null
  note: string | null
  octave: number | null
  cents: number | null
  confidence: number
  rms: number
  timestamp: number
  status: DetectionStatus
}
export type AudioStatus = 'idle' | 'requesting' | 'listening' | 'error'
export interface AudioSnapshot {
  status: AudioStatus
  detection: PitchDetection | null
  error: string | null
  devices: MediaDeviceInfo[]
}
export interface LessonNote {
  midi: number
  string: number
  fret: number
  label: string
}
export interface Lesson {
  id: string
  title: string
  subtitle: string
  module: string
  duration: number
  objectives: string[]
  instructions: string[]
  notes: LessonNote[]
  passingAccuracy: number
}
export type NoteOutcome = 'correct' | 'incorrect' | 'uncertain' | 'waiting'
export interface LessonSession {
  lessonId: string
  index: number
  correct: number
  attempts: number
  combo: number
  bestCombo: number
  score: number
  completed: boolean
  lastOutcome: NoteOutcome
  lastAcceptedAt: number
  needsRelease: boolean
  lastAcceptedMidi?: number | null
}
export interface SessionRecord {
  id: string
  lessonId: string
  completedAt: string
  accuracy: number
  correct: number
  attempts: number
  durationSeconds: number
  mode: LearningMode
  score: number
  bestCombo: number
}
export interface Preferences {
  mode: LearningMode
  mascotVisible: boolean
  reducedMotion: boolean
  guidance: 'normal' | 'quiet'
  sound: boolean
  inputDeviceId: string
  noiseFloor: number
  animationIntensity: 'subtle' | 'full'
}
export interface ProgressData {
  version: 1
  sessions: SessionRecord[]
  preferences: Preferences
}
export type TeachingEvent =
  | {
      type:
        | 'APPLICATION_STARTED'
        | 'LESSON_STARTED'
        | 'CONCEPT_INTRODUCED'
        | 'NOTE_CORRECT'
        | 'NOTE_INCORRECT'
        | 'REPEATED_ERROR'
        | 'CHORD_COMPLETED'
        | 'TIMING_IMPROVED'
        | 'LESSON_COMPLETED'
        | 'ACHIEVEMENT_UNLOCKED'
        | 'HELP_REQUESTED'
      detail?: string
    }
  | { type: 'MICROPHONE_ERROR'; detail?: string }
export type MascotState =
  | 'idle'
  | 'greeting'
  | 'explaining'
  | 'listening'
  | 'thinking'
  | 'confused'
  | 'correcting'
  | 'encouraging'
  | 'celebrating'
  | 'waiting'
  | 'sleeping'
export interface TeachingResponse {
  state: MascotState
  message: string
}
