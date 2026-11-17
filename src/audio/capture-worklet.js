/* global AudioWorkletProcessor, registerProcessor, currentFrame, sampleRate */

// Capture only. This processor never writes to its output channels.
class GuitarCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.frame = new Float32Array(4096)
    this.filled = 0
  }

  process(inputs) {
    const channels = inputs[0]
    if (!channels || channels.length === 0) return true
    const length = channels[0].length
    for (let i = 0; i < length; i++) {
      let value = 0
      for (let channel = 0; channel < channels.length; channel++) value += channels[channel][i]
      this.frame[this.filled++] = value / channels.length
      if (this.filled === this.frame.length) {
        const frame = this.frame.slice()
        this.port.postMessage({ samples: frame, endTime: (currentFrame + i + 1) / sampleRate }, [
          frame.buffer,
        ])
        this.frame.copyWithin(0, 2048)
        this.filled = 2048
      }
    }
    return true
  }
}

registerProcessor('guitar-capture', GuitarCaptureProcessor)
