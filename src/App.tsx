import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  AudioLines,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Flame,
  Guitar,
  Headphones,
  LayoutDashboard,
  Leaf,
  ListMusic,
  Mic,
  MicOff,
  Music2,
  Play,
  RotateCcw,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react'
import { AudioEngine } from './audio/AudioEngine'
import { lessons } from './lessons/curriculum'
import { createSession, evaluateDetection, sessionAccuracy } from './evaluation/lessonEngine'
import { loadProgress, recordSession, saveProgress } from './storage/progress'
import ChordTrainer from './chords/ChordTrainer'
import RhythmTrainer from './rhythm/RhythmTrainer'
import { Guitary } from './mascot/Guitary'
import { respondToEvent } from './mascot/teaching'
import type { Lesson, LessonSession, Preferences, TeachingResponse } from './types'

type Page =
  | 'dashboard'
  | 'path'
  | 'lesson'
  | 'tuner'
  | 'practice'
  | 'progress'
  | 'calibration'
  | 'settings'
  | 'chords'
  | 'rhythm'
const strings = [
  { name: 'E', midi: 40, octave: 2 },
  { name: 'A', midi: 45, octave: 2 },
  { name: 'D', midi: 50, octave: 3 },
  { name: 'G', midi: 55, octave: 3 },
  { name: 'B', midi: 59, octave: 3 },
  { name: 'E', midi: 64, octave: 4 },
]
const nav = [
  { page: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { page: 'path', label: 'Learning path', icon: BookOpen },
  { page: 'practice', label: 'Free practice', icon: Guitar },
  { page: 'tuner', label: 'Guitar tuner', icon: AudioLines },
  { page: 'chords', label: 'Chord studio', icon: ListMusic },
  { page: 'rhythm', label: 'Rhythm lab', icon: Music2 },
  { page: 'progress', label: 'Your progress', icon: TrendingUp },
] as const

function GuitarArt() {
  return (
    <svg className="guitar-art" viewBox="0 0 460 340" fill="none" aria-hidden="true">
      <defs>
        <linearGradient
          id="body"
          x1="100"
          y1="130"
          x2="300"
          y2="340"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#e3b078" />
          <stop offset="1" stopColor="#9a623b" />
        </linearGradient>
        <linearGradient id="neck" x1="260" y1="50" x2="350" y2="140">
          <stop stopColor="#7e5537" />
          <stop offset="1" stopColor="#b78858" />
        </linearGradient>
      </defs>
      <circle cx="255" cy="173" r="131" stroke="#dcb789" strokeOpacity=".11" />
      <circle cx="255" cy="173" r="101" stroke="#dcb789" strokeOpacity=".07" />
      <path
        d="M103 258C73 219 94 174 125 167C144 162 145 143 165 128C194 108 229 126 239 151C249 178 224 192 233 208C255 247 233 279 204 291C173 307 126 290 103 258Z"
        fill="url(#body)"
        stroke="#e0b180"
        strokeWidth="3"
      />
      <path
        d="M111 258C90 227 101 187 128 179C151 173 154 152 171 142C195 129 215 143 222 159C231 181 208 198 222 216C240 243 224 267 199 280C174 291 132 283 111 258Z"
        stroke="#663e27"
        strokeOpacity=".4"
      />
      <circle cx="177" cy="211" r="31" fill="#30291e" stroke="#ecc795" strokeWidth="4" />
      <circle cx="177" cy="211" r="24" fill="#171a17" />
      <path
        d="M190 186L305 58L327 78L211 205Z"
        fill="url(#neck)"
        stroke="#4c3827"
        strokeWidth="2"
      />
      <path
        d="M305 58L322 29Q330 21 338 28L353 42Q360 50 352 58L327 78Z"
        fill="#bc8e60"
        stroke="#dcaf7d"
        strokeWidth="2"
      />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path
          key={i}
          d={`M${143 + i * 3} ${249 + i * 2}L${324 + i * 3} ${38 + i * 3}`}
          stroke="#eee1bf"
          strokeOpacity=".75"
          strokeWidth=".7"
        />
      ))}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <path
          key={i}
          d={`M${204 + i * 11} ${175 - i * 12}l18 16`}
          stroke="#d2b08b"
          strokeWidth="1.3"
        />
      ))}
      <path d="M131 246L158 270L165 261L138 237Z" fill="#422f24" />
      <path d="M200 219C218 220 224 232 217 240L199 228Z" fill="#683e27" />
      <path
        d="M310 41l-9-8m37 34 9 8m-28-44-7-7m36 32 8 7"
        stroke="#b8b8a3"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M81 115h13m-6-6v12m283 111h13m-6-6v12" stroke="#d2b087" strokeOpacity=".65" />
      <circle cx="366" cy="125" r="3" fill="#d2b087" fillOpacity=".5" />
      <path
        d="M62 284c44 19 95 27 140 26"
        stroke="#d0b18a"
        strokeOpacity=".2"
        strokeDasharray="4 5"
      />
    </svg>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [progress, setProgress] = useState(loadProgress)
  const [engine] = useState(() => new AudioEngine())
  const [audio, setAudio] = useState(() => engine.getSnapshot())
  const [lesson, setLesson] = useState<Lesson>(lessons[0]!)
  const [session, setSession] = useState<LessonSession | null>(null)
  const [teaching, setTeaching] = useState<TeachingResponse>(() =>
    respondToEvent({ type: 'APPLICATION_STARTED' }),
  )
  const [mascotMinimized, setMascotMinimized] = useState(false)
  const [mascotDismissed, setMascotDismissed] = useState(false)
  const [guidanceRepeat, setGuidanceRepeat] = useState(0)
  const [targetString, setTargetString] = useState<number | null>(null)
  const [saved, setSaved] = useState(true)
  const [calibrating, setCalibrating] = useState(false)
  const [calibrationMessage, setCalibrationMessage] = useState(
    'Start your microphone, then measure a few seconds of room noise without playing.',
  )
  const prefs = progress.preferences
  const live = useRef({ session, lesson, progress, startedAt: 0, page })
  useEffect(() => {
    live.current.session = session
    live.current.lesson = lesson
    live.current.progress = progress
    live.current.page = page
  }, [session, lesson, progress, page])
  const calibration = useRef({ started: 0, samples: [] as number[] })

  useEffect(() => {
    const unsubscribe = engine.subscribe((snapshot) => {
      setAudio(snapshot)
      if (snapshot.error) {
        setTeaching(respondToEvent({ type: 'MICROPHONE_ERROR', detail: snapshot.error }))
        if (calibration.current.started) {
          calibration.current.started = 0
          setCalibrating(false)
          setCalibrationMessage(
            'Calibration was interrupted. Restart your microphone and measure again.',
          )
        }
      }
      const current = live.current
      if (snapshot.detection && calibration.current.started) {
        calibration.current.samples.push(snapshot.detection.rms)
        if (performance.now() - calibration.current.started >= 3000) {
          const samples = calibration.current.samples.sort((a, b) => a - b)
          const floor = Math.min(
            0.08,
            Math.max(0.001, (samples[Math.floor(samples.length * 0.9)] ?? 0.002) * 2),
          )
          calibration.current.started = 0
          const next = {
            ...current.progress,
            preferences: { ...current.progress.preferences, noiseFloor: floor },
          }
          live.current.progress = next
          setProgress(next)
          setSaved(saveProgress(next))
          engine.setNoiseFloor(floor)
          setCalibrating(false)
          setCalibrationMessage(
            `Room noise measured. Detection threshold set to ${floor.toFixed(4)}. Play a single open string to check the response.`,
          )
        }
      }
      if (
        current.page !== 'lesson' ||
        !current.session ||
        current.session.completed ||
        !snapshot.detection ||
        snapshot.status !== 'listening'
      )
        return
      const previousSession = current.session
      const next = evaluateDetection(previousSession, current.lesson, snapshot.detection)
      if (next === previousSession) return
      live.current.session = next
      setSession(next)
      if (next.completed) {
        const record = {
          id: crypto.randomUUID(),
          lessonId: current.lesson.id,
          completedAt: new Date().toISOString(),
          accuracy: sessionAccuracy(next),
          correct: next.correct,
          attempts: next.attempts,
          durationSeconds: Math.max(1, Math.round((performance.now() - current.startedAt) / 1000)),
          mode: current.progress.preferences.mode,
          score: next.score,
          bestCombo: next.bestCombo,
        }
        const updated = recordSession(current.progress, record)
        live.current.progress = updated
        setProgress(updated)
        setSaved(saveProgress(updated))
        setTeaching(
          respondToEvent(
            {
              type:
                sessionAccuracy(next) >= current.lesson.passingAccuracy
                  ? 'LESSON_COMPLETED'
                  : 'HELP_REQUESTED',
              detail: 'Keep practicing this lesson slowly. Your real results are saved.',
            },
            current.progress.preferences.mode,
          ),
        )
      } else if (next.correct > previousSession.correct) {
        if (current.progress.preferences.guidance !== 'quiet')
          setTeaching(respondToEvent({ type: 'NOTE_CORRECT' }, current.progress.preferences.mode))
      } else if (next.attempts > previousSession.attempts)
        setTeaching(
          respondToEvent(
            { type: 'NOTE_INCORRECT', detail: current.lesson.notes[next.index]?.label },
            current.progress.preferences.mode,
          ),
        )
    })
    return () => {
      unsubscribe()
      engine.stop()
    }
  }, [engine])
  useEffect(() => {
    engine.setNoiseFloor(prefs.noiseFloor)
  }, [engine, prefs.noiseFloor])

  const updatePrefs = (patch: Partial<Preferences>) => {
    const next = { ...progress, preferences: { ...prefs, ...patch } }
    live.current.progress = next
    setProgress(next)
    setSaved(saveProgress(next))
  }
  const startMic = async () => {
    try {
      await engine.start(prefs.inputDeviceId || undefined)
      await engine.refreshDevices()
    } catch (error) {
      setTeaching(
        respondToEvent({
          type: 'MICROPHONE_ERROR',
          detail: error instanceof Error ? error.message : 'Microphone unavailable',
        }),
      )
    }
  }
  const stopMic = () => {
    engine.stop()
    calibration.current.started = 0
    setCalibrating(false)
  }
  const navigate = (next: Page) => {
    setPage(next)
    live.current.page = next
    setMascotDismissed(false)
    requestAnimationFrame(() =>
      document.getElementById('main-content')?.focus({ preventScroll: true }),
    )
  }
  const startLesson = (selected: Lesson) => {
    const next = createSession(selected)
    setLesson(selected)
    setSession(next)
    live.current.session = next
    live.current.lesson = selected
    live.current.startedAt = performance.now()
    live.current.page = 'lesson'
    setPage('lesson')
    requestAnimationFrame(() =>
      document.getElementById('main-content')?.focus({ preventScroll: true }),
    )
    setMascotDismissed(false)
    setTeaching(respondToEvent({ type: 'LESSON_STARTED', detail: selected.title }, prefs.mode))
  }
  const help = () => {
    if (!prefs.mascotVisible) updatePrefs({ mascotVisible: true })
    setMascotMinimized(false)
    setMascotDismissed(false)
    setTeaching(
      respondToEvent(
        {
          type: 'HELP_REQUESTED',
          detail:
            page === 'lesson'
              ? lesson.instructions.join(' ')
              : 'Play one string at a time, and let each note settle.',
        },
        prefs.mode,
      ),
    )
    requestAnimationFrame(() => {
      document.querySelector('.mascot-dock')?.scrollIntoView({
        block: 'nearest',
        behavior: prefs.reducedMotion ? 'auto' : 'smooth',
      })
    })
  }
  const completedIds = new Set(
    progress.sessions
      .filter((s) => s.accuracy >= (lessons.find((l) => l.id === s.lessonId)?.passingAccuracy ?? 1))
      .map((s) => s.lessonId),
  )
  const nextLesson = lessons.find((l) => !completedIds.has(l.id)) ?? lessons[0]!
  const practiceMinutes = Math.floor(
    progress.sessions.reduce((n, s) => n + s.durationSeconds, 0) / 60,
  )
  const detection = audio.detection
  const detected = detection?.status === 'detected'
  const selectedString = targetString !== null ? strings[targetString] : null
  const targetCents =
    detected && detection.frequency
      ? selectedString
        ? 1200 * Math.log2(detection.frequency / (440 * 2 ** ((selectedString.midi - 69) / 12)))
        : (detection.cents ?? 0)
      : null
  const inTune = targetCents !== null && Math.abs(targetCents) <= 7
  const micControls = (
    <div className="mic-controls">
      <span className={`status-dot ${audio.status === 'listening' ? 'on' : ''}`} />
      <span>
        {audio.status === 'listening'
          ? 'Microphone is listening'
          : audio.status === 'requesting'
            ? 'Connecting microphone…'
            : 'Microphone is off'}
      </span>
      <button
        className="button small secondary"
        disabled={audio.status === 'requesting'}
        onClick={() => (audio.status === 'listening' ? stopMic() : void startMic())}
      >
        {audio.status === 'listening' ? <MicOff size={15} /> : <Mic size={15} />}{' '}
        {audio.status === 'listening' ? 'Stop microphone' : 'Enable microphone'}
      </button>
    </div>
  )

  return (
    <div className={`app ${prefs.reducedMotion ? 'reduce-motion' : ''}`}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => navigate('dashboard')}
          aria-label="OpenGuitar home"
        >
          <span className="brand-mark">
            <AudioLines size={25} />
          </span>
          open<span className="brand-light">guitar</span>
          <span className="brand-dot">.</span>
        </button>
        <div className="workspace-label">YOUR PRACTICE SPACE</div>
        <nav aria-label="Main navigation">
          {nav.map(({ page: p, label, icon: Icon }) => (
            <button
              key={p}
              className={`nav-item ${page === p || (page === 'lesson' && p === 'path') ? 'active' : ''}`}
              onClick={() => navigate(p)}
              aria-current={page === p ? 'page' : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
              {p === 'path' && <span className="nav-count">{lessons.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-card">
            <ShieldCheck size={18} />
            <div>
              <strong>Your sound. Your space.</strong>
              <span>Private, local, always yours.</span>
            </div>
          </div>
          <button
            className={`nav-item ${page === 'calibration' ? 'active' : ''}`}
            aria-current={page === 'calibration' ? 'page' : undefined}
            onClick={() => navigate('calibration')}
          >
            <SlidersHorizontal size={18} />
            <span>Input calibration</span>
          </button>
          <button
            className={`nav-item ${page === 'settings' ? 'active' : ''}`}
            aria-current={page === 'settings' ? 'page' : undefined}
            onClick={() => navigate('settings')}
          >
            <Settings2 size={18} />
            <span>Settings</span>
          </button>
          <div className="profile">
            <span className="avatar">Y</span>
            <div>
              <strong>Your guitar journey</strong>
              <span>Learning at your own pace</span>
            </div>
            <Leaf size={17} />
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="breadcrumb">
            Your workspace <ChevronRight size={13} />{' '}
            <strong>
              {page === 'lesson'
                ? lesson.title
                : {
                    dashboard: 'Overview',
                    path: 'Learning path',
                    practice: 'Free practice',
                    tuner: 'Guitar tuner',
                    progress: 'Your progress',
                    calibration: 'Input calibration',
                    settings: 'Settings',
                    chords: 'Chord studio',
                    rhythm: 'Rhythm lab',
                  }[page]}
            </strong>
          </span>
          <div className="topbar-right">
            {audio.status === 'listening' && (
              <button
                className="icon-button mic-stop"
                aria-label="Stop microphone"
                title="Stop microphone"
                onClick={stopMic}
              >
                <MicOff size={17} />
              </button>
            )}
            <button
              className="icon-button mobile-setting"
              aria-label="Input calibration"
              onClick={() => navigate('calibration')}
            >
              <SlidersHorizontal size={17} />
            </button>
            <button
              className="icon-button mobile-setting"
              aria-label="Settings"
              onClick={() => navigate('settings')}
            >
              <Settings2 size={17} />
            </button>
            <span className="local-badge">
              <span /> All audio stays on your device
            </span>
            <button className="icon-button" aria-label="Get guidance" onClick={help}>
              <CircleHelp size={19} />
            </button>
            <span className="avatar small-avatar">Y</span>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          {!saved && (
            <div className="notice">
              Your browser could not save progress. Keep this tab open to retain this session.
            </div>
          )}
          {audio.error && (
            <div className="notice error" role="alert">
              {audio.error}{' '}
              <button onClick={() => navigate('calibration')}>Check input settings</button>
            </div>
          )}
          {page === 'dashboard' && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">A LITTLE PRACTICE. A LITTLE PROGRESS.</p>
                  <h1>
                    Good to have you here<span className="amber">.</span>
                  </h1>
                  <p>Pick up your guitar. Make a little time for you.</p>
                </div>
                <span className="date-tag">
                  <Leaf size={15} /> One note at a time
                </span>
              </div>
              <section className="hero">
                <div className="hero-copy">
                  <span className="pill">
                    <span /> YOUR NEXT CHAPTER
                  </span>
                  <h2>
                    Find your
                    <br />
                    <em>rhythm.</em>
                  </h2>
                  <p>
                    From your first string to your next breakthrough.
                    <br className="desktop-break" /> A quieter space to become the guitarist you
                    want to be.
                  </p>
                  <button className="button primary" onClick={() => startLesson(nextLesson)}>
                    <Play size={16} fill="currentColor" />{' '}
                    {completedIds.size ? 'Continue learning' : 'Start your journey'}
                    <ArrowRight size={17} />
                  </button>
                  <span className="hero-note">Your guitar. Your microphone. You're ready.</span>
                </div>
                <GuitarArt />
                <div className="hero-side-label">LESS NOISE. MORE MUSIC.</div>
              </section>
              <section className="stats-strip" aria-label="Your practice statistics">
                <div>
                  <span className="stat-icon mint">
                    <Clock3 size={19} />
                  </span>
                  <div>
                    <strong>
                      {practiceMinutes}
                      <small> min</small>
                    </strong>
                    <span>Time well spent</span>
                  </div>
                </div>
                <div>
                  <span className="stat-icon amber-text">
                    <BookOpen size={19} />
                  </span>
                  <div>
                    <strong>
                      {completedIds.size}
                      <small> / {lessons.length}</small>
                    </strong>
                    <span>Lessons passed</span>
                  </div>
                </div>
                <div>
                  <span className="stat-icon lavender">
                    <Target size={19} />
                  </span>
                  <div>
                    <strong>
                      {progress.sessions.length
                        ? `${Math.round((progress.sessions.reduce((n, s) => n + s.accuracy, 0) / progress.sessions.length) * 100)}%`
                        : '—'}
                    </strong>
                    <span>Average accuracy</span>
                  </div>
                </div>
                <div className="stats-message">
                  <Sparkles className="tiny-spark" size={27} />
                  <p>
                    {progress.sessions.length
                      ? 'Small steps add up.'
                      : 'Every great player started with one note.'}
                    <br />
                    <strong>
                      {progress.sessions.length
                        ? 'Keep your momentum going.'
                        : 'Your story starts here.'}
                    </strong>
                  </p>
                </div>
              </section>
              <div className="dashboard-bottom">
                <section className="continue-section">
                  <div className="section-heading">
                    <h2>Your next step</h2>
                    <button className="text-button" onClick={() => navigate('path')}>
                      View learning path <ArrowRight size={15} />
                    </button>
                  </div>
                  <button className="lesson-feature" onClick={() => startLesson(nextLesson)}>
                    <div className="lesson-art">
                      <span className="art-string" />
                      <span className="art-string" />
                      <span className="art-string" />
                      <span className="art-string" />
                      <span className="art-note">
                        <Music2 size={58} />
                      </span>
                      <span className="art-dot" />
                    </div>
                    <div className="lesson-feature-copy">
                      <span className="eyebrow">{nextLesson.module}</span>
                      <h3>{nextLesson.title}</h3>
                      <p>{nextLesson.subtitle}</p>
                      <div className="lesson-meta">
                        <span>
                          <Clock3 size={13} />
                          {nextLesson.duration} min
                        </span>
                        <span>
                          <ListMusic size={14} />
                          {nextLesson.notes.length} notes
                        </span>
                        <span className="beginner">Beginner friendly</span>
                      </div>
                    </div>
                    <span className="round-arrow">
                      <ArrowRight size={21} />
                    </span>
                  </button>
                </section>
                <section className="tools-section">
                  <div className="section-heading">
                    <h2>Make it your own</h2>
                    <Music2 size={17} />
                  </div>
                  <button className="tool-row" onClick={() => navigate('tuner')}>
                    <span className="tool-icon mint">
                      <AudioLines size={23} />
                    </span>
                    <span>
                      <strong>A good start is in tune</strong>
                      <small>Get your strings sounding right</small>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                  <button className="tool-row" onClick={() => navigate('practice')}>
                    <span className="tool-icon amber-text">
                      <Guitar size={23} />
                    </span>
                    <span>
                      <strong>Just you and your guitar</strong>
                      <small>Play freely. See what you discover.</small>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                </section>
              </div>
              <div className="bottom-note">
                <Headphones size={14} />
                <span>Built for real guitars and real progress. No pressure. No shortcuts.</span>
                <span className="open-source">OPEN SOURCE · MADE FOR MUSIC</span>
              </div>
            </>
          )}
          {page === 'chords' && (
            <ChordTrainer
              detection={detection ?? null}
              listening={audio.status === 'listening'}
              onStartMicrophone={() => void startMic()}
            />
          )}
          {page === 'rhythm' && (
            <RhythmTrainer
              detection={detection ?? null}
              listening={audio.status === 'listening'}
              onStartMicrophone={() => void startMic()}
              soundEnabled={prefs.sound}
            />
          )}
          {page === 'path' && (
            <>
              <PageTitle
                eyebrow="BUILD YOUR FOUNDATION"
                title="Every note is a step forward."
                description="A thoughtful path from open strings to melodies. Revisit any lesson, anytime."
              />
              <div className="path-summary">
                <span className="mint">
                  {completedIds.size} of {lessons.length} lessons passed
                </span>
                <div className="progress-track">
                  <span style={{ width: `${(completedIds.size / lessons.length) * 100}%` }} />
                </div>
              </div>
              <div className="lesson-list">
                {lessons.map((l, i) => (
                  <button key={l.id} className="path-lesson" onClick={() => startLesson(l)}>
                    <span className={`lesson-number ${completedIds.has(l.id) ? 'done' : ''}`}>
                      {completedIds.has(l.id) ? (
                        <Check size={21} />
                      ) : (
                        String(i + 1).padStart(2, '0')
                      )}
                    </span>
                    <div>
                      <span className="eyebrow">{l.module}</span>
                      <h3>{l.title}</h3>
                      <p>{l.subtitle}</p>
                    </div>
                    <span className="lesson-duration">
                      <Clock3 size={14} />
                      {l.duration} min
                    </span>
                    <ArrowRight size={20} />
                  </button>
                ))}
              </div>
            </>
          )}
          {page === 'lesson' && session && (
            <>
              <div className="lesson-heading">
                <PageTitle
                  eyebrow={lesson.module}
                  title={lesson.title}
                  description={lesson.subtitle}
                />
                <div className="segmented" aria-label="Learning mode">
                  <button
                    className={prefs.mode === 'serious' ? 'selected' : ''}
                    onClick={() => updatePrefs({ mode: 'serious' })}
                  >
                    Focus mode
                  </button>
                  <button
                    className={prefs.mode === 'game' ? 'selected' : ''}
                    onClick={() => updatePrefs({ mode: 'game' })}
                  >
                    <Sparkles size={14} />
                    Play mode
                  </button>
                </div>
              </div>
              <div className="lesson-workspace">
                <section className="panel play-panel">
                  <div className="play-topline">
                    <span>
                      NOTE {Math.min(session.index + 1, lesson.notes.length)} OF{' '}
                      {lesson.notes.length}
                    </span>
                    <span>
                      {prefs.mode === 'game'
                        ? `${session.score} points · ${session.combo} combo`
                        : `${session.correct} correct · ${session.attempts} attempts`}
                    </span>
                  </div>
                  <div className="progress-track">
                    <span style={{ width: `${(session.index / lesson.notes.length) * 100}%` }} />
                  </div>
                  {session.completed ? (
                    <div className="completion">
                      {sessionAccuracy(session) >= lesson.passingAccuracy ? (
                        <Trophy size={45} />
                      ) : (
                        <Leaf size={45} />
                      )}
                      <h2>
                        {sessionAccuracy(session) >= lesson.passingAccuracy
                          ? 'Beautiful work.'
                          : 'Practice makes progress.'}
                      </h2>
                      <p>
                        {Math.round(sessionAccuracy(session) * 100)}% accuracy · {session.correct}{' '}
                        correct notes · {saved ? 'saved to your progress' : 'kept in this tab only'}
                      </p>
                      <p>
                        {sessionAccuracy(session) >= lesson.passingAccuracy
                          ? 'You passed this lesson. Carry that feeling into your next one.'
                          : `Aim for ${Math.round(lesson.passingAccuracy * 100)}% to pass. Take your time and try again.`}
                      </p>
                      <button className="button primary" onClick={() => startLesson(lesson)}>
                        <RotateCcw size={16} />
                        Play again
                      </button>
                      <button className="text-button" onClick={() => navigate('path')}>
                        Back to learning path <ArrowRight size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="target-note">
                        <span className="eyebrow">PLAY THIS NOTE</span>
                        <strong>{lesson.notes[session.index]?.label}</strong>
                        <p>
                          String {lesson.notes[session.index]?.string} <span>·</span>{' '}
                          {lesson.notes[session.index]?.fret === 0
                            ? 'Open string'
                            : `Fret ${lesson.notes[session.index]?.fret}`}
                        </p>
                      </div>
                      <div
                        className="tablature"
                        role="img"
                        aria-label={`Tab sequence: ${lesson.notes.map((n) => `string ${n.string} fret ${n.fret}`).join(', ')}`}
                      >
                        <div className="tab-labels">
                          {['e', 'B', 'G', 'D', 'A', 'E'].map((n, i) => (
                            <span key={i}>{n}</span>
                          ))}
                        </div>
                        <div className="tab-grid">
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <div className="tab-line" key={n} />
                          ))}
                          {lesson.notes.map((n, i) => (
                            <span
                              key={i}
                              className={`tab-note ${i === session.index ? 'current' : i < session.index ? 'played' : ''}`}
                              style={{
                                left: `${((i + 0.5) / lesson.notes.length) * 100}%`,
                                top: `${(n.string - 1) * 30}px`,
                              }}
                            >
                              {n.fret}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p
                        className={`feedback ${session.lastOutcome === 'correct' ? 'mint' : ''}`}
                        aria-live="polite"
                      >
                        {audio.status !== 'listening'
                          ? 'Enable your microphone when you’re ready.'
                          : session.needsRelease
                            ? 'Let the string go quiet before the next note.'
                            : session.lastOutcome === 'incorrect'
                              ? 'Try that note again. Pluck a single string clearly.'
                              : 'Pluck gently and let the note ring.'}
                      </p>
                      {micControls}
                    </>
                  )}
                </section>
                <aside className="panel instruction-panel">
                  <span className="eyebrow">MAKE IT CLICK</span>
                  <h3>A little guidance</h3>
                  {lesson.instructions.map((instruction, i) => (
                    <p key={i}>
                      <span>{i + 1}</span>
                      {instruction}
                    </p>
                  ))}
                  <div className="tip">
                    <Leaf size={17} />
                    <p>Slow is smooth. Give each note a little space to breathe.</p>
                  </div>
                  <button className="text-button" onClick={help}>
                    <CircleHelp size={16} />
                    Ask Guitary for help
                  </button>
                </aside>
              </div>
            </>
          )}
          {(page === 'tuner' || page === 'practice') && (
            <>
              <PageTitle
                eyebrow={page === 'tuner' ? 'A CLEARER SOUND' : 'ROOM TO EXPLORE'}
                title={page === 'tuner' ? 'Good music starts in tune.' : 'Follow your curiosity.'}
                description={
                  page === 'tuner'
                    ? 'Standard tuning · A4 = 440 Hz. Pluck one string at a time.'
                    : 'No score. No timer. Just your guitar and a little room to play.'
                }
              />
              <section className="panel tuner-panel">
                <div className="tuner-top">
                  <span className="pill muted-pill">
                    {page === 'tuner' ? 'CHROMATIC TUNER' : 'LIVE NOTE DETECTION'}
                  </span>
                  <span className={inTune ? 'mint' : 'subtle'}>
                    {detected
                      ? `${Math.round((detection?.confidence ?? 0) * 100)}% confidence`
                      : 'Waiting for a clear note'}
                  </span>
                </div>
                <div className={`tuner-note ${inTune ? 'in-tune' : ''}`}>
                  <strong>
                    {detected ? detection?.note : '—'}
                    <small>{detected ? detection?.octave : ''}</small>
                  </strong>
                  <span>
                    {detected && detection?.frequency
                      ? `${detection.frequency.toFixed(1)} Hz`
                      : 'Play a single string'}
                  </span>
                </div>
                <div className="tuner-meter">
                  <span aria-label="Flat">&#9837;</span>
                  <div className="meter-scale">
                    <div className="tune-zone" />
                    {Array.from({ length: 21 }, (_, i) => (
                      <i key={i} />
                    ))}
                    <div
                      className={`needle ${inTune ? 'in-tune' : ''}`}
                      style={{
                        left: `${50 + Math.max(-50, Math.min(50, targetCents ?? 0)) * 0.9}%`,
                      }}
                    />
                  </div>
                  <span aria-label="Sharp">&#9839;</span>
                </div>
                <p className="tuning-status" aria-live="polite">
                  {targetCents === null
                    ? 'Listen. Adjust. Find your sound.'
                    : inTune
                      ? 'Right on. You’re in tune.'
                      : `${Math.abs(targetCents).toFixed(0)} cents ${targetCents < 0 ? 'flat — tune up gently' : 'sharp — tune down gently'}`}
                </p>
                <div className="string-selector" aria-label="Target string">
                  <button
                    className={targetString === null ? 'selected' : ''}
                    onClick={() => setTargetString(null)}
                  >
                    Auto
                  </button>
                  {strings.map((s, i) => (
                    <button
                      className={targetString === i ? 'selected' : ''}
                      onClick={() => setTargetString(i)}
                      key={i}
                    >
                      <strong>
                        {s.name}
                        <small>{s.octave}</small>
                      </strong>
                      <span>String {6 - i}</span>
                    </button>
                  ))}
                </div>
                {micControls}
                <p className="privacy-note">
                  <ShieldCheck size={13} />
                  Microphone audio is processed here, never recorded or uploaded.
                </p>
              </section>
              <div className="practice-tip">
                <Music2 size={21} />
                <div>
                  <h3>
                    {page === 'tuner'
                      ? 'A little patience goes a long way.'
                      : 'Give yourself room to experiment.'}
                  </h3>
                  <p>
                    {page === 'tuner'
                      ? 'Start with the thickest string. Make small adjustments, and let each note settle before turning the peg again.'
                      : 'Try moving between two notes slowly. Hear how each one feels. Free practice never adds manufactured scores or completed lessons.'}
                  </p>
                </div>
              </div>
            </>
          )}
          {page === 'calibration' && (
            <>
              <PageTitle
                eyebrow="LET’S HEAR YOUR GUITAR"
                title="Set up your sound."
                description="Choose your input and help detection adapt to your room."
              />
              <section className="panel settings-panel">
                <h2>Microphone input</h2>
                <p>
                  Start capture to allow device access. Built-in microphones work best in a quiet
                  room.
                </p>
                {micControls}
                <label className="field-label" htmlFor="audio-input">
                  Input device
                </label>
                <div className="input-row">
                  <select
                    id="audio-input"
                    value={prefs.inputDeviceId}
                    onChange={(e) => {
                      const id = e.target.value
                      updatePrefs({ inputDeviceId: id })
                      if (audio.status === 'listening') {
                        engine.stop()
                        void engine.start(id || undefined).catch(() => {})
                      }
                    }}
                  >
                    <option value="">System default microphone</option>
                    {audio.devices.map((d, i) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone ${i + 1}`}
                      </option>
                    ))}
                  </select>
                  <button className="button secondary" onClick={() => void engine.refreshDevices()}>
                    Refresh
                  </button>
                </div>
                <div className="divider" />
                <h2>Room noise calibration</h2>
                <p>{calibrationMessage}</p>
                <div className="level-row">
                  <span>Input level</span>
                  <meter
                    min={0}
                    max={0.1}
                    value={detection?.rms ?? 0}
                    aria-label="Microphone input level"
                  />
                  <span>{(detection?.rms ?? 0).toFixed(4)}</span>
                </div>
                <button
                  className="button primary"
                  disabled={audio.status !== 'listening' || calibrating}
                  onClick={() => {
                    calibration.current = { started: performance.now(), samples: [] }
                    setCalibrating(true)
                    setCalibrationMessage('Measuring for 3 seconds. Keep your guitar quiet…')
                  }}
                >
                  {calibrating ? 'Measuring room noise…' : 'Measure room noise'}
                </button>
                <label className="field-label" htmlFor="noise-floor">
                  Detection threshold · {prefs.noiseFloor.toFixed(4)}
                </label>
                <input
                  id="noise-floor"
                  type="range"
                  min="0.001"
                  max="0.08"
                  step="0.001"
                  value={prefs.noiseFloor}
                  onChange={(e) => updatePrefs({ noiseFloor: Number(e.target.value) })}
                />
                <p className="subtle">
                  Raise the threshold if room noise produces notes. Lower it if quiet guitar notes
                  are missed.
                </p>
                <div className="divider" />
                <h2>Physical guitar check</h2>
                <p>
                  Pluck an open low E, then A. Check that the detected note settles and the input
                  responds. Physical guitar and Android performance depend on your microphone and
                  device.
                </p>
                <div className="physical-result">
                  <span className={`status-dot ${detected ? 'on' : ''}`} />
                  {detected
                    ? `${detection?.note}${detection?.octave} · ${detection?.frequency?.toFixed(1)} Hz · ${Math.round((detection?.confidence ?? 0) * 100)}% confidence`
                    : 'Waiting for a clear, single guitar note'}
                </div>
                <button className="text-button" onClick={() => navigate('tuner')}>
                  Open the tuner <ArrowRight size={16} />
                </button>
              </section>
            </>
          )}
          {page === 'progress' && (
            <>
              <PageTitle
                eyebrow="YOUR EFFORT ADDS UP"
                title="Look how far you’ve come."
                description="Real practice. Real results. Your journey is saved on this device."
              />
              <div className="progress-stats">
                <div className="panel">
                  <Clock3 className="mint" />
                  <strong>
                    {practiceMinutes}
                    <small> min</small>
                  </strong>
                  <p>Completed lesson time</p>
                </div>
                <div className="panel">
                  <BookOpen className="amber-text" />
                  <strong>
                    {completedIds.size}
                    <small> / {lessons.length}</small>
                  </strong>
                  <p>Lessons passed</p>
                </div>
                <div className="panel">
                  <Flame className="lavender" />
                  <strong>{progress.sessions.length}</strong>
                  <p>Completed sessions</p>
                </div>
              </div>
              <section className="panel history-panel">
                <h2>Your practice journal</h2>
                {progress.sessions.length ? (
                  <div className="history-list">
                    {[...progress.sessions].reverse().map((s) => (
                      <div className="history-row" key={s.id}>
                        <span className="history-check">
                          <Music2 size={18} />
                        </span>
                        <div>
                          <strong>
                            {lessons.find((l) => l.id === s.lessonId)?.title ?? s.lessonId}
                          </strong>
                          <small>
                            {new Date(s.completedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            · {s.mode === 'game' ? 'Play' : 'Focus'} mode ·{' '}
                            {Math.max(1, Math.round(s.durationSeconds / 60))} min
                          </small>
                        </div>
                        <span>
                          {Math.round(s.accuracy * 100)}%<small>accuracy</small>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <Leaf size={37} />
                    <h3>A fresh page, just for you.</h3>
                    <p>Complete your first lesson to start your practice journal.</p>
                    <button className="button primary" onClick={() => startLesson(nextLesson)}>
                      Play your first notes <ArrowRight size={17} />
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
          {page === 'settings' && (
            <>
              <PageTitle
                eyebrow="YOUR SPACE, YOUR WAY"
                title="Make yourself comfortable."
                description="A few small adjustments for the way you like to learn."
              />
              <section className="panel settings-panel">
                <h2>Learning experience</h2>
                <Setting
                  label="Play mode"
                  description="Add points and combos to the same carefully evaluated lessons."
                  checked={prefs.mode === 'game'}
                  onChange={(v) => updatePrefs({ mode: v ? 'game' : 'serious' })}
                />
                <Setting
                  label="Guitary companion"
                  description="A little encouragement and help when you need it."
                  checked={prefs.mascotVisible}
                  onChange={(v) => updatePrefs({ mascotVisible: v })}
                />
                <Setting
                  label="Quiet guidance"
                  description="Keep encouragement brief and let the music lead."
                  checked={prefs.guidance === 'quiet'}
                  onChange={(v) => updatePrefs({ guidance: v ? 'quiet' : 'normal' })}
                />
                <Setting
                  label="Metronome clicks"
                  description="Play an audible pulse during tap rhythm practice. Microphone modes stay silent."
                  checked={prefs.sound}
                  onChange={(v) => updatePrefs({ sound: v })}
                />
                <div className="divider" />
                <h2>Motion & comfort</h2>
                <Setting
                  label="Reduce motion"
                  description="Keep transitions and companion movement to a minimum."
                  checked={prefs.reducedMotion}
                  onChange={(v) => updatePrefs({ reducedMotion: v })}
                />
                <Setting
                  label="Expressive companion"
                  description="Give Guitary a little more movement and personality."
                  checked={prefs.animationIntensity === 'full'}
                  onChange={(v) => updatePrefs({ animationIntensity: v ? 'full' : 'subtle' })}
                />
                <div className="divider" />
                <h2>Your microphone</h2>
                <p>Choose an input and calibrate your room for clearer note detection.</p>
                <button className="button secondary" onClick={() => navigate('calibration')}>
                  <SlidersHorizontal size={16} />
                  Input calibration <ArrowRight size={16} />
                </button>
                <div className="local-settings-note">
                  <ShieldCheck size={18} />
                  <p>
                    Your settings and completed sessions stay in this browser. Microphone samples
                    are never stored.
                  </p>
                </div>
              </section>
            </>
          )}
        </main>
        <footer className="workspace-footer">
          <span>Made for the love of playing.</span>
          <span>
            OpenGuitar <Sparkles size={10} className="amber" /> Free & open source
          </span>
        </footer>
      </div>
      {prefs.mascotVisible && !mascotDismissed && (
        <div className={`mascot-dock ${mascotMinimized ? 'minimized' : ''}`}>
          <button
            className="mascot-figure"
            onClick={() => setMascotMinimized(!mascotMinimized)}
            aria-label={mascotMinimized ? 'Expand Guitary' : 'Minimize Guitary'}
          >
            <Guitary
              state={teaching.state}
              reducedMotion={prefs.reducedMotion}
              intensity={prefs.animationIntensity}
            />
          </button>
          {!mascotMinimized && (
            <div className="mascot-bubble">
              <div className="mascot-title">
                <strong>
                  Guitary<span>YOUR PRACTICE PAL</span>
                </strong>
                <button
                  className="icon-button"
                  onClick={() => setMascotDismissed(true)}
                  aria-label="Dismiss guidance"
                >
                  <X size={14} />
                </button>
              </div>
              <div aria-live="polite" aria-atomic="true">
                <p key={guidanceRepeat}>{teaching.message}</p>
              </div>
              <div className="mascot-actions">
                <button onClick={help}>
                  Need a hand? <ArrowRight size={12} />
                </button>
                <button
                  onClick={() => {
                    setGuidanceRepeat((n) => n + 1)
                    setMascotMinimized(false)
                  }}
                  aria-label="Repeat guidance"
                >
                  <RotateCcw size={12} />
                </button>
                <button onClick={() => setMascotMinimized(true)} aria-label="Minimize companion">
                  <ArrowDown size={13} />
                </button>
                <button onClick={() => updatePrefs({ mascotVisible: false })}>Hide</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PageTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  )
}
function Setting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="setting-row">
      <div>
        <strong>{label}</strong>
        <p>{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`switch ${checked ? 'checked' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  )
}
