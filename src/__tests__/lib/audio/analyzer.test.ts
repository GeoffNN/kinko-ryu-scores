import { AudioAnalyzer, DetectedNote } from '@/lib/audio/analyzer'

// Test data generator for simple musical phrases
function generateTestAudioBuffer(notes: { frequency: number; duration: number; amplitude: number }[], sampleRate = 44100): AudioBuffer {
  const totalDuration = notes.reduce((sum, note) => sum + note.duration, 0)
  const totalSamples = Math.floor(totalDuration * sampleRate)
  const buffer = new Float32Array(totalSamples)
  
  let currentSample = 0
  
  for (const note of notes) {
    const noteSamples = Math.floor(note.duration * sampleRate)
    const frequency = note.frequency
    const amplitude = note.amplitude
    
    // Generate sine wave for the note
    for (let i = 0; i < noteSamples; i++) {
      const time = (currentSample + i) / sampleRate
      buffer[currentSample + i] = amplitude * Math.sin(2 * Math.PI * frequency * time)
    }
    
    currentSample += noteSamples
  }
  
  // Mock AudioBuffer
  return {
    sampleRate,
    length: totalSamples,
    numberOfChannels: 1,
    duration: totalDuration,
    getChannelData: jest.fn(() => buffer),
    copyFromChannel: jest.fn(),
    copyToChannel: jest.fn()
  } as AudioBuffer
}

describe('AudioAnalyzer', () => {
  let analyzer: AudioAnalyzer
  
  beforeEach(() => {
    analyzer = new AudioAnalyzer()
    // Reset all mocks
    jest.clearAllMocks()
  })
  
  afterEach(() => {
    analyzer.dispose()
  })

  describe('Basic Pitch Detection', () => {
    it('should detect single pure tones correctly', async () => {
      // Test with D4 (shakuhachi ro note)
      const testNotes = [{ frequency: 293.66, duration: 1.0, amplitude: 0.8 }]
      const mockFile = new File(['test'], 'test.wav', { type: 'audio/wav' })
      const testBuffer = generateTestAudioBuffer(testNotes)
      
      // Mock the file processing
      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockResolvedValue(testBuffer)
      
      const result = await analyzer.analyzeAudioFile(mockFile)
      
      expect(result.notes).toHaveLength(1)
      expect(result.notes[0].pitch).toBe('D')
      expect(result.notes[0].octave).toBe(4)
      expect(result.notes[0].frequency).toBeCloseTo(293.66, 1)
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    it('should detect shakuhachi scale notes accurately', async () => {
      // Test shakuhachi pentatonic scale: D, F, G, A, C
      const shakuhachiScale = [
        { frequency: 293.66, duration: 0.5, amplitude: 0.8 }, // D4 (ro)
        { frequency: 349.23, duration: 0.5, amplitude: 0.8 }, // F4 (tsu)
        { frequency: 392.00, duration: 0.5, amplitude: 0.8 }, // G4 (re)
        { frequency: 440.00, duration: 0.5, amplitude: 0.8 }, // A4 (chi)
        { frequency: 523.25, duration: 0.5, amplitude: 0.8 }, // C5 (ri)
      ]
      
      const mockFile = new File(['test'], 'scale.wav', { type: 'audio/wav' })
      const testBuffer = generateTestAudioBuffer(shakuhachiScale)
      
      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockResolvedValue(testBuffer)
      
      const result = await analyzer.analyzeAudioFile(mockFile)
      
      expect(result.notes).toHaveLength(5)
      expect(result.notes.map(n => n.pitch)).toEqual(['D', 'F', 'G', 'A', 'C'])
      expect(result.notes.map(n => n.octave)).toEqual([4, 4, 4, 4, 5])
      expect(result.key).toBe('D') // Should detect D as the key
    })

    it('should handle frequency variations within tolerance', async () => {
      // Test slightly detuned notes (common in traditional music)
      const detunedNotes = [
        { frequency: 290, duration: 0.8, amplitude: 0.7 }, // Slightly flat D4
        { frequency: 295, duration: 0.8, amplitude: 0.7 }, // Slightly sharp D4
      ]
      
      const mockFile = new File(['test'], 'detuned.wav', { type: 'audio/wav' })
      const testBuffer = generateTestAudioBuffer(detunedNotes)
      
      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockResolvedValue(testBuffer)
      
      const result = await analyzer.analyzeAudioFile(mockFile)
      
      expect(result.notes).toHaveLength(2)
      result.notes.forEach(note => {
        expect(note.pitch).toBe('D')
        expect(note.octave).toBe(4)
      })
    })
  })

  describe('Tempo Detection', () => {
    it('should detect slow tempo typical of traditional music', async () => {
      const slowPhrase = [
        { frequency: 293.66, duration: 2.0, amplitude: 0.8 },
        { frequency: 349.23, duration: 1.5, amplitude: 0.7 },
        { frequency: 392.00, duration: 2.5, amplitude: 0.9 },
      ]
      
      const mockFile = new File(['test'], 'slow.wav', { type: 'audio/wav' })
      const testBuffer = generateTestAudioBuffer(slowPhrase)
      
      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockResolvedValue(testBuffer)
      
      const result = await analyzer.analyzeAudioFile(mockFile)
      
      expect(result.tempo).toBeGreaterThanOrEqual(60)
      expect(result.tempo).toBeLessThanOrEqual(120)
    })

    it('should handle varying note durations', async () => {
      const varyingPhrase = [
        { frequency: 293.66, duration: 0.25, amplitude: 0.8 }, // Quick grace note
        { frequency: 349.23, duration: 1.5, amplitude: 0.8 },  // Long note
        { frequency: 392.00, duration: 0.5, amplitude: 0.8 },  // Medium note
        { frequency: 440.00, duration: 2.0, amplitude: 0.8 },  // Very long note
      ]
      
      const mockFile = new File(['test'], 'varying.wav', { type: 'audio/wav' })
      const testBuffer = generateTestAudioBuffer(varyingPhrase)
      
      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockResolvedValue(testBuffer)
      
      const result = await analyzer.analyzeAudioFile(mockFile)
      
      expect(result.notes).toHaveLength(4)
      expect(result.tempo).toBeGreaterThan(0)
      expect(result.tempo).toBeLessThan(200)
    })
  })

  describe('Key Detection', () => {
    it('should detect D major scale (natural shakuhachi key)', async () => {
      const dMajorPhrase = [
        { frequency: 293.66, duration: 0.5, amplitude: 0.8 }, // D
        { frequency: 349.23, duration: 0.5, amplitude: 0.8 }, // F
        { frequency: 392.00, duration: 0.5, amplitude: 0.8 }, // G
        { frequency: 440.00, duration: 0.5, amplitude: 0.8 }, // A
        { frequency: 523.25, duration: 0.5, amplitude: 0.8 }, // C
        { frequency: 293.66, duration: 0.8, amplitude: 0.9 }, // D (ending)
      ]
      
      const mockFile = new File(['test'], 'dmajor.wav', { type: 'audio/wav' })
      const testBuffer = generateTestAudioBuffer(dMajorPhrase)
      
      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockResolvedValue(testBuffer)
      
      const result = await analyzer.analyzeAudioFile(mockFile)
      
      expect(result.key).toBe('D')
      expect(result.confidence).toBeGreaterThan(0.6)
    })

    it('should detect alternative shakuhachi keys', async () => {
      const gPhraseNotes = [
        { frequency: 392.00, duration: 0.5, amplitude: 0.8 }, // G
        { frequency: 466.16, duration: 0.5, amplitude: 0.8 }, // Bb
        { frequency: 523.25, duration: 0.5, amplitude: 0.8 }, // C
        { frequency: 587.33, duration: 0.5, amplitude: 0.8 }, // D
        { frequency: 698.46, duration: 0.5, amplitude: 0.8 }, // F
        { frequency: 392.00, duration: 0.8, amplitude: 0.9 }, // G (ending)
      ]
      
      const mockFile = new File(['test'], 'gkey.wav', { type: 'audio/wav' })
      const testBuffer = generateTestAudioBuffer(gPhraseNotes)
      
      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockResolvedValue(testBuffer)
      
      const result = await analyzer.analyzeAudioFile(mockFile)
      
      expect(result.key).toBe('G')
    })
  })

  describe('Note Consolidation', () => {
    it('should merge similar consecutive notes', async () => {
      // Simulate a sustained note with slight frequency variations
      const sustainedNote = [
        { frequency: 293.5, duration: 0.3, amplitude: 0.8 },
        { frequency: 294.0, duration: 0.3, amplitude: 0.8 },
        { frequency: 293.8, duration: 0.4, amplitude: 0.8 },
      ]
      
      const mockFile = new File(['test'], 'sustained.wav', { type: 'audio/wav' })
      const testBuffer = generateTestAudioBuffer(sustainedNote)
      
      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockResolvedValue(testBuffer)
      
      const result = await analyzer.analyzeAudioFile(mockFile)
      
      // Should consolidate into fewer notes than the original fragments
      expect(result.notes.length).toBeLessThanOrEqual(2)
      
      // The consolidated note should have longer duration
      const totalInputDuration = sustainedNote.reduce((sum, note) => sum + note.duration, 0)
      const totalOutputDuration = result.notes.reduce((sum, note) => sum + note.duration, 0)
      expect(totalOutputDuration).toBeCloseTo(totalInputDuration, 1)
    })

    it('should preserve distinct notes with gaps', async () => {
      const separateNotes = [
        { frequency: 293.66, duration: 0.5, amplitude: 0.8 }, // D4
        { frequency: 0, duration: 0.2, amplitude: 0.0 },       // Silence gap
        { frequency: 440.00, duration: 0.5, amplitude: 0.8 }, // A4
      ]
      
      const mockFile = new File(['test'], 'separate.wav', { type: 'audio/wav' })
      const testBuffer = generateTestAudioBuffer(separateNotes)
      
      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockResolvedValue(testBuffer)
      
      const result = await analyzer.analyzeAudioFile(mockFile)
      
      expect(result.notes).toHaveLength(2)
      expect(result.notes[0].pitch).toBe('D')
      expect(result.notes[1].pitch).toBe('A')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty audio files', async () => {
      const emptyBuffer = generateTestAudioBuffer([])
      const mockFile = new File([''], 'empty.wav', { type: 'audio/wav' })
      
      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockResolvedValue(emptyBuffer)
      
      const result = await analyzer.analyzeAudioFile(mockFile)
      
      expect(result.notes).toHaveLength(0)
      expect(result.confidence).toBe(0)
      expect(result.key).toBe('D') // Default key
      expect(result.tempo).toBeGreaterThan(0) // Should have some default tempo
    })

    it('should handle very quiet audio', async () => {
      const quietNotes = [
        { frequency: 293.66, duration: 1.0, amplitude: 0.005 }, // Below threshold
      ]
      
      const mockFile = new File(['test'], 'quiet.wav', { type: 'audio/wav' })
      const testBuffer = generateTestAudioBuffer(quietNotes)
      
      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockResolvedValue(testBuffer)
      
      const result = await analyzer.analyzeAudioFile(mockFile)
      
      // Should filter out notes below amplitude threshold
      expect(result.notes.length).toBeLessThanOrEqual(1)
    })

    it('should handle frequencies outside shakuhachi range', async () => {
      const outOfRangeNotes = [
        { frequency: 100, duration: 0.5, amplitude: 0.8 },    // Too low
        { frequency: 2500, duration: 0.5, amplitude: 0.8 },   // Too high
        { frequency: 440, duration: 0.5, amplitude: 0.8 },    // In range
      ]
      
      const mockFile = new File(['test'], 'range.wav', { type: 'audio/wav' })
      const testBuffer = generateTestAudioBuffer(outOfRangeNotes)
      
      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockResolvedValue(testBuffer)
      
      const result = await analyzer.analyzeAudioFile(mockFile)
      
      // Should still detect notes, but they'll be mapped to closest valid frequencies
      expect(result.notes.length).toBeGreaterThan(0)
    })

    it('should handle malformed audio files gracefully', async () => {
      const mockFile = new File(['invalid'], 'bad.wav', { type: 'audio/wav' })
      
      // Mock decodeAudioData to reject
      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockRejectedValue(new Error('Invalid audio format'))
      
      await expect(analyzer.analyzeAudioFile(mockFile)).rejects.toThrow('Failed to analyze audio')
    })
  })

  describe('YouTube Audio Analysis', () => {
    it('should return mock results for YouTube URLs', async () => {
      const result = await analyzer.analyzeYouTubeAudio('https://youtube.com/watch?v=test')
      
      expect(result).toEqual({
        notes: [],
        tempo: 120,
        key: 'C',
        confidence: 0.7
      })
    })
  })

  describe('Performance and Memory', () => {
    it('should handle reasonably long audio files', async () => {
      // Simulate a 10-second audio file
      const longPhrase = []
      for (let i = 0; i < 50; i++) { // 50 notes over 10 seconds
        longPhrase.push({
          frequency: 293.66 + (i % 5) * 50, // Vary frequency
          duration: 0.2,
          amplitude: 0.7
        })
      }
      
      const mockFile = new File(['test'], 'long.wav', { type: 'audio/wav' })
      const testBuffer = generateTestAudioBuffer(longPhrase)
      
      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockResolvedValue(testBuffer)
      
      const startTime = Date.now()
      const result = await analyzer.analyzeAudioFile(mockFile)
      const processingTime = Date.now() - startTime
      
      expect(result.notes.length).toBeGreaterThan(0)
      expect(processingTime).toBeLessThan(5000) // Should process within 5 seconds
    })
  })

  describe('Internal Methods', () => {
    it('should calculate RMS correctly', () => {
      const testBuffer = new Float32Array([0.5, -0.5, 0.8, -0.3, 0.1])
      const rms = (analyzer as any).calculateRMS(testBuffer)
      
      const expectedRms = Math.sqrt((0.25 + 0.25 + 0.64 + 0.09 + 0.01) / 5)
      expect(rms).toBeCloseTo(expectedRms, 3)
    })

    it('should convert frequency to pitch correctly', () => {
      const testCases = [
        { freq: 440, expectedPitch: 'A', expectedOctave: 4 },
        { freq: 293.66, expectedPitch: 'D', expectedOctave: 4 },
        { freq: 523.25, expectedPitch: 'C', expectedOctave: 5 },
      ]
      
      testCases.forEach(({ freq, expectedPitch, expectedOctave }) => {
        const result = (analyzer as any).frequencyToPitch(freq)
        expect(result.pitch).toBe(expectedPitch)
        expect(result.octave).toBe(expectedOctave)
      })
    })

    it('should calculate pitch confidence based on signal clarity', () => {
      const clearSignal = new Float32Array([0.8, 0.8, 0.8, 0.8, 0.8])
      const noisySignal = new Float32Array([0.1, 0.9, 0.2, 0.8, 0.3])
      
      const clearConfidence = (analyzer as any).calculatePitchConfidence(440, clearSignal)
      const noisyConfidence = (analyzer as any).calculatePitchConfidence(440, noisySignal)
      
      expect(clearConfidence).toBeGreaterThan(noisyConfidence)
      expect(clearConfidence).toBeLessThanOrEqual(1)
      expect(noisyConfidence).toBeGreaterThanOrEqual(0)
    })
  })
})