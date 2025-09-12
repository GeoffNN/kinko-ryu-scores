import { KinkoMapper } from '@/lib/notation/kinko-mapper'
import { DetectedNote } from '@/lib/audio/analyzer'
import { KinkoScore, KinkoNote, KinkoPhrase } from '@/types'

// Helper function to create test detected notes
function createDetectedNote(
  frequency: number,
  duration: number = 0.5,
  amplitude: number = 0.8,
  startTime: number = 0
): DetectedNote {
  // Simple frequency to pitch conversion for testing
  const A4_FREQ = 440
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  
  const noteNumber = Math.round(12 * Math.log2(frequency / A4_FREQ) + 57) // A4 = MIDI 57
  const octave = Math.floor(noteNumber / 12) - 1
  const pitchClass = noteNumber % 12
  
  return {
    frequency,
    amplitude,
    startTime,
    duration,
    pitch: noteNames[pitchClass],
    octave,
    confidence: 0.8
  }
}

describe('KinkoMapper', () => {
  describe('Basic Note Conversion', () => {
    it('should convert fundamental shakuhachi notes correctly', () => {
      const testCases = [
        { frequency: 293.66, expectedKatakana: 'ロ', expectedFingering: 'ro' },     // D4
        { frequency: 349.23, expectedKatakana: 'ツ', expectedFingering: 'tsu' },   // F4
        { frequency: 392.00, expectedKatakana: 'レ', expectedFingering: 're' },    // G4
        { frequency: 440.00, expectedKatakana: 'チ', expectedFingering: 'chi' },   // A4
        { frequency: 523.25, expectedKatakana: 'リ', expectedFingering: 'ri' },    // C5
      ]
      
      testCases.forEach(({ frequency, expectedKatakana, expectedFingering }) => {
        const detectedNotes = [createDetectedNote(frequency)]
        const score = KinkoMapper.convertToKinko(detectedNotes)
        
        expect(score.phrases).toHaveLength(1)
        expect(score.phrases[0].notes).toHaveLength(1)
        expect(score.phrases[0].notes[0].katakana).toBe(expectedKatakana)
        expect(score.phrases[0].notes[0].fingering).toBe(expectedFingering)
        expect(score.phrases[0].notes[0].pitch).toBeCloseTo(frequency, 1)
      })
    })

    it('should convert meri (half-hole) variations correctly', () => {
      const meriTestCases = [
        { frequency: 311.13, expectedKatakana: 'ロ◯', expectedFingering: 'ro-meri' },    // D#4
        { frequency: 369.99, expectedKatakana: 'ツ◯', expectedFingering: 'tsu-meri' },  // F#4
        { frequency: 415.30, expectedKatakana: 'レ◯', expectedFingering: 're-meri' },   // G#4
      ]
      
      meriTestCases.forEach(({ frequency, expectedKatakana, expectedFingering }) => {
        const detectedNotes = [createDetectedNote(frequency)]
        const score = KinkoMapper.convertToKinko(detectedNotes)
        
        expect(score.phrases[0].notes[0].katakana).toBe(expectedKatakana)
        expect(score.phrases[0].notes[0].fingering).toBe(expectedFingering)
      })
    })

    it('should convert kan (higher octave) notes correctly', () => {
      const kanTestCases = [
        { frequency: 587.33, expectedKatakana: '口', expectedFingering: 'kan-ro' },   // D5
        { frequency: 698.46, expectedKatakana: '乙', expectedFingering: 'kan-tsu' }, // F5
        { frequency: 783.99, expectedKatakana: '工', expectedFingering: 'kan-re' },  // G5
      ]
      
      kanTestCases.forEach(({ frequency, expectedKatakana, expectedFingering }) => {
        const detectedNotes = [createDetectedNote(frequency)]
        const score = KinkoMapper.convertToKinko(detectedNotes)
        
        expect(score.phrases[0].notes[0].katakana).toBe(expectedKatakana)
        expect(score.phrases[0].notes[0].fingering).toBe(expectedFingering)
      })
    })
  })

  describe('Closest Note Mapping', () => {
    it('should map frequencies to closest available Kinko notes', () => {
      const testCases = [
        { frequency: 290, expectedFingering: 'ro' },      // Slightly flat D4 -> ro
        { frequency: 295, expectedFingering: 'ro' },      // Slightly sharp D4 -> ro
        { frequency: 305, expectedFingering: 'ro-meri' }, // Between D4 and D#4 -> ro-meri
        { frequency: 445, expectedFingering: 'chi' },     // Slightly sharp A4 -> chi
      ]
      
      testCases.forEach(({ frequency, expectedFingering }) => {
        const detectedNotes = [createDetectedNote(frequency)]
        const score = KinkoMapper.convertToKinko(detectedNotes)
        
        expect(score.phrases[0].notes[0].fingering).toBe(expectedFingering)
      })
    })

    it('should handle out-of-range frequencies gracefully', () => {
      const outOfRangeNotes = [
        createDetectedNote(100),   // Very low
        createDetectedNote(2000),  // Very high
        createDetectedNote(440),   // Normal range
      ]
      
      const score = KinkoMapper.convertToKinko(outOfRangeNotes)
      
      // Should still produce valid Kinko notes
      expect(score.phrases.length).toBeGreaterThan(0)
      score.phrases.forEach(phrase => {
        phrase.notes.forEach(note => {
          expect(note.katakana).toBeTruthy()
          expect(note.fingering).toBeTruthy()
        })
      })
    })
  })

  describe('Phrase Grouping', () => {
    it('should group notes into musical phrases based on timing', () => {
      // Create a sequence with natural phrase breaks
      const notes = [
        createDetectedNote(293.66, 0.5, 0.8, 0.0),   // Phrase 1: D
        createDetectedNote(349.23, 0.5, 0.8, 0.5),   //          F
        createDetectedNote(392.00, 0.8, 0.8, 1.0),   //          G (longer)
        // Gap of 1.0 seconds - should trigger phrase break
        createDetectedNote(440.00, 0.6, 0.8, 2.8),   // Phrase 2: A
        createDetectedNote(523.25, 0.4, 0.8, 3.4),   //          C
      ]
      
      const score = KinkoMapper.convertToKinko(notes)
      
      expect(score.phrases).toHaveLength(2)
      expect(score.phrases[0].notes).toHaveLength(3) // D, F, G
      expect(score.phrases[1].notes).toHaveLength(2) // A, C
      
      // Check that both phrases have breath marks
      expect(score.phrases[0].breath).toBe(true)
      expect(score.phrases[1].breath).toBe(true)
    })

    it('should break phrases on large pitch jumps', () => {
      const notes = [
        createDetectedNote(293.66, 0.5, 0.8, 0.0),   // D4
        createDetectedNote(349.23, 0.5, 0.8, 0.5),   // F4 (small jump)
        createDetectedNote(880.00, 0.5, 0.8, 1.0),   // A5 (octave jump - should break phrase)
        createDetectedNote(783.99, 0.5, 0.8, 1.5),   // G5
      ]
      
      const score = KinkoMapper.convertToKinko(notes)
      
      expect(score.phrases).toHaveLength(2)
      expect(score.phrases[0].notes).toHaveLength(2) // D4, F4
      expect(score.phrases[1].notes).toHaveLength(2) // A5, G5
    })

    it('should limit phrase length to traditional boundaries', () => {
      // Create a sequence of 10 consecutive notes (should be split)
      const notes = []
      const frequencies = [293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 698.46, 783.99, 880.00, 1046.50]
      
      for (let i = 0; i < frequencies.length; i++) {
        notes.push(createDetectedNote(frequencies[i], 0.5, 0.8, i * 0.5))
      }
      
      const score = KinkoMapper.convertToKinko(notes)
      
      // Should split into multiple phrases (max 8 notes per phrase)
      expect(score.phrases.length).toBeGreaterThan(1)
      score.phrases.forEach(phrase => {
        expect(phrase.notes.length).toBeLessThanOrEqual(8)
      })
    })

    it('should consolidate very short phrases', () => {
      const notes = [
        createDetectedNote(293.66, 0.2, 0.8, 0.0),   // Single short note
        createDetectedNote(349.23, 0.5, 0.8, 0.8),   // After small gap
        createDetectedNote(392.00, 0.5, 0.8, 1.3),   // Continuing
      ]
      
      const score = KinkoMapper.convertToKinko(notes)
      
      // Should merge single note with following phrase if gap is small
      expect(score.phrases.length).toBeLessThanOrEqual(2)
    })
  })

  describe('Ornament Detection', () => {
    it('should detect long tones (nobashi)', () => {
      const longNote = createDetectedNote(293.66, 3.0, 0.8) // 3-second note
      const score = KinkoMapper.convertToKinko([longNote])
      
      const note = score.phrases[0].notes[0]
      expect(note.ornaments).toContain('—') // Long tone symbol
    })

    it('should detect accents on strong notes', () => {
      const accentedNote = createDetectedNote(293.66, 0.5, 0.9) // High amplitude
      const score = KinkoMapper.convertToKinko([accentedNote])
      
      const note = score.phrases[0].notes[0]
      expect(note.ornaments).toContain('＞') // Accent symbol
    })

    it('should detect potential vibrato on unstable pitches', () => {
      const vibratoNote = createDetectedNote(293.66, 1.5, 0.8)
      vibratoNote.confidence = 0.5 // Low confidence suggests pitch instability
      
      const score = KinkoMapper.convertToKinko([vibratoNote])
      
      const note = score.phrases[0].notes[0]
      expect(note.ornaments).toContain('⌒') // Vibrato symbol
    })

    it('should detect crescendo on sustained loud notes', () => {
      const crescendoNote = createDetectedNote(293.66, 2.0, 0.85)
      const score = KinkoMapper.convertToKinko([crescendoNote])
      
      const note = score.phrases[0].notes[0]
      expect(note.ornaments).toContain('＜') // Crescendo symbol
    })
  })

  describe('Technique Detection', () => {
    it('should detect meri technique from pitch bending down', () => {
      const bentNote = createDetectedNote(280, 0.8, 0.7) // Significantly flat D4 (should be 293.66)
      const score = KinkoMapper.convertToKinko([bentNote])
      
      const note = score.phrases[0].notes[0]
      expect(note.techniques).toContain('meri')
    })

    it('should detect kari technique from pitch bending up', () => {
      const bentNote = createDetectedNote(310, 0.8, 0.7) // Significantly sharp D4
      const score = KinkoMapper.convertToKinko([bentNote])
      
      const note = score.phrases[0].notes[0]
      expect(note.techniques).toContain('kari')
    })

    it('should detect ornamental techniques on unstable notes', () => {
      const ornamentalNote = createDetectedNote(293.66, 0.8, 0.7)
      ornamentalNote.confidence = 0.6 // Low confidence
      
      const score = KinkoMapper.convertToKinko([ornamentalNote])
      
      const note = score.phrases[0].notes[0]
      expect(note.techniques).toContain('ornamental')
    })

    it('should detect breath sounds on very quiet notes', () => {
      const breathNote = createDetectedNote(293.66, 0.3, 0.15) // Very quiet
      const score = KinkoMapper.convertToKinko([breathNote])
      
      const note = score.phrases[0].notes[0]
      expect(note.techniques).toContain('breath')
    })

    it('should detect grace notes on very short notes', () => {
      const graceNote = createDetectedNote(293.66, 0.2, 0.8) // Very short
      const score = KinkoMapper.convertToKinko([graceNote])
      
      const note = score.phrases[0].notes[0]
      expect(note.techniques).toContain('grace')
    })
  })

  describe('Western to Kinko Conversion', () => {
    it('should convert simple Western notation to Kinko', () => {
      const westernNotes = [
        { pitch: 'D', octave: 4, duration: 1.0 },
        { pitch: 'F', octave: 4, duration: 0.5 },
        { pitch: 'G', octave: 4, duration: 0.75 },
        { pitch: 'A', octave: 4, duration: 0.5 },
        { pitch: 'C', octave: 5, duration: 1.5 },
      ]
      
      const score = KinkoMapper.convertWesternToKinko(westernNotes)
      
      expect(score.phrases).toHaveLength(1)
      expect(score.phrases[0].notes).toHaveLength(5)
      
      const expectedFingeringsAndKatakana = [
        { fingering: 'ro', katakana: 'ロ' },
        { fingering: 'tsu', katakana: 'ツ' },
        { fingering: 're', katakana: 'レ' },
        { fingering: 'chi', katakana: 'チ' },
        { fingering: 'ri', katakana: 'リ' },
      ]
      
      score.phrases[0].notes.forEach((note, index) => {
        expect(note.fingering).toBe(expectedFingeringsAndKatakana[index].fingering)
        expect(note.katakana).toBe(expectedFingeringsAndKatakana[index].katakana)
        expect(note.duration).toBe(westernNotes[index].duration)
      })
    })

    it('should handle Western notes with sharps and flats', () => {
      const westernNotes = [
        { pitch: 'D#', octave: 4, duration: 0.5 },
        { pitch: 'F#', octave: 4, duration: 0.5 },
        { pitch: 'Bb', octave: 4, duration: 0.5 },
      ]
      
      const score = KinkoMapper.convertWesternToKinko(westernNotes)
      
      expect(score.phrases[0].notes).toHaveLength(3)
      
      // Should map to closest Kinko notes (likely meri variations)
      score.phrases[0].notes.forEach(note => {
        expect(note.katakana).toBeTruthy()
        expect(note.fingering).toBeTruthy()
      })
    })
  })

  describe('Range Validation', () => {
    it('should correctly identify shakuhachi frequency range', () => {
      const testCases = [
        { freq: 200, expected: false },  // Too low
        { freq: 293.66, expected: true }, // D4 - in range
        { freq: 1046.50, expected: true }, // C6 - in range
        { freq: 1500, expected: false }, // Too high
      ]
      
      testCases.forEach(({ freq, expected }) => {
        expect(KinkoMapper.isInShakuhachiRange(freq)).toBe(expected)
      })
    })

    it('should filter out-of-range notes during conversion', () => {
      const mixedNotes = [
        createDetectedNote(100),    // Too low
        createDetectedNote(293.66), // Valid
        createDetectedNote(440.00), // Valid
        createDetectedNote(2000),   // Too high
      ]
      
      const score = KinkoMapper.convertToKinko(mixedNotes)
      
      // Should process all notes but map out-of-range to closest valid
      expect(score.phrases.length).toBeGreaterThan(0)
    })
  })

  describe('Empty and Edge Cases', () => {
    it('should handle empty note arrays gracefully', () => {
      const score = KinkoMapper.convertToKinko([])
      
      expect(score).toBeDefined()
      expect(score.title).toBe('転写された楽曲')
      expect(score.phrases).toHaveLength(1)
      expect(score.phrases[0].notes).toHaveLength(1)
      expect(score.phrases[0].notes[0].fingering).toBe('ro') // Default note
    })

    it('should handle single note input', () => {
      const singleNote = [createDetectedNote(440.00)] // A4
      const score = KinkoMapper.convertToKinko(singleNote)
      
      expect(score.phrases).toHaveLength(1)
      expect(score.phrases[0].notes).toHaveLength(1)
      expect(score.phrases[0].notes[0].fingering).toBe('chi')
      expect(score.phrases[0].breath).toBe(true)
    })
  })

  describe('Fingering Chart', () => {
    it('should provide complete fingering chart information', () => {
      const chart = KinkoMapper.getFingeringChart()
      
      expect(chart.length).toBeGreaterThan(0)
      
      chart.forEach(entry => {
        expect(entry.note).toBeTruthy()
        expect(entry.katakana).toBeTruthy()
        expect(entry.fingering).toBeTruthy()
        expect(entry.frequency).toBeGreaterThan(0)
        expect(entry.description).toBeTruthy()
      })
      
      // Check that fundamental notes are included
      const fundamentalNotes = chart.filter(entry => 
        ['ro', 'tsu', 're', 'chi', 'ri'].includes(entry.fingering)
      )
      expect(fundamentalNotes).toHaveLength(5)
    })

    it('should provide meaningful fingering descriptions', () => {
      const chart = KinkoMapper.getFingeringChart()
      
      const roNote = chart.find(entry => entry.fingering === 'ro')
      expect(roNote?.description).toBe('All holes closed')
      
      const tsuNote = chart.find(entry => entry.fingering === 'tsu')
      expect(tsuNote?.description).toBe('First hole open')
    })
  })

  describe('Integration with Real Musical Phrases', () => {
    it('should handle traditional shakuhachi melody patterns', () => {
      // Simulate "Hifumi-hachigaeshi" opening phrase pattern
      const traditionalPhrase = [
        createDetectedNote(293.66, 1.5, 0.8, 0.0),   // ro (long)
        createDetectedNote(349.23, 0.8, 0.7, 1.5),   // tsu
        createDetectedNote(392.00, 1.2, 0.8, 2.3),   // re (medium)
        createDetectedNote(349.23, 0.6, 0.6, 3.5),   // tsu (return)
        createDetectedNote(293.66, 2.0, 0.9, 4.1),   // ro (ending, long)
      ]
      
      const score = KinkoMapper.convertToKinko(traditionalPhrase)
      
      expect(score.phrases).toHaveLength(1) // Should be one cohesive phrase
      expect(score.phrases[0].notes).toHaveLength(5)
      
      // Check the expected note sequence
      const expectedSequence = ['ro', 'tsu', 're', 'tsu', 'ro']
      score.phrases[0].notes.forEach((note, index) => {
        expect(note.fingering).toBe(expectedSequence[index])
      })
      
      // Long notes should have appropriate ornaments
      const longNotes = score.phrases[0].notes.filter(note => note.duration > 1.0)
      expect(longNotes.length).toBeGreaterThan(0)
    })

    it('should handle complex ornamental passages', () => {
      const ornamentalPhrase = [
        createDetectedNote(293.66, 0.3, 0.9, 0.0),   // Strong attack (accent)
        createDetectedNote(280, 0.4, 0.7, 0.3),      // Bent down (meri)
        createDetectedNote(293.66, 1.8, 0.8, 0.7),   // Long sustained (vibrato potential)
        createDetectedNote(310, 0.2, 0.6, 2.5),      // Quick grace note, bent up
        createDetectedNote(349.23, 0.9, 0.8, 2.7),   // Resolution
      ]
      
      // Simulate pitch instability for vibrato detection
      ornamentalPhrase[2].confidence = 0.55
      
      const score = KinkoMapper.convertToKinko(ornamentalPhrase)
      
      const notes = score.phrases[0].notes
      
      // First note should have accent
      expect(notes[0].ornaments).toContain('＞')
      
      // Second note should have meri technique
      expect(notes[1].techniques).toContain('meri')
      
      // Third note should have long tone and vibrato
      expect(notes[2].ornaments).toContain('—')
      expect(notes[2].ornaments).toContain('⌒')
      
      // Fourth note should be grace note with kari
      expect(notes[3].techniques).toContain('grace')
      expect(notes[3].techniques).toContain('kari')
    })
  })
})