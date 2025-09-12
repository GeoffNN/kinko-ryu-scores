import { DetectedNote } from '../audio/analyzer'
import { KinkoNote, KinkoPhrase, KinkoScore } from '@/types'

// Kinko-ryu notation mapping for shakuhachi
export class KinkoMapper {
  // Fundamental notes in Kinko-ryu system
  private static readonly KINKO_NOTES = {
    // Main notes (hon-on)
    'D4': { katakana: 'ロ', fingering: 'ro', frequency: 293.66 },
    'F4': { katakana: 'ツ', fingering: 'tsu', frequency: 349.23 },
    'G4': { katakana: 'レ', fingering: 're', frequency: 392.00 },
    'A4': { katakana: 'チ', fingering: 'chi', frequency: 440.00 },
    'C5': { katakana: 'リ', fingering: 'ri', frequency: 523.25 },
    
    // Half-hole variations (meri)
    'D#4': { katakana: 'ロ◯', fingering: 'ro-meri', frequency: 311.13 },
    'F#4': { katakana: 'ツ◯', fingering: 'tsu-meri', frequency: 369.99 },
    'G#4': { katakana: 'レ◯', fingering: 're-meri', frequency: 415.30 },
    'A#4': { katakana: 'チ◯', fingering: 'chi-meri', frequency: 466.16 },
    'C#5': { katakana: 'リ◯', fingering: 'ri-meri', frequency: 554.37 },
    
    // Higher octave (kan)
    'D5': { katakana: '口', fingering: 'kan-ro', frequency: 587.33 },
    'F5': { katakana: '乙', fingering: 'kan-tsu', frequency: 698.46 },
    'G5': { katakana: '工', fingering: 'kan-re', frequency: 783.99 },
    'A5': { katakana: '尺', fingering: 'kan-chi', frequency: 880.00 },
    'C6': { katakana: '上', fingering: 'kan-ri', frequency: 1046.50 },
  }

  // Ornaments and techniques
  private static readonly TECHNIQUES = {
    vibrato: '⌒',
    glissando: '／',
    accent: '＞',
    breath: '、',
    long_tone: '—',
    crescendo: '＜',
    diminuendo: '＞'
  }

  static convertToKinko(detectedNotes: DetectedNote[]): KinkoScore {
    const phrases = this.groupIntoPhrases(detectedNotes)
    const kinkoScore: KinkoScore = {
      title: '転写された楽曲', // "Transcribed Piece" in Japanese
      phrases: phrases.map(phrase => this.convertPhrase(phrase))
    }

    return kinkoScore
  }

  private static groupIntoPhrases(notes: DetectedNote[]): DetectedNote[][] {
    const phrases: DetectedNote[][] = []
    let currentPhrase: DetectedNote[] = []
    
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i]
      const nextNote = notes[i + 1]
      
      currentPhrase.push(note)
      
      // Start new phrase if there's a significant gap (breath mark)
      if (nextNote && (nextNote.startTime - (note.startTime + note.duration)) > 0.5) {
        phrases.push([...currentPhrase])
        currentPhrase = []
      }
    }
    
    if (currentPhrase.length > 0) {
      phrases.push(currentPhrase)
    }
    
    return phrases
  }

  private static convertPhrase(notes: DetectedNote[]): KinkoPhrase {
    const kinkoNotes: KinkoNote[] = notes.map(note => this.convertNote(note))
    
    return {
      notes: kinkoNotes,
      breath: true // Add breath mark at end of phrase
    }
  }

  private static convertNote(detectedNote: DetectedNote): KinkoNote {
    const closestKinko = this.findClosestKinkoNote(detectedNote.frequency)
    const ornaments = this.detectOrnaments(detectedNote)
    const techniques = this.detectTechniques(detectedNote)

    return {
      katakana: closestKinko.katakana,
      fingering: closestKinko.fingering,
      pitch: detectedNote.frequency,
      duration: detectedNote.duration,
      ornaments,
      techniques
    }
  }

  private static findClosestKinkoNote(frequency: number) {
    let closestNote = { katakana: 'ロ', fingering: 'ro', frequency: 293.66 }
    let minDifference = Math.abs(frequency - closestNote.frequency)

    for (const [_, noteData] of Object.entries(this.KINKO_NOTES)) {
      const difference = Math.abs(frequency - noteData.frequency)
      if (difference < minDifference) {
        minDifference = difference
        closestNote = noteData
      }
    }

    return closestNote
  }

  private static detectOrnaments(note: DetectedNote): string[] {
    const ornaments: string[] = []
    
    // Simple ornament detection based on duration and amplitude patterns
    if (note.duration > 2.0) {
      ornaments.push(this.TECHNIQUES.long_tone)
    }
    
    if (note.amplitude > 0.8) {
      ornaments.push(this.TECHNIQUES.accent)
    }
    
    return ornaments
  }

  private static detectTechniques(note: DetectedNote): string[] {
    const techniques: string[] = []
    
    // Detect potential techniques based on frequency stability
    // This is simplified - real implementation would analyze micro-variations
    if (note.confidence < 0.7) {
      techniques.push('unstable') // Might indicate ornamental technique
    }
    
    return techniques
  }

  // Convert Western notation to approximate Kinko-ryu
  static convertWesternToKinko(westernNotes: { pitch: string, octave: number, duration: number }[]): KinkoScore {
    const detectedNotes: DetectedNote[] = westernNotes.map((note, index) => ({
      frequency: this.pitchToFrequency(note.pitch, note.octave),
      amplitude: 0.7,
      startTime: index * 0.5, // Simplified timing
      duration: note.duration,
      pitch: note.pitch,
      octave: note.octave,
      confidence: 0.9
    }))

    return this.convertToKinko(detectedNotes)
  }

  private static pitchToFrequency(pitch: string, octave: number): number {
    const A4_FREQ = 440
    const noteOffsets: { [key: string]: number } = {
      'C': -9, 'C#': -8, 'Db': -8, 'D': -7, 'D#': -6, 'Eb': -6,
      'E': -5, 'F': -4, 'F#': -3, 'Gb': -3, 'G': -2, 'G#': -1, 'Ab': -1,
      'A': 0, 'A#': 1, 'Bb': 1, 'B': 2
    }

    const semitoneOffset = noteOffsets[pitch] + (octave - 4) * 12
    return A4_FREQ * Math.pow(2, semitoneOffset / 12)
  }

  // Validate if a frequency is within shakuhachi range
  static isInShakuhachiRange(frequency: number): boolean {
    const minFreq = 250 // Approximately D4
    const maxFreq = 1200 // Approximately D6
    return frequency >= minFreq && frequency <= maxFreq
  }

  // Get fingering chart information
  static getFingeringChart(): Array<{
    note: string;
    katakana: string;
    fingering: string;
    frequency: number;
    description: string;
  }> {
    return Object.entries(this.KINKO_NOTES).map(([westernNote, data]) => ({
      note: westernNote,
      katakana: data.katakana,
      fingering: data.fingering,
      frequency: data.frequency,
      description: this.getFingeringDescription(data.fingering)
    }))
  }

  private static getFingeringDescription(fingering: string): string {
    const descriptions: { [key: string]: string } = {
      'ro': 'All holes closed',
      'tsu': 'First hole open',
      're': 'First two holes open',
      'chi': 'First three holes open',
      'ri': 'First four holes open',
      'ro-meri': 'All holes closed, half-blown',
      'kan-ro': 'All holes closed, overblown',
      // Add more descriptions as needed
    }
    
    return descriptions[fingering] || 'Traditional fingering'
  }
}