import '@testing-library/jest-dom'

// Mock Web Audio API for testing
global.AudioContext = jest.fn(() => ({
  createAnalyser: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    fftSize: 2048,
    frequencyBinCount: 1024,
    getByteFrequencyData: jest.fn(),
    getFloatFrequencyData: jest.fn(),
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: { value: 1, setValueAtTime: jest.fn() },
  })),
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { value: 440, setValueAtTime: jest.fn() },
    type: 'sine',
  })),
  decodeAudioData: jest.fn(() => Promise.resolve({
    sampleRate: 44100,
    length: 44100,
    numberOfChannels: 1,
    getChannelData: jest.fn(() => new Float32Array(44100)),
  })),
  close: jest.fn(),
  state: 'running',
  sampleRate: 44100,
}))

// Mock window.webkitAudioContext
global.webkitAudioContext = global.AudioContext

// Mock File API
global.File = class File {
  constructor(fileBits, fileName, options = {}) {
    this.bits = fileBits
    this.name = fileName
    this.type = options.type || ''
    this.size = fileBits.reduce((size, bit) => size + (bit.length || bit.byteLength || 0), 0)
    this.lastModified = Date.now()
  }

  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(this.size))
  }

  text() {
    return Promise.resolve(this.bits.join(''))
  }
}

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = jest.fn()

// Mock canvas for PDF generation
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 100 })),
  font: '',
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  rect: jest.fn(),
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  textAlign: 'center',
  textBaseline: 'middle'
}))

// Mock canvas toDataURL
HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,mock')

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16))
global.cancelAnimationFrame = jest.fn(clearTimeout)

// Suppress console.error for expected test errors
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})