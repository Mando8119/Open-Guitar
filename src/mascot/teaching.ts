import type { LearningMode, TeachingEvent, TeachingResponse } from '../types'

const responses: Record<TeachingEvent['type'], [TeachingResponse['state'], string, string]> = {
  APPLICATION_STARTED: [
    'greeting',
    'Welcome. Tune your guitar, then choose a short lesson. We will work one note at a time.',
    'Ready for a little music? Tune up, choose a trail, and take your first note.',
  ],
  LESSON_STARTED: [
    'listening',
    'Read the target string and fret. Play one clear note, then mute before repeating it.',
    'Your next note is on the trail. Find its string and fret, then give it a clear pluck.',
  ],
  CONCEPT_INTRODUCED: [
    'explaining',
    'Try the movement slowly. A relaxed hand and a clean sound matter more than speed.',
    'A new tool for your guitar kit. Try it slowly and give your hand time to learn.',
  ],
  NOTE_CORRECT: [
    'encouraging',
    'That matches the target. Prepare the next note.',
    'That note landed. Take a breath and find the next one.',
  ],
  NOTE_INCORRECT: [
    'correcting',
    'That pitch does not match yet. Check the string and fret, mute, and try again.',
    'A small detour. Check the string and fret, mute the sound, and try the target again.',
  ],
  REPEATED_ERROR: [
    'thinking',
    'Pause and check your tuning. Place your fingertip just behind the fret and pick only the target string.',
    'Let’s slow the trail down. Check tuning, find the fret, and pick just one string.',
  ],
  CHORD_COMPLETED: [
    'celebrating',
    'The chord check is complete. Notice which strings rang clearly before moving on.',
    'Chord check complete. Keep that relaxed hand shape in mind for the next one.',
  ],
  TIMING_IMPROVED: [
    'encouraging',
    'Your timing improved on this attempt. Keep listening for the pulse.',
    'Closer to the pulse. Keep your motion small and steady.',
  ],
  LESSON_COMPLETED: [
    'celebrating',
    'You reached the end of the lesson. Review your accuracy to see whether you met its passing target.',
    'You reached the end of the trail. Check your accuracy, then choose a replay or your next step.',
  ],
  ACHIEVEMENT_UNLOCKED: [
    'celebrating',
    'A practice milestone has been recorded. Take a moment to notice what you learned.',
    'A milestone on your music trail. Enjoy the moment, then keep that sound growing.',
  ],
  HELP_REQUESTED: [
    'explaining',
    'Check standard tuning, move close to the microphone, and play one string at a time. Wait for a clear reading.',
    'We can take this one note at a time. Tune up, move near the microphone, and give each string room to ring.',
  ],
  MICROPHONE_ERROR: [
    'confused',
    'Microphone input is unavailable. Check browser permission and the selected input, then try again.',
    'I cannot hear your guitar yet. Check microphone permission and your selected input, then try again.',
  ],
}

export function respondToEvent(
  event: TeachingEvent,
  mode: LearningMode = 'serious',
): TeachingResponse {
  const [state, serious, game] = responses[event.type]
  const detail = event.detail?.trim().slice(0, 240)
  return { state, message: `${mode === 'game' ? game : serious}${detail ? ` ${detail}` : ''}` }
}
