import { KinkoMapper } from '../notation/kinko-mapper'
import { KinkoScore } from '@/types'

export interface WesternNote {
  pitch: string
  octave: number
  duration: number
  accidental?: 'sharp' | 'flat' | 'natural'
  tie?: boolean
  dotted?: boolean
}

export interface WesternMeasure {
  notes: WesternNote[]
  timeSignature?: {
    numerator: number
    denominator: number
  }
}

export interface WesternScore {
  title?: string
  composer?: string
  keySignature: string
  timeSignature: {
    numerator: number
    denominator: number
  }
  measures: WesternMeasure[]
  tempo?: number
}

export class SheetMusicProcessor {
  async processPDF(file: File): Promise<WesternScore> {
    try {
      // This would typically use OMR (Optical Music Recognition)
      // For now, we'll simulate the processing
      const mockScore = await this.simulateOMR(file)
      return mockScore
    } catch (error) {
      throw new Error(`Failed to process sheet music: ${error}`)
    }
  }

  async convertToKinko(westernScore: WesternScore): Promise<KinkoScore> {
    // Extract all notes from measures
    const allNotes: { pitch: string; octave: number; duration: number }[] = []
    
    for (const measure of westernScore.measures) {
      for (const note of measure.notes) {
        allNotes.push({
          pitch: this.applyAccidental(note.pitch, note.accidental),
          octave: note.octave,
          duration: this.calculateDuration(note)
        })
      }
    }
    
    // Convert using KinkoMapper
    const kinkoScore = KinkoMapper.convertWesternToKinko(allNotes)
    
    // Add metadata from western score
    kinkoScore.title = westernScore.title || 'Converted Score'
    kinkoScore.tempo = westernScore.tempo
    kinkoScore.key = westernScore.keySignature
    kinkoScore.metadata = {
      composer: westernScore.composer,
      date: new Date().toISOString().split('T')[0]
    }
    
    return kinkoScore
  }

  private async simulateOMR(file: File): Promise<WesternScore> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Return a mock Western score for demonstration
    return {
      title: 'Sample Folk Melody',
      composer: 'Traditional',
      keySignature: 'D major',
      timeSignature: { numerator: 4, denominator: 4 },
      tempo: 120,
      measures: [
        {
          notes: [
            { pitch: 'D', octave: 4, duration: 1.0 },
            { pitch: 'F', octave: 4, duration: 1.0, accidental: 'sharp' },
            { pitch: 'G', octave: 4, duration: 1.0 },
            { pitch: 'A', octave: 4, duration: 1.0 }
          ]
        },
        {
          notes: [
            { pitch: 'B', octave: 4, duration: 2.0 },
            { pitch: 'A', octave: 4, duration: 1.0 },
            { pitch: 'G', octave: 4, duration: 1.0 }
          ]
        },
        {
          notes: [
            { pitch: 'F', octave: 4, duration: 1.0, accidental: 'sharp' },
            { pitch: 'G', octave: 4, duration: 1.0 },
            { pitch: 'A', octave: 4, duration: 2.0 }
          ]
        },
        {
          notes: [
            { pitch: 'D', octave: 4, duration: 4.0 }
          ]
        }
      ]
    }
  }

  private applyAccidental(pitch: string, accidental?: 'sharp' | 'flat' | 'natural'): string {
    if (!accidental || accidental === 'natural') return pitch
    
    if (accidental === 'sharp') {
      return pitch + '#'
    } else if (accidental === 'flat') {
      return pitch + 'b'
    }
    
    return pitch
  }

  private calculateDuration(note: WesternNote): number {
    let duration = note.duration
    
    // Handle dotted notes (adds half the original duration)
    if (note.dotted) {
      duration *= 1.5
    }
    
    return duration
  }

  // Validate if the score is suitable for shakuhachi
  validateForShakuhachi(score: WesternScore): {
    isValid: boolean
    warnings: string[]
    suggestions: string[]
  } {
    const warnings: string[] = []
    const suggestions: string[] = []
    let isValid = true
    
    // Check range
    const allNotes = score.measures.flatMap(m => m.notes)
    const frequencies = allNotes.map(note => this.noteToFrequency(note.pitch, note.octave))
    
    const tooLow = frequencies.filter(f => f < 250).length
    const tooHigh = frequencies.filter(f => f > 1200).length
    
    if (tooLow > 0) {
      warnings.push(`${tooLow} notes are below the typical shakuhachi range`)
      suggestions.push('Consider transposing up an octave')
    }
    
    if (tooHigh > 0) {
      warnings.push(`${tooHigh} notes are above the typical shakuhachi range`)
      suggestions.push('Consider transposing down an octave')
    }
    
    // Check for polyphony
    const hasChords = score.measures.some(measure => {
      // This is a simplified check - real implementation would be more sophisticated
      return measure.notes.length > 4 // Arbitrary threshold
    })
    
    if (hasChords) {
      warnings.push('This appears to be polyphonic music')
      suggestions.push('Shakuhachi is monophonic - consider extracting the melody line')
      isValid = false
    }
    
    // Check key signature compatibility
    const difficultKeys = ['F#', 'Db', 'Gb', 'C#', 'Ab']
    if (difficultKeys.includes(score.keySignature)) {
      warnings.push('This key signature may be challenging for shakuhachi')
      suggestions.push('Consider transposing to a more shakuhachi-friendly key (D, G, A, C)')
    }
    
    // Check tempo
    if (score.tempo && (score.tempo < 40 || score.tempo > 200)) {
      warnings.push('Unusual tempo detected')
      suggestions.push('Typical shakuhachi pieces range from 60-160 BPM')
    }
    
    return { isValid, warnings, suggestions }
  }

  private noteToFrequency(pitch: string, octave: number): number {
    const A4_FREQ = 440
    const noteOffsets: { [key: string]: number } = {
      'C': -9, 'C#': -8, 'Db': -8, 'D': -7, 'D#': -6, 'Eb': -6,
      'E': -5, 'F': -4, 'F#': -3, 'Gb': -3, 'G': -2, 'G#': -1, 'Ab': -1,
      'A': 0, 'A#': 1, 'Bb': 1, 'B': 2
    }
    
    const semitoneOffset = noteOffsets[pitch] + (octave - 4) * 12
    return A4_FREQ * Math.pow(2, semitoneOffset / 12)
  }

  // Get supported file formats
  static getSupportedFormats(): string[] {
    return ['.pdf', '.musicxml', '.mid', '.midi']
  }

  // Check if file format is supported
  static isSupportedFormat(filename: string): boolean {
    const extension = filename.toLowerCase().split('.').pop()
    return this.getSupportedFormats().some(format => format.includes(extension || ''))
  }
}