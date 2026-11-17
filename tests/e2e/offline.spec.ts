import { expect, test } from '@playwright/test'

test('production app and analysis assets are precached for offline use', async ({
  page,
  context,
}) => {
  await page.goto('http://127.0.0.1:4173')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
          once: true,
        }),
      )
  })
  const cached = await page.evaluate(async () => {
    const names = await caches.keys()
    const cache = await caches.open(names.find((name) => name.startsWith('openguitar-'))!)
    return (await cache.keys()).map((request) => new URL(request.url).pathname)
  })
  expect(cached.some((url) => /dsp-worker.*\.js$/.test(url))).toBe(true)
  expect(cached.some((url) => /index.*\.css$/.test(url))).toBe(true)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Good to have you here.' })).toBeVisible()
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name: /Learning path/ })
    .click()
  await expect(page.getByRole('heading', { name: 'Every note is a step forward.' })).toBeVisible()
  await page.getByRole('button', { name: 'Guitar tuner', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Good music starts in tune.' })).toBeVisible()
  await page.getByRole('button', { name: 'Chord studio', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'E minor', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Rhythm lab', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'A steady little habit.' })).toBeVisible()
  const result = await page.evaluate(
    async (workerPath) => {
      const worker = new Worker(workerPath!, { type: 'module' })
      try {
        return await new Promise<{ status: string; midi: number }>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Offline DSP timed out')), 5000)
          worker.onmessage = (event) => {
            clearTimeout(timeout)
            resolve(event.data)
          }
          worker.onerror = () => {
            clearTimeout(timeout)
            reject(new Error('Offline DSP failed'))
          }
          const samples = Float32Array.from(
            { length: 4096 },
            (_, i) => 0.3 * Math.sin((2 * Math.PI * 82.406889 * i) / 48000),
          )
          worker.postMessage({
            samples,
            sampleRate: 48000,
            timestamp: performance.now(),
            noiseFloor: 0.008,
          })
        })
      } finally {
        worker.terminate()
      }
    },
    cached.find((url) => /dsp-worker.*\.js$/.test(url)),
  )
  expect(result).toMatchObject({ status: 'detected', midi: 40 })
})
