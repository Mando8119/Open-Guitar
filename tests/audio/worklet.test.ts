import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { expect, it } from 'vitest'

it('worklet buffers overlapping mono frames without writing microphone samples to its output', () => {
  const messages: { samples: Float32Array; endTime: number }[] = []
  let Processor!: new () => {
    process: (inputs: Float32Array[][], outputs: Float32Array[][]) => boolean
  }
  class BaseProcessor {
    port = {
      postMessage: (message: { samples: Float32Array; endTime: number }) => messages.push(message),
    }
  }
  const scope = vm.createContext({
    AudioWorkletProcessor: BaseProcessor,
    registerProcessor: (_: string, value: typeof Processor) => {
      Processor = value
    },
    currentFrame: 0,
    sampleRate: 48000,
    Float32Array,
  })
  vm.runInContext(
    readFileSync(new URL('../../src/audio/capture-worklet.js', import.meta.url), 'utf8'),
    scope,
  )
  const processor = new Processor()
  const output = new Float32Array(128)
  for (let block = 0; block < 48; block++) {
    scope.currentFrame = block * 128
    expect(
      processor.process(
        [[new Float32Array(128).fill(0.2), new Float32Array(128).fill(0.4)]],
        [[output]],
      ),
    ).toBe(true)
  }
  expect(messages).toHaveLength(2)
  expect(messages[0].samples).toHaveLength(4096)
  expect(messages[0].samples[0]).toBeCloseTo(0.3)
  expect(messages[1].samples[4095]).toBeCloseTo(0.3)
  expect(messages[0].samples).not.toBe(messages[1].samples)
  expect(messages[0].endTime).toBeCloseTo(4096 / 48000)
  expect(messages[1].endTime).toBeCloseTo(6144 / 48000)
  expect(output.every((sample) => sample === 0)).toBe(true)
})
