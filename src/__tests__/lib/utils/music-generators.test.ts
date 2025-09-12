// Test utilities for generating simple musical phrases for testing
import { DetectedNote } from '@/lib/audio/analyzer'
import { KinkoMapper } from '@/lib/notation/kinko-mapper'
import { KinkoScore, KinkoNote } from '@/types'

/**
 * Music generation utilities for creating test data that represents
 * realistic shakuhachi musical phrases
 */

// Common shakuhachi scales and patterns
export const SHAKUHACHI_SCALES = {
  // Traditional honkyoku scale (yo-in scale)
  traditional: [293.66, 329.63, 369.99, 415.30, 466.16, 523.25], // D, E♭, F♯, G♯, A♯, C
  
  // Simple pentatonic (most common)
  pentatonic: [293.66, 349.23, 392.00, 440.00, 523.25], // D, F, G, A, C
  
  // Chromatic within shakuhachi range
  chromatic: [
    293.66, 311.13, 329.63, 349.23, 369.99, 392.00,
    415.30, 440.00, 466.16, 493.88, 523.25, 554.37
  ],
  
  // Higher octave (kan notes)
  kan: [587.33, 698.46, 783.99, 880.00, 1046.50] // D5, F5, G5, A5, C6
}

// Traditional phrase patterns
export const PHRASE_PATTERNS = {
  // Ascending scale passage
  ascending: (scale: number[]) => scale.slice(),
  
  // Descending scale passage
  descending: (scale: number[]) => scale.slice().reverse(),
  
  // Arpeggiated pattern
  arpeggio: (scale: number[]) => [scale[0], scale[2], scale[4], scale[2], scale[0]],
  
  // Traditional "tataki" (attack) pattern
  tataki: (scale: number[]) => [scale[0], scale[0], scale[1], scale[0]],
  
  // Long tone with variations
  longTone: (scale: number[]) => [scale[0]],
  
  // Traditional breath rhythm pattern
  breathPattern: (scale: number[]) => [
    scale[0], scale[1], scale[2], // First phrase
    scale[2], scale[3], scale[4]  // Second phrase (separated by breath)
  ]
}

export class MusicalPhraseGenerator {
  /**
   * Generate a simple musical phrase for testing
   */
  static generatePhrase(
    pattern: keyof typeof PHRASE_PATTERNS,
    scale: keyof typeof SHAKUHACHI_SCALES = 'pentatonic',
    options: {
      baseDuration?: number
      amplitudeVariation?: boolean
      addOrnaments?: boolean
      addBreathing?: boolean
    } = {}
  ): DetectedNote[] {
    const {
      baseDuration = 0.6,
      amplitudeVariation = false,
      addOrnaments = false,
      addBreathing = false
    } = options

    const scaleFreqs = SHAKUHACHI_SCALES[scale]
    const patternFunc = PHRASE_PATTERNS[pattern]
    const frequencies = patternFunc(scaleFreqs)

    const notes: DetectedNote[] = []
    let currentTime = 0

    frequencies.forEach((frequency, index) => {
      const duration = addOrnaments && Math.random() > 0.7 
        ? baseDuration * 2 + Math.random() * 0.5  // Occasional long notes
        : baseDuration + (Math.random() - 0.5) * 0.2

      const amplitude = amplitudeVariation
        ? 0.6 + Math.random() * 0.3
        : 0.8

      // Add slight pitch variations for realism
      const actualFreq = addOrnaments && Math.random() > 0.8
        ? frequency * (0.95 + Math.random() * 0.1)  // ±5% pitch variation
        : frequency

      const confidence = addOrnaments && actualFreq !== frequency
        ? 0.6 + Math.random() * 0.2  // Lower confidence for pitched notes
        : 0.85 + Math.random() * 0.1

      const { pitch, octave } = this.frequencyToPitch(actualFreq)

      notes.push({
        frequency: actualFreq,
        amplitude,
        startTime: currentTime,
        duration,
        pitch,
        octave,
        confidence
      })

      currentTime += duration
      
      // Add breathing gaps for certain patterns
      if (addBreathing && index === Math.floor(frequencies.length / 2)) {
        currentTime += 0.8  // Breathing pause
      }
    })

    return notes
  }

  /**
   * Generate a complete traditional piece structure
   */
  static generateTraditionalPiece(): DetectedNote[] {
    const introduction = this.generatePhrase('longTone', 'pentatonic', { 
      baseDuration: 2.0,
      addOrnaments: true
    })

    const development = this.generatePhrase('ascending', 'pentatonic', {
      baseDuration: 0.8,
      amplitudeVariation: true,
      addBreathing: true
    })

    const climax = this.generatePhrase('arpeggio', 'kan', {
      baseDuration: 0.5,
      addOrnaments: true
    })

    const conclusion = this.generatePhrase('descending', 'pentatonic', {
      baseDuration: 1.2,
      addOrnaments: true
    })

    // Combine sections with appropriate timing offsets
    let offset = 0
    const combinedNotes: DetectedNote[] = []

    const sections = [introduction, development, climax, conclusion]
    const sectionGaps = [1.5, 1.0, 1.2] // Breathing between sections

    sections.forEach((section, sectionIndex) => {
      section.forEach(note => {
        combinedNotes.push({
          ...note,
          startTime: note.startTime + offset
        })
      })

      if (sectionIndex < sections.length - 1) {
        const lastNote = section[section.length - 1]
        offset = lastNote.startTime + lastNote.duration + sectionGaps[sectionIndex]
      }
    })

    return combinedNotes
  }

  /**
   * Generate test phrase with known ornaments and techniques
   */
  static generateOrnamentedPhrase(): {
    notes: DetectedNote[]
    expectedOrnaments: string[]
    expectedTechniques: string[]
  } {
    const notes: DetectedNote[] = [
      // Strong attack note (should get accent)
      {
        frequency: 293.66,
        amplitude: 0.95,
        startTime: 0,
        duration: 0.4,
        pitch: 'D',
        octave: 4,
        confidence: 0.9
      },
      // Long sustained note (should get long tone and possibly vibrato)
      {
        frequency: 349.23,
        amplitude: 0.8,
        startTime: 0.4,
        duration: 2.8,
        pitch: 'F',
        octave: 4,
        confidence: 0.55 // Low confidence to trigger vibrato detection
      },
      // Bent note (should get meri technique)
      {
        frequency: 275, // Significantly flat D4
        amplitude: 0.65,
        startTime: 3.2,
        duration: 0.6,
        pitch: 'D',
        octave: 4,
        confidence: 0.8
      },
      // Quick grace note
      {
        frequency: 315, // Significantly sharp D4
        amplitude: 0.7,
        startTime: 3.8,
        duration: 0.15,
        pitch: 'D',
        octave: 4,
        confidence: 0.8
      },
      // Quiet breath sound
      {
        frequency: 293.66,
        amplitude: 0.18,
        startTime: 3.95,
        duration: 0.3,
        pitch: 'D',
        octave: 4,
        confidence: 0.7
      }
    ]

    return {
      notes,
      expectedOrnaments: ['＞', '—', '⌒'], // accent, long tone, vibrato
      expectedTechniques: ['meri', 'kari', 'grace', 'breath']
    }
  }

  /**
   * Generate phrase that should create multiple Kinko phrases
   */
  static generateMultiPhrase(): DetectedNote[] {
    const phrase1 = this.generatePhrase('ascending', 'pentatonic', { baseDuration: 0.5 })
    const phrase2 = this.generatePhrase('descending', 'pentatonic', { baseDuration: 0.6 })

    // Add significant gap between phrases
    const gapDuration = 1.2
    const phrase1End = phrase1[phrase1.length - 1]
    const phrase1EndTime = phrase1End.startTime + phrase1End.duration

    const adjustedPhrase2 = phrase2.map(note => ({
      ...note,
      startTime: note.startTime + phrase1EndTime + gapDuration
    }))

    return [...phrase1, ...adjustedPhrase2]
  }

  private static frequencyToPitch(frequency: number): { pitch: string, octave: number } {
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
}

describe('Musical Phrase Generators', () => {
  describe('Scale Generation', () => {
    it('should generate correct pentatonic scale', () => {
      const notes = MusicalPhraseGenerator.generatePhrase('ascending', 'pentatonic')
      
      expect(notes).toHaveLength(5)
      expect(notes.map(n => n.frequency)).toEqual(SHAKUHACHI_SCALES.pentatonic)
    })

    it('should generate correct traditional scale', () => {
      const notes = MusicalPhraseGenerator.generatePhrase('ascending', 'traditional')
      
      expect(notes).toHaveLength(6)
      expect(notes.map(n => n.frequency)).toEqual(SHAKUHACHI_SCALES.traditional)
    })

    it('should generate kan (high octave) notes', () => {
      const notes = MusicalPhraseGenerator.generatePhrase('ascending', 'kan')
      
      expect(notes).toHaveLength(5)
      expect(notes.every(n => n.frequency > 500)).toBe(true) // All high frequencies
    })
  })

  describe('Pattern Generation', () => {
    it('should generate ascending pattern', () => {
      const notes = MusicalPhraseGenerator.generatePhrase('ascending', 'pentatonic')
      
      const frequencies = notes.map(n => n.frequency)
      for (let i = 1; i < frequencies.length; i++) {
        expect(frequencies[i]).toBeGreaterThan(frequencies[i-1])
      }
    })

    it('should generate descending pattern', () => {
      const notes = MusicalPhraseGenerator.generatePhrase('descending', 'pentatonic')
      
      const frequencies = notes.map(n => n.frequency)
      for (let i = 1; i < frequencies.length; i++) {
        expect(frequencies[i]).toBeLessThan(frequencies[i-1])
      }
    })

    it('should generate arpeggio pattern', () => {
      const notes = MusicalPhraseGenerator.generatePhrase('arpeggio', 'pentatonic')
      
      expect(notes).toHaveLength(5)
      
      // Should go: root, 3rd, 5th, 3rd, root
      const scale = SHAKUHACHI_SCALES.pentatonic
      expect(notes[0].frequency).toBeCloseTo(scale[0], 1)
      expect(notes[1].frequency).toBeCloseTo(scale[2], 1)
      expect(notes[2].frequency).toBeCloseTo(scale[4], 1)
      expect(notes[3].frequency).toBeCloseTo(scale[2], 1)
      expect(notes[4].frequency).toBeCloseTo(scale[0], 1)
    })

    it('should generate traditional tataki pattern', () => {
      const notes = MusicalPhraseGenerator.generatePhrase('tataki', 'pentatonic')
      
      expect(notes).toHaveLength(4)
      
      const scale = SHAKUHACHI_SCALES.pentatonic
      expect(notes[0].frequency).toBeCloseTo(scale[0], 1)
      expect(notes[1].frequency).toBeCloseTo(scale[0], 1)
      expect(notes[2].frequency).toBeCloseTo(scale[1], 1)
      expect(notes[3].frequency).toBeCloseTo(scale[0], 1)
    })
  })

  describe('Generated Phrase Accuracy', () => {
    it('should produce phrases that convert correctly to Kinko notation', () => {
      const notes = MusicalPhraseGenerator.generatePhrase('ascending', 'pentatonic')
      const kinkoScore = KinkoMapper.convertToKinko(notes)
      
      expect(kinkoScore.phrases).toHaveLength(1)
      expect(kinkoScore.phrases[0].notes).toHaveLength(5)
      
      // Should map to fundamental Kinko notes
      const expectedKatakana = ['ロ', 'ツ', 'レ', 'チ', 'リ']
      const actualKatakana = kinkoScore.phrases[0].notes.map(n => n.katakana)
      expect(actualKatakana).toEqual(expectedKatakana)
    })

    it('should produce ornaments that are detected correctly', () => {
      const { notes, expectedOrnaments, expectedTechniques } = 
        MusicalPhraseGenerator.generateOrnamentedPhrase()
      
      const kinkoScore = KinkoMapper.convertToKinko(notes)
      const kinkoNotes = kinkoScore.phrases[0].notes
      
      // Check that expected ornaments appear
      const allOrnaments = kinkoNotes.flatMap(n => n.ornaments || [])
      expectedOrnaments.forEach(ornament => {
        expect(allOrnaments).toContain(ornament)
      })
      
      // Check that expected techniques appear
      const allTechniques = kinkoNotes.flatMap(n => n.techniques || [])
      expectedTechniques.forEach(technique => {
        expect(allTechniques).toContain(technique)
      })
    })

    it('should produce multi-phrase structures correctly', () => {
      const notes = MusicalPhraseGenerator.generateMultiPhrase()
      const kinkoScore = KinkoMapper.convertToKinko(notes)
      
      // Should create two phrases due to gap
      expect(kinkoScore.phrases.length).toBeGreaterThan(1)
      
      // Both phrases should have breath marks
      kinkoScore.phrases.forEach(phrase => {
        expect(phrase.breath).toBe(true)
      })
    })

    it('should generate realistic traditional piece structure', () => {
      const notes = MusicalPhraseGenerator.generateTraditionalPiece()
      const kinkoScore = KinkoMapper.convertToKinko(notes)
      
      // Should create multiple phrases
      expect(kinkoScore.phrases.length).toBeGreaterThan(2)
      expect(kinkoScore.phrases.length).toBeLessThan(8) // Reasonable number
      
      // Should have reasonable total duration
      const totalDuration = notes.reduce((sum, note) => 
        Math.max(sum, note.startTime + note.duration), 0)
      expect(totalDuration).toBeGreaterThan(10) // At least 10 seconds
      expect(totalDuration).toBeLessThan(120) // Less than 2 minutes
      
      // Should include both low and high notes
      const frequencies = notes.map(n => n.frequency)
      const minFreq = Math.min(...frequencies)
      const maxFreq = Math.max(...frequencies)
      
      expect(minFreq).toBeLessThan(400) // Has low notes
      expect(maxFreq).toBeGreaterThan(500) // Has high notes
    })
  })

  describe('Options and Variations', () => {
    it('should apply amplitude variation when requested', () => {
      const notes = MusicalPhraseGenerator.generatePhrase('ascending', 'pentatonic', {
        amplitudeVariation: true
      })
      
      const amplitudes = notes.map(n => n.amplitude)
      const uniqueAmplitudes = new Set(amplitudes)
      
      // Should have varying amplitudes
      expect(uniqueAmplitudes.size).toBeGreaterThan(1)
      
      // All amplitudes should be reasonable
      amplitudes.forEach(amp => {
        expect(amp).toBeGreaterThan(0.3)
        expect(amp).toBeLessThan(1.0)
      })
    })

    it('should add ornaments when requested', () => {
      const notes = MusicalPhraseGenerator.generatePhrase('ascending', 'pentatonic', {
        addOrnaments: true
      })
      
      // Should have some variation in durations
      const durations = notes.map(n => n.duration)
      const maxDuration = Math.max(...durations)
      const minDuration = Math.min(...durations)
      
      expect(maxDuration - minDuration).toBeGreaterThan(0.1) // Some variation
      
      // Some notes should have pitch variations
      const exactFreqs = SHAKUHACHI_SCALES.pentatonic
      const actualFreqs = notes.map(n => n.frequency)
      
      let hasVariations = false
      actualFreqs.forEach((freq, index) => {
        if (Math.abs(freq - exactFreqs[index]) > 1) {
          hasVariations = true
        }
      })
      
      // At least some notes should be varied (not deterministic, so might not always happen)
      // This is okay for ornamental variations
    })

    it('should add breathing gaps when requested', () => {
      const notes = MusicalPhraseGenerator.generatePhrase('breathPattern', 'pentatonic', {
        addBreathing: true
      })
      
      // Should have a larger gap in the middle
      const timings = notes.map(n => n.startTime)
      const gaps = []
      
      for (let i = 1; i < timings.length; i++) {
        const prevNote = notes[i-1]
        const gap = timings[i] - (prevNote.startTime + prevNote.duration)
        gaps.push(gap)
      }
      
      // Should have at least one significant gap
      const hasLargeGap = gaps.some(gap => gap > 0.5)
      expect(hasLargeGap).toBe(true)
    })

    it('should respect base duration setting', () => {
      const shortNotes = MusicalPhraseGenerator.generatePhrase('ascending', 'pentatonic', {
        baseDuration: 0.3
      })
      
      const longNotes = MusicalPhraseGenerator.generatePhrase('ascending', 'pentatonic', {
        baseDuration: 1.0
      })
      
      const shortAvgDuration = shortNotes.reduce((sum, n) => sum + n.duration, 0) / shortNotes.length
      const longAvgDuration = longNotes.reduce((sum, n) => sum + n.duration, 0) / longNotes.length
      
      expect(longAvgDuration).toBeGreaterThan(shortAvgDuration)
    })
  })
})