import { expect, test, type Page } from '@playwright/test'

/** Synthetic source enters through a real MediaStream, Worklet and DSP Worker. */
async function syntheticMicrophone(page: Page) {
  await page.addInitScript(() => {
    type TestInput = { tone: (midi: number | null) => void; stopped: () => boolean }
    const host = window as unknown as { testGuitar: TestInput }
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      value: async () => {
        const context = new AudioContext()
        await context.resume()
        const destination = context.createMediaStreamDestination()
        const gain = context.createGain()
        gain.gain.value = 0
        gain.connect(destination)
        const oscillator = context.createOscillator()
        oscillator.type = 'triangle'
        oscillator.frequency.value = 82.406889
        oscillator.connect(gain)
        oscillator.start()
        host.testGuitar = {
          tone: (midi) => {
            if (midi === null) gain.gain.setValueAtTime(0, context.currentTime)
            else {
              oscillator.frequency.setValueAtTime(
                440 * 2 ** ((midi - 69) / 12),
                context.currentTime,
              )
              gain.gain.setValueAtTime(0.35, context.currentTime)
            }
          },
          stopped: () =>
            destination.stream.getTracks().every((track) => track.readyState === 'ended'),
        }
        return destination.stream
      },
    })
  })
}

async function tone(page: Page, midi: number | null) {
  await page.evaluate(
    (value) =>
      (
        window as unknown as { testGuitar: { tone: (midi: number | null) => void } }
      ).testGuitar.tone(value),
    midi,
  )
}

test('navigation, local preferences and empty progress work without microphone', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Good to have you here.' })).toBeVisible()
  await page.getByRole('button', { name: 'Your progress', exact: true }).click()
  await expect(page.getByText('A fresh page, just for you.')).toBeVisible()
  await page
    .getByRole('button', { name: 'Settings', exact: true })
    .filter({ visible: true })
    .click()
  await page.getByRole('switch', { name: 'Reduce motion' }).click()
  await page.getByRole('switch', { name: 'Guitary companion' }).click()
  await page.getByRole('switch', { name: 'Metronome clicks' }).click()
  await page.reload()
  await page
    .getByRole('button', { name: 'Settings', exact: true })
    .filter({ visible: true })
    .click()
  await expect(page.getByRole('switch', { name: 'Reduce motion' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  await expect(page.getByRole('switch', { name: 'Guitary companion' })).toHaveAttribute(
    'aria-checked',
    'false',
  )
  await expect(page.getByRole('switch', { name: 'Metronome clicks' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  await page.getByRole('button', { name: 'Chord studio', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'E minor', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Am A minor' }).click()
  await expect(page.getByRole('heading', { name: 'A minor', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Rhythm lab', exact: true }).click()
  await page.getByRole('button', { name: 'Start metronome', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Stop', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Tap the beat' }).click()
  await page.getByRole('button', { name: 'Stop', exact: true }).click()
  await page.getByRole('button', { name: 'Start melody', exact: true }).click()
  await page.getByRole('button', { name: 'Pause melody' }).click()
  await page.getByRole('button', { name: 'Restart melody' }).click()
  expect(errors).toEqual([])
})

test('permission errors show an actionable message and earn no progress', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      value: async () => {
        throw new DOMException('Test permission denied', 'NotAllowedError')
      },
    }),
  )
  await page.goto('/')
  await page.getByRole('button', { name: 'Guitar tuner', exact: true }).click()
  await page.getByRole('button', { name: 'Enable microphone', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Microphone access was denied')
  await page.getByRole('button', { name: 'Your progress', exact: true }).click()
  await expect(page.getByText('A fresh page, just for you.')).toBeVisible()
})

test('real audio graph detects E2, stops tracks, and saves one shared-mode lesson', async ({
  page,
}) => {
  await syntheticMicrophone(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Guitar tuner', exact: true }).click()
  await page.getByRole('button', { name: 'Enable microphone', exact: true }).click()
  await expect(page.getByText('Microphone is listening')).toBeVisible()
  await tone(page, 40)
  await expect(page.locator('.tuner-note > strong')).toHaveText('E2', { timeout: 10_000 })
  await expect(page.locator('.tuning-status')).toContainText(/in tune/i)
  await page
    .getByRole('button', { name: 'Stop microphone', exact: true })
    .filter({ visible: true })
    .last()
    .click()
  expect(
    await page.evaluate(() =>
      (window as unknown as { testGuitar: { stopped: () => boolean } }).testGuitar.stopped(),
    ),
  ).toBe(true)
  await page.getByRole('button', { name: 'Overview', exact: true }).click()
  await page.getByRole('button', { name: 'Start your journey' }).click()
  await page.getByRole('button', { name: 'Enable microphone', exact: true }).click()
  for (let note = 0; note < 4; note++) {
    await tone(page, null)
    await page.waitForTimeout(350)
    if (note === 2) await page.getByRole('button', { name: 'Play mode', exact: true }).click()
    await tone(page, 40)
    if (note < 3)
      await expect(page.locator('.play-topline')).toContainText(`NOTE ${note + 2} OF 4`, {
        timeout: 5000,
      })
  }
  await expect(page.getByRole('heading', { name: 'Beautiful work.' })).toBeVisible()
  const records = await page.evaluate(
    () => JSON.parse(localStorage.getItem('openguitar.progress.v1')!).sessions,
  )
  expect(records).toHaveLength(1)
  expect(records[0]).toMatchObject({
    lessonId: 'first-clear-note',
    accuracy: 1,
    correct: 4,
    attempts: 4,
    mode: 'game',
  })
  await page.getByRole('button', { name: 'Your progress', exact: true }).click()
  await expect(page.locator('.history-row')).toHaveCount(1)
  await page.reload()
  await page.getByRole('button', { name: 'Your progress', exact: true }).click()
  await expect(page.locator('.history-row')).toHaveCount(1)
})

test('mobile layouts expose every tool without horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  for (const label of [
    'Learning path',
    'Guitar tuner',
    'Chord studio',
    'Rhythm lab',
    'Your progress',
    'Input calibration',
    'Settings',
    'Overview',
  ]) {
    await page.getByRole('button', { name: label, exact: true }).filter({ visible: true }).click()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
  }
  await page.screenshot({ path: '.tools/mobile.png', fullPage: true })
})
