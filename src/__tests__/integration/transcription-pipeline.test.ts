import { AudioAnalyzer, DetectedNote } from '@/lib/audio/analyzer'
import { KinkoMapper } from '@/lib/notation/kinko-mapper'
import { KinkoScoreRenderer } from '@/lib/notation/score-renderer'
import { KinkoScore, KinkoNote, KinkoPhrase } from '@/types'

// Test data: Generate synthetic audio for known musical phrases
function generateTestAudioForPhrase(
  notes: { frequency: number; duration: number; amplitude: number }[],
  sampleRate = 44100
): File {
  // Create mock audio file representing the given notes
  const totalDuration = notes.reduce((sum, note) => sum + note.duration, 0)
  const mockAudioData = `mock-audio-${totalDuration}s-${notes.length}notes`
  
  return new File([mockAudioData], 'test-phrase.wav', { type: 'audio/wav' })
}

// Expected test phrases with known Kinko-ryu mappings
const TEST_PHRASES = {
  // Simple ascending scale passage
  basicScale: {
    audioNotes: [
      { frequency: 293.66, duration: 0.8, amplitude: 0.8 }, // D4 -> ro
      { frequency: 349.23, duration: 0.6, amplitude: 0.7 }, // F4 -> tsu
      { frequency: 392.00, duration: 0.7, amplitude: 0.8 }, // G4 -> re
      { frequency: 440.00, duration: 0.5, amplitude: 0.7 }, // A4 -> chi
      { frequency: 523.25, duration: 1.0, amplitude: 0.9 }, // C5 -> ri (long ending)
    ],
    expectedKinkoNotes: ['ロ', 'ツ', 'レ', 'チ', 'リ'],
    expectedFingerings: ['ro', 'tsu', 're', 'chi', 'ri'],
    description: 'Basic shakuhachi pentatonic scale'
  },

  // Traditional phrase with ornaments
  ornamentedPhrase: {
    audioNotes: [
      { frequency: 293.66, duration: 0.3, amplitude: 0.95 }, // Strong attack (accent)
      { frequency: 349.23, duration: 2.5, amplitude: 0.8 },  // Long sustained (vibrato potential)
      { frequency: 285, duration: 0.4, amplitude: 0.6 },     // Bent down (meri)
      { frequency: 392.00, duration: 0.8, amplitude: 0.8 },  // Resolution
    ],
    expectedTechniques: ['accent', 'vibrato', 'meri'],
    expectedOrnaments: ['＞', '—', '⌒'],
    description: 'Phrase with traditional ornaments and techniques'
  },

  // Phrase with breathing and phrasing
  breathingPhrase: {
    audioNotes: [
      { frequency: 293.66, duration: 0.5, amplitude: 0.8 }, // ro
      { frequency: 349.23, duration: 0.4, amplitude: 0.7 }, // tsu
      { frequency: 392.00, duration: 0.6, amplitude: 0.8 }, // re
      // Long gap (1.2s) to trigger phrase break
      { frequency: 440.00, duration: 0.7, amplitude: 0.8 }, // chi (new phrase)
      { frequency: 523.25, duration: 1.2, amplitude: 0.9 }, // ri (long ending)
    ],
    gaps: [0, 0, 0, 1.2, 0], // Gap durations between notes
    expectedPhrases: 2,
    description: 'Multi-phrase passage with natural breathing points'
  },

  // High-register kan notes
  kanPhrase: {
    audioNotes: [
      { frequency: 587.33, duration: 0.8, amplitude: 0.7 }, // D5 -> kan-ro
      { frequency: 698.46, duration: 0.6, amplitude: 0.6 }, // F5 -> kan-tsu
      { frequency: 783.99, duration: 0.7, amplitude: 0.8 }, // G5 -> kan-re
      { frequency: 880.00, duration: 0.9, amplitude: 0.8 }, // A5 -> kan-chi
    ],
    expectedKatakana: ['口', '乙', '工', '尺'],
    expectedFingerings: ['kan-ro', 'kan-tsu', 'kan-re', 'kan-chi'],
    description: 'High register (kan) passage'
  },

  // Chromatic/meri variations
  chromaticPhrase: {
    audioNotes: [
      { frequency: 293.66, duration: 0.5, amplitude: 0.8 }, // D4 -> ro
      { frequency: 311.13, duration: 0.6, amplitude: 0.7 }, // D#4 -> ro-meri
      { frequency: 349.23, duration: 0.5, amplitude: 0.8 }, // F4 -> tsu
      { frequency: 369.99, duration: 0.7, amplitude: 0.7 }, // F#4 -> tsu-meri
      { frequency: 392.00, duration: 0.8, amplitude: 0.8 }, // G4 -> re
    ],
    expectedKatakana: ['ロ', 'ロ◯', 'ツ', 'ツ◯', 'レ'],
    expectedFingerings: ['ro', 'ro-meri', 'tsu', 'tsu-meri', 're'],
    description: 'Chromatic passage with meri variations'
  }
}

describe('Complete Transcription Pipeline Integration Tests', () => {
  let analyzer: AudioAnalyzer
  let canvas: HTMLCanvasElement
  let renderer: KinkoScoreRenderer

  beforeEach(() => {
    analyzer = new AudioAnalyzer()
    canvas = document.createElement('canvas')
    renderer = new KinkoScoreRenderer(canvas)
    
    jest.clearAllMocks()
  })

  afterEach(() => {
    analyzer.dispose()
  })

  describe('End-to-End Audio to Kinko Transcription', () => {
    it('should correctly transcribe basic shakuhachi scale', async () => {
      const testData = TEST_PHRASES.basicScale
      const mockFile = generateTestAudioForPhrase(testData.audioNotes)
      
      // Mock the audio analysis to return our test data
      const mockDetectedNotes: DetectedNote[] = testData.audioNotes.map((note, index) => ({
        frequency: note.frequency,
        amplitude: note.amplitude,
        startTime: index * 0.8,
        duration: note.duration,
        pitch: ['D', 'F', 'G', 'A', 'C'][index],
        octave: [4, 4, 4, 4, 5][index],
        confidence: 0.85
      }))

      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockResolvedValue({
        sampleRate: 44100,
        length: 44100,
        numberOfChannels: 1,
        getChannelData: jest.fn(() => new Float32Array(44100))
      })
      jest.spyOn(analyzer as any, 'detectNotes').mockResolvedValue(mockDetectedNotes)
      jest.spyOn(analyzer as any, 'detectTempo').mockResolvedValue(100)
      jest.spyOn(analyzer as any, 'detectKey').mockResolvedValue('D')

      // Run complete pipeline
      const analysisResult = await analyzer.analyzeAudioFile(mockFile)
      const kinkoScore = KinkoMapper.convertToKinko(analysisResult.notes)
      
      // Verify the complete transcription
      expect(analysisResult.notes).toHaveLength(5)
      expect(analysisResult.key).toBe('D')
      expect(analysisResult.tempo).toBe(100)
      
      expect(kinkoScore.title).toBe('転写された楽曲')
      expect(kinkoScore.phrases).toHaveLength(1)
      expect(kinkoScore.phrases[0].notes).toHaveLength(5)
      
      // Verify correct note mapping
      const actualKatakana = kinkoScore.phrases[0].notes.map(note => note.katakana)
      const actualFingerings = kinkoScore.phrases[0].notes.map(note => note.fingering)
      
      expect(actualKatakana).toEqual(testData.expectedKinkoNotes)
      expect(actualFingerings).toEqual(testData.expectedFingerings)
      
      // Verify breath mark
      expect(kinkoScore.phrases[0].breath).toBe(true)
      
      // Test rendering doesn't throw
      expect(() => renderer.renderScore(kinkoScore)).not.toThrow()
    })

    it('should handle ornamented phrases with techniques', async () => {
      const testData = TEST_PHRASES.ornamentedPhrase
      const mockFile = generateTestAudioForPhrase(testData.audioNotes)
      
      const mockDetectedNotes: DetectedNote[] = [
        { frequency: 293.66, amplitude: 0.95, startTime: 0, duration: 0.3, pitch: 'D', octave: 4, confidence: 0.9 },
        { frequency: 349.23, amplitude: 0.8, startTime: 0.3, duration: 2.5, pitch: 'F', octave: 4, confidence: 0.5 }, // Low confidence for vibrato
        { frequency: 285, amplitude: 0.6, startTime: 2.8, duration: 0.4, pitch: 'D', octave: 4, confidence: 0.8 },     // Bent down
        { frequency: 392.00, amplitude: 0.8, startTime: 3.2, duration: 0.8, pitch: 'G', octave: 4, confidence: 0.85 },
      ]

      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockResolvedValue({
        sampleRate: 44100,
        length: 44100,
        numberOfChannels: 1,
        getChannelData: jest.fn(() => new Float32Array(44100))
      })
      jest.spyOn(analyzer as any, 'detectNotes').mockResolvedValue(mockDetectedNotes)

      const analysisResult = await analyzer.analyzeAudioFile(mockFile)
      const kinkoScore = KinkoMapper.convertToKinko(analysisResult.notes)
      
      const notes = kinkoScore.phrases[0].notes
      
      // First note: strong attack should have accent
      expect(notes[0].ornaments).toContain('＞')
      
      // Second note: long duration and low confidence should have long tone and vibrato
      expect(notes[1].ornaments).toContain('—')
      expect(notes[1].ornaments).toContain('⌒')
      
      // Third note: frequency deviation should detect meri technique
      expect(notes[2].techniques).toContain('meri')
      
      // Test that rendering handles ornaments correctly
      renderer.renderScore(kinkoScore)
      const ctx = canvas.getContext('2d')!
      
      expect(ctx.fillText).toHaveBeenCalledWith('＞', expect.any(Number), expect.any(Number))
      expect(ctx.fillText).toHaveBeenCalledWith('—', expect.any(Number), expect.any(Number))
      expect(ctx.fillText).toHaveBeenCalledWith('⌒', expect.any(Number), expect.any(Number))
      expect(ctx.fillText).toHaveBeenCalledWith('↓', expect.any(Number), expect.any(Number)) // meri indicator
    })

    it('should correctly handle phrase boundaries and breathing', async () => {
      const testData = TEST_PHRASES.breathingPhrase
      const mockFile = generateTestAudioForPhrase(testData.audioNotes)
      
      // Create notes with a significant gap between phrase 1 and 2
      const mockDetectedNotes: DetectedNote[] = [
        { frequency: 293.66, amplitude: 0.8, startTime: 0.0, duration: 0.5, pitch: 'D', octave: 4, confidence: 0.8 },
        { frequency: 349.23, amplitude: 0.7, startTime: 0.5, duration: 0.4, pitch: 'F', octave: 4, confidence: 0.8 },
        { frequency: 392.00, amplitude: 0.8, startTime: 0.9, duration: 0.6, pitch: 'G', octave: 4, confidence: 0.8 },
        // 1.2 second gap here
        { frequency: 440.00, amplitude: 0.8, startTime: 2.7, duration: 0.7, pitch: 'A', octave: 4, confidence: 0.8 },
        { frequency: 523.25, amplitude: 0.9, startTime: 3.4, duration: 1.2, pitch: 'C', octave: 5, confidence: 0.8 },
      ]

      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockResolvedValue({
        sampleRate: 44100,
        length: 44100,
        numberOfChannels: 1,
        getChannelData: jest.fn(() => new Float32Array(44100))
      })
      jest.spyOn(analyzer as any, 'detectNotes').mockResolvedValue(mockDetectedNotes)

      const analysisResult = await analyzer.analyzeAudioFile(mockFile)
      const kinkoScore = KinkoMapper.convertToKinko(analysisResult.notes)
      
      // Should create two phrases due to the gap
      expect(kinkoScore.phrases.length).toBe(testData.expectedPhrases)
      
      // First phrase: D, F, G (3 notes)
      expect(kinkoScore.phrases[0].notes).toHaveLength(3)
      expect(kinkoScore.phrases[0].breath).toBe(true)
      
      // Second phrase: A, C (2 notes)
      expect(kinkoScore.phrases[1].notes).toHaveLength(2)
      expect(kinkoScore.phrases[1].breath).toBe(true)
      
      // Verify note content
      expect(kinkoScore.phrases[0].notes.map(n => n.katakana)).toEqual(['ロ', 'ツ', 'レ'])
      expect(kinkoScore.phrases[1].notes.map(n => n.katakana)).toEqual(['チ', 'リ'])
      
      // Test rendering of multiple phrases
      renderer.renderScore(kinkoScore)
      const ctx = canvas.getContext('2d')!
      
      // Should render two breath marks
      const breathCalls = (ctx.fillText as jest.Mock).mock.calls
        .filter(call => call[0] === '、')
      expect(breathCalls).toHaveLength(2)
    })

    it('should handle high-register (kan) notes correctly', async () => {
      const testData = TEST_PHRASES.kanPhrase
      const mockFile = generateTestAudioForPhrase(testData.audioNotes)
      
      const mockDetectedNotes: DetectedNote[] = testData.audioNotes.map((note, index) => ({
        frequency: note.frequency,
        amplitude: note.amplitude,
        startTime: index * 0.8,
        duration: note.duration,
        pitch: ['D', 'F', 'G', 'A'][index],
        octave: [5, 5, 5, 5][index],
        confidence: 0.8
      }))

      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockResolvedValue({
        sampleRate: 44100,
        length: 44100,
        numberOfChannels: 1,
        getChannelData: jest.fn(() => new Float32Array(44100))
      })
      jest.spyOn(analyzer as any, 'detectNotes').mockResolvedValue(mockDetectedNotes)

      const analysisResult = await analyzer.analyzeAudioFile(mockFile)
      const kinkoScore = KinkoMapper.convertToKinko(analysisResult.notes)
      
      const notes = kinkoScore.phrases[0].notes
      
      expect(notes).toHaveLength(4)
      expect(notes.map(n => n.katakana)).toEqual(testData.expectedKatakana)
      expect(notes.map(n => n.fingering)).toEqual(testData.expectedFingerings)
      
      // Verify rendering of kan characters
      renderer.renderScore(kinkoScore)
      const ctx = canvas.getContext('2d')!
      
      testData.expectedKatakana.forEach(katakana => {
        expect(ctx.fillText).toHaveBeenCalledWith(katakana, expect.any(Number), expect.any(Number))
      })
    })

    it('should handle chromatic passages with meri variations', async () => {
      const testData = TEST_PHRASES.chromaticPhrase
      const mockFile = generateTestAudioForPhrase(testData.audioNotes)
      
      const mockDetectedNotes: DetectedNote[] = testData.audioNotes.map((note, index) => ({
        frequency: note.frequency,
        amplitude: note.amplitude,
        startTime: index * 0.6,
        duration: note.duration,
        pitch: ['D', 'D#', 'F', 'F#', 'G'][index],
        octave: 4,
        confidence: 0.8
      }))

      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockResolvedValue({
        sampleRate: 44100,
        length: 44100,
        numberOfChannels: 1,
        getChannelData: jest.fn(() => new Float32Array(44100))
      })
      jest.spyOn(analyzer as any, 'detectNotes').mockResolvedValue(mockDetectedNotes)

      const analysisResult = await analyzer.analyzeAudioFile(mockFile)
      const kinkoScore = KinkoMapper.convertToKinko(analysisResult.notes)
      
      const notes = kinkoScore.phrases[0].notes
      
      expect(notes).toHaveLength(5)
      expect(notes.map(n => n.katakana)).toEqual(testData.expectedKatakana)
      expect(notes.map(n => n.fingering)).toEqual(testData.expectedFingerings)
      
      // Verify meri symbols render correctly
      renderer.renderScore(kinkoScore)
      const ctx = canvas.getContext('2d')!
      
      expect(ctx.fillText).toHaveBeenCalledWith('ロ◯', expect.any(Number), expect.any(Number))
      expect(ctx.fillText).toHaveBeenCalledWith('ツ◯', expect.any(Number), expect.any(Number))
    })
  })

  describe('Western Notation Integration', () => {
    it('should convert Western notation to Kinko and render correctly', () => {
      const westernNotes = [
        { pitch: 'D', octave: 4, duration: 1.0 },
        { pitch: 'F#', octave: 4, duration: 0.5 },
        { pitch: 'G', octave: 4, duration: 0.75 },
        { pitch: 'A', octave: 4, duration: 0.5 },
        { pitch: 'C', octave: 5, duration: 1.5 },
      ]
      
      const kinkoScore = KinkoMapper.convertWesternToKinko(westernNotes)
      
      expect(kinkoScore.phrases).toHaveLength(1)
      expect(kinkoScore.phrases[0].notes).toHaveLength(5)
      
      // Test that F# maps to closest Kinko note (probably tsu-meri)
      const fSharpNote = kinkoScore.phrases[0].notes[1]
      expect(fSharpNote.katakana).toBeTruthy()
      expect(fSharpNote.fingering).toBeTruthy()
      
      // Test complete pipeline with rendering
      expect(() => renderer.renderScore(kinkoScore)).not.toThrow()
      
      const ctx = canvas.getContext('2d')!
      expect(ctx.fillText).toHaveBeenCalledWith(kinkoScore.title, expect.any(Number), expect.any(Number))
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle silent or very quiet audio gracefully', async () => {
      const silentFile = new File(['silent'], 'silent.wav', { type: 'audio/wav' })
      
      // Mock silent/quiet audio analysis
      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockResolvedValue({
        sampleRate: 44100,
        length: 44100,
        numberOfChannels: 1,
        getChannelData: jest.fn(() => new Float32Array(44100).fill(0.001)) // Very quiet
      })
      
      const result = await analyzer.analyzeAudioFile(silentFile)
      const kinkoScore = KinkoMapper.convertToKinko(result.notes)
      
      // Should produce valid but minimal score
      expect(kinkoScore).toBeDefined()
      expect(kinkoScore.phrases).toHaveLength(1)
      expect(kinkoScore.phrases[0].notes).toHaveLength(1)
      expect(kinkoScore.phrases[0].notes[0].fingering).toBe('ro') // Default
      
      // Should render without errors
      expect(() => renderer.renderScore(kinkoScore)).not.toThrow()
    })

    it('should handle corrupted or invalid audio files', async () => {
      const invalidFile = new File(['invalid'], 'corrupted.wav', { type: 'audio/wav' })
      
      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockRejectedValue(new Error('Invalid audio'))
      
      await expect(analyzer.analyzeAudioFile(invalidFile)).rejects.toThrow('Failed to analyze audio')
    })

    it('should handle extremely long passages', async () => {
      // Create a very long phrase (100 notes)
      const longPassage = Array.from({ length: 100 }, (_, i) => ({
        frequency: 293.66 + (i % 10) * 20,
        duration: 0.3,
        amplitude: 0.7
      }))
      
      const mockDetectedNotes: DetectedNote[] = longPassage.map((note, index) => ({
        frequency: note.frequency,
        amplitude: note.amplitude,
        startTime: index * 0.3,
        duration: note.duration,
        pitch: 'D',
        octave: 4,
        confidence: 0.8
      }))

      const kinkoScore = KinkoMapper.convertToKinko(mockDetectedNotes)
      
      // Should break into multiple phrases
      expect(kinkoScore.phrases.length).toBeGreaterThan(5)
      
      // Each phrase should be reasonable length
      kinkoScore.phrases.forEach(phrase => {
        expect(phrase.notes.length).toBeLessThanOrEqual(8)
      })
      
      // Should render without performance issues
      const startTime = Date.now()
      renderer.renderScore(kinkoScore)
      const renderTime = Date.now() - startTime
      
      expect(renderTime).toBeLessThan(1000) // Should render in under 1 second
    })

    it('should handle notes completely outside shakuhachi range', async () => {
      const outOfRangeFile = new File(['test'], 'out-of-range.wav', { type: 'audio/wav' })
      
      const mockDetectedNotes: DetectedNote[] = [
        { frequency: 50, amplitude: 0.8, startTime: 0, duration: 0.5, pitch: 'G', octave: 1, confidence: 0.8 },   // Too low
        { frequency: 3000, amplitude: 0.8, startTime: 0.5, duration: 0.5, pitch: 'G', octave: 8, confidence: 0.8 }, // Too high
        { frequency: 440, amplitude: 0.8, startTime: 1.0, duration: 0.5, pitch: 'A', octave: 4, confidence: 0.8 },  // Valid
      ]

      const kinkoScore = KinkoMapper.convertToKinko(mockDetectedNotes)
      
      // Should still produce a valid score by mapping to closest notes
      expect(kinkoScore.phrases).toHaveLength(1)
      expect(kinkoScore.phrases[0].notes.length).toBeGreaterThan(0)
      
      // All notes should have valid Kinko mappings
      kinkoScore.phrases[0].notes.forEach(note => {
        expect(note.katakana).toBeTruthy()
        expect(note.fingering).toBeTruthy()
        expect(note.pitch).toBeGreaterThan(0)
      })
      
      expect(() => renderer.renderScore(kinkoScore)).not.toThrow()
    })
  })

  describe('Performance and Memory Management', () => {
    it('should process medium-length files efficiently', async () => {
      // Simulate a 30-second audio file with moderate complexity
      const mediumFile = new File(['medium-length'], 'medium.wav', { type: 'audio/wav' })
      
      const mockDetectedNotes: DetectedNote[] = Array.from({ length: 50 }, (_, i) => ({
        frequency: 293.66 + (i % 12) * 30,
        amplitude: 0.7 + Math.random() * 0.2,
        startTime: i * 0.6,
        duration: 0.4 + Math.random() * 0.4,
        pitch: ['D', 'F', 'G', 'A', 'C'][i % 5],
        octave: 4 + Math.floor(i / 25),
        confidence: 0.7 + Math.random() * 0.2
      }))

      jest.spyOn(analyzer as any, 'fileToAudioBuffer').mockResolvedValue({
        sampleRate: 44100,
        length: 44100 * 30, // 30 seconds
        numberOfChannels: 1,
        getChannelData: jest.fn(() => new Float32Array(44100 * 30))
      })
      jest.spyOn(analyzer as any, 'detectNotes').mockResolvedValue(mockDetectedNotes)

      const startTime = Date.now()
      
      const analysisResult = await analyzer.analyzeAudioFile(mediumFile)
      const kinkoScore = KinkoMapper.convertToKinko(analysisResult.notes)
      renderer.renderScore(kinkoScore)
      
      const totalTime = Date.now() - startTime
      
      // Should complete pipeline in reasonable time
      expect(totalTime).toBeLessThan(5000) // 5 seconds
      expect(kinkoScore.phrases.length).toBeGreaterThan(0)
      expect(kinkoScore.phrases.length).toBeLessThan(20) // Reasonable phrase count
    })

    it('should properly dispose of resources', () => {
      // Test that analyzer disposes properly
      expect(() => analyzer.dispose()).not.toThrow()
      
      // Test that renderer can be reused
      const score1 = KinkoMapper.convertToKinko([])
      const score2 = KinkoMapper.convertToKinko([])
      
      expect(() => renderer.renderScore(score1)).not.toThrow()
      expect(() => renderer.renderScore(score2)).not.toThrow()
    })
  })

  describe('Round-trip Accuracy Tests', () => {
    it('should maintain note accuracy through complete pipeline', async () => {
      // Test with known frequencies that should map cleanly
      const precisePitches = [
        { frequency: 293.66, expectedKatakana: 'ロ', expectedFingering: 'ro' },
        { frequency: 349.23, expectedKatakana: 'ツ', expectedFingering: 'tsu' },
        { frequency: 392.00, expectedKatakana: 'レ', expectedFingering: 're' },
        { frequency: 440.00, expectedKatakana: 'チ', expectedFingering: 'chi' },
        { frequency: 523.25, expectedKatakana: 'リ', expectedFingering: 'ri' },
      ]
      
      const mockDetectedNotes: DetectedNote[] = precisePitches.map((pitch, index) => ({
        frequency: pitch.frequency,
        amplitude: 0.8,
        startTime: index * 0.5,
        duration: 0.4,
        pitch: ['D', 'F', 'G', 'A', 'C'][index],
        octave: [4, 4, 4, 4, 5][index],
        confidence: 0.9
      }))

      const kinkoScore = KinkoMapper.convertToKinko(mockDetectedNotes)
      
      // Verify each note maps correctly
      precisePitches.forEach((expectedPitch, index) => {
        const actualNote = kinkoScore.phrases[0].notes[index]
        expect(actualNote.katakana).toBe(expectedPitch.expectedKatakana)
        expect(actualNote.fingering).toBe(expectedPitch.expectedFingering)
        
        // Frequency should be preserved within reasonable tolerance
        expect(actualNote.pitch).toBeCloseTo(expectedPitch.frequency, 1)
      })
      
      // Verify rendering preserves all information
      renderer.renderScore(kinkoScore)
      const ctx = canvas.getContext('2d')!
      
      precisePitches.forEach(pitch => {
        expect(ctx.fillText).toHaveBeenCalledWith(
          pitch.expectedKatakana,
          expect.any(Number),
          expect.any(Number)
        )
      })
    })
  })
})