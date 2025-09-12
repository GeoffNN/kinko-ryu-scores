import * as Tone from 'tone'

export interface AudioAnalysisResult {
  notes: DetectedNote[]
  tempo: number
  key: string
  confidence: number
}

export interface DetectedNote {
  frequency: number
  amplitude: number
  startTime: number
  duration: number
  pitch: string
  octave: number
  confidence: number
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  async analyzeAudioFile(file: File): Promise<AudioAnalysisResult> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available')
    }

    try {
      // Convert file to audio buffer
      const audioBuffer = await this.fileToAudioBuffer(file)
      
      // Perform analysis
      const notes = await this.detectNotes(audioBuffer)
      const tempo = await this.detectTempo(audioBuffer)
      const key = await this.detectKey(notes)

      return {
        notes,
        tempo,
        key,
        confidence: this.calculateOverallConfidence(notes)
      }
    } catch (error) {
      console.error('Audio analysis failed:', error)
      throw new Error(`Failed to analyze audio: ${error}`)
    }
  }

  async analyzeYouTubeAudio(url: string): Promise<AudioAnalysisResult> {
    // This would typically involve extracting audio from YouTube
    // For now, return a mock result
    return {
      notes: [],
      tempo: 120,
      key: 'C',
      confidence: 0.7
    }
  }

  private async fileToAudioBuffer(file: File): Promise<AudioBuffer> {
    const arrayBuffer = await file.arrayBuffer()
    return this.audioContext!.decodeAudioData(arrayBuffer)
  }

  private async detectNotes(audioBuffer: AudioBuffer): Promise<DetectedNote[]> {
    const sampleRate = audioBuffer.sampleRate
    const channelData = audioBuffer.getChannelData(0)
    const notes: DetectedNote[] = []

    // Simplified pitch detection using autocorrelation
    const frameSize = 2048
    const hopSize = 512
    const minFreq = 80 // Lowest note frequency
    const maxFreq = 2000 // Highest note frequency

    for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
      const frame = channelData.slice(i, i + frameSize)
      const frequency = this.autocorrelationPitchDetection(frame, sampleRate, minFreq, maxFreq)
      
      if (frequency > 0) {
        const amplitude = this.calculateRMS(frame)
        const timeStamp = i / sampleRate
        
        if (amplitude > 0.01) { // Amplitude threshold
          const { pitch, octave } = this.frequencyToPitch(frequency)
          
          notes.push({
            frequency,
            amplitude,
            startTime: timeStamp,
            duration: hopSize / sampleRate,
            pitch,
            octave,
            confidence: this.calculatePitchConfidence(frequency, frame)
          })
        }
      }
    }

    return this.consolidateNotes(notes)
  }

  private autocorrelationPitchDetection(
    buffer: Float32Array,
    sampleRate: number,
    minFreq: number,
    maxFreq: number
  ): number {
    const minPeriod = Math.floor(sampleRate / maxFreq)
    const maxPeriod = Math.floor(sampleRate / minFreq)
    
    let bestCorrelation = 0
    let bestPeriod = 0

    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0
      
      for (let i = 0; i < buffer.length - period; i++) {
        correlation += buffer[i] * buffer[i + period]
      }
      
      correlation = correlation / (buffer.length - period)
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation
        bestPeriod = period
      }
    }

    return bestPeriod > 0 ? sampleRate / bestPeriod : 0
  }

  private calculateRMS(buffer: Float32Array): number {
    let sum = 0
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i]
    }
    return Math.sqrt(sum / buffer.length)
  }

  private frequencyToPitch(frequency: number): { pitch: string, octave: number } {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const A4_FREQ = 440
    const A4_NOTE = 57 // MIDI note number for A4

    const noteNumber = Math.round(12 * Math.log2(frequency / A4_FREQ) + A4_NOTE)
    const octave = Math.floor(noteNumber / 12) - 1
    const pitchClass = noteNumber % 12
    
    return {
      pitch: noteNames[pitchClass],
      octave
    }
  }

  private calculatePitchConfidence(frequency: number, buffer: Float32Array): number {
    // Simple confidence based on signal clarity
    const rms = this.calculateRMS(buffer)
    const peak = Math.max(...Array.from(buffer).map(Math.abs))
    
    const clarity = rms / (peak || 1)
    return Math.min(clarity * 2, 1) // Normalize to 0-1
  }

  private consolidateNotes(notes: DetectedNote[]): DetectedNote[] {
    const consolidated: DetectedNote[] = []
    const tolerance = 0.05 // 50ms tolerance for note grouping
    
    let currentNote: DetectedNote | null = null
    
    for (const note of notes) {
      if (!currentNote) {
        currentNote = { ...note }
      } else if (
        Math.abs(note.frequency - currentNote.frequency) < 5 && // Similar frequency
        note.startTime - (currentNote.startTime + currentNote.duration) < tolerance
      ) {
        // Extend current note
        currentNote.duration = note.startTime + note.duration - currentNote.startTime
        currentNote.amplitude = Math.max(currentNote.amplitude, note.amplitude)
      } else {
        consolidated.push(currentNote)
        currentNote = { ...note }
      }
    }
    
    if (currentNote) {
      consolidated.push(currentNote)
    }
    
    return consolidated
  }

  private async detectTempo(audioBuffer: AudioBuffer): Promise<number> {
    // Enhanced tempo detection using onset detection
    const channelData = audioBuffer.getChannelData(0)
    const sampleRate = audioBuffer.sampleRate
    const frameSize = 1024
    const hopSize = 512
    
    // Detect onsets using spectral flux
    const onsets = this.detectOnsets(channelData, sampleRate, frameSize, hopSize)
    
    if (onsets.length < 4) {
      return 100 // Default slow tempo for traditional music
    }
    
    // Calculate intervals between onsets
    const intervals = []
    for (let i = 1; i < onsets.length; i++) {
      intervals.push(onsets[i] - onsets[i-1])
    }
    
    // Find median interval
    intervals.sort((a, b) => a - b)
    const medianInterval = intervals[Math.floor(intervals.length / 2)]
    
    // Convert to BPM (beats per minute)
    const bpm = Math.round(60 / medianInterval)
    
    // Clamp to reasonable range for traditional music
    return Math.max(60, Math.min(180, bpm))
  }
  
  private detectOnsets(buffer: Float32Array, sampleRate: number, frameSize: number, hopSize: number): number[] {
    const onsets: number[] = []
    const spectralFlux: number[] = []
    let previousSpectrum: Float32Array | null = null
    
    for (let i = 0; i < buffer.length - frameSize; i += hopSize) {
      const frame = buffer.slice(i, i + frameSize)
      const spectrum = this.computeSpectrum(frame)
      
      if (previousSpectrum) {
        let flux = 0
        for (let j = 0; j < spectrum.length; j++) {
          const diff = spectrum[j] - previousSpectrum[j]
          if (diff > 0) flux += diff
        }
        spectralFlux.push(flux)
      }
      
      previousSpectrum = spectrum
    }
    
    // Peak picking on spectral flux
    const threshold = this.calculateAdaptiveThreshold(spectralFlux)
    
    for (let i = 1; i < spectralFlux.length - 1; i++) {
      if (spectralFlux[i] > threshold &&
          spectralFlux[i] > spectralFlux[i-1] &&
          spectralFlux[i] > spectralFlux[i+1]) {
        onsets.push((i * hopSize) / sampleRate)
      }
    }
    
    return onsets
  }
  
  private computeSpectrum(frame: Float32Array): Float32Array {
    // Simple magnitude spectrum using FFT approximation
    const spectrum = new Float32Array(frame.length / 2)
    
    for (let i = 0; i < spectrum.length; i++) {
      let real = 0, imag = 0
      
      for (let j = 0; j < frame.length; j++) {
        const angle = -2 * Math.PI * i * j / frame.length
        real += frame[j] * Math.cos(angle)
        imag += frame[j] * Math.sin(angle)
      }
      
      spectrum[i] = Math.sqrt(real * real + imag * imag)
    }
    
    return spectrum
  }
  
  private calculateAdaptiveThreshold(spectralFlux: number[]): number {
    const mean = spectralFlux.reduce((sum, val) => sum + val, 0) / spectralFlux.length
    const variance = spectralFlux.reduce((sum, val) => sum + (val - mean) ** 2, 0) / spectralFlux.length
    const stdDev = Math.sqrt(variance)
    
    return mean + stdDev * 0.5 // Adaptive threshold
  }

  private async detectKey(notes: DetectedNote[]): Promise<string> {
    if (notes.length === 0) return 'D' // Default for shakuhachi
    
    // Enhanced key detection using pitch class histogram
    const pitchClassHistogram: { [key: string]: number } = {}
    
    // Count pitch classes (ignore octaves)
    for (const note of notes) {
      const pitchClass = note.pitch
      pitchClassHistogram[pitchClass] = (pitchClassHistogram[pitchClass] || 0) + note.duration
    }
    
    // Shakuhachi-specific key detection
    // Check for common shakuhachi scales
    const shakuhachiKeys = ['D', 'Eb', 'F', 'G', 'A', 'Bb']
    
    let bestKey = 'D'
    let bestScore = 0
    
    for (const key of shakuhachiKeys) {
      const score = this.calculateKeyScore(pitchClassHistogram, key)
      if (score > bestScore) {
        bestScore = score
        bestKey = key
      }
    }
    
    return bestKey
  }
  
  private calculateKeyScore(histogram: { [key: string]: number }, key: string): number {
    // Define scale patterns for shakuhachi in different keys
    const scalePatterns: { [key: string]: string[] } = {
      'D': ['D', 'F', 'G', 'A', 'C'],
      'Eb': ['Eb', 'Gb', 'Ab', 'Bb', 'Db'],
      'F': ['F', 'Ab', 'Bb', 'C', 'Eb'],
      'G': ['G', 'Bb', 'C', 'D', 'F'],
      'A': ['A', 'C', 'D', 'E', 'G'],
      'Bb': ['Bb', 'Db', 'Eb', 'F', 'Ab']
    }
    
    const pattern = scalePatterns[key] || scalePatterns['D']
    let score = 0
    
    for (const pitch of pattern) {
      if (histogram[pitch]) {
        score += histogram[pitch]
      }
    }
    
    return score
  }

  private calculateOverallConfidence(notes: DetectedNote[]): number {
    if (notes.length === 0) return 0
    
    const averageConfidence = notes.reduce((sum, note) => sum + note.confidence, 0) / notes.length
    const noteCount = notes.length
    const density = Math.min(noteCount / 100, 1) // Normalize note density
    
    return averageConfidence * 0.7 + density * 0.3
  }

  dispose() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
  }
}