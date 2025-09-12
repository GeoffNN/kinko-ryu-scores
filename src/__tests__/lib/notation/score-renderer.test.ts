import { KinkoScoreRenderer, RenderOptions } from '@/lib/notation/score-renderer'
import { KinkoScore, KinkoPhrase, KinkoNote } from '@/types'

// Helper function to create test canvas
function createTestCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 1200
  return canvas
}

// Helper function to create test Kinko score
function createTestScore(phrases?: KinkoPhrase[]): KinkoScore {
  return {
    title: 'テスト楽曲',
    phrases: phrases || [
      {
        notes: [
          { katakana: 'ロ', fingering: 'ro', pitch: 293.66, duration: 1.0 },
          { katakana: 'ツ', fingering: 'tsu', pitch: 349.23, duration: 0.5 },
          { katakana: 'レ', fingering: 're', pitch: 392.00, duration: 0.75 }
        ],
        breath: true
      }
    ],
    metadata: {
      composer: 'テスト作曲者',
      arranger: 'テスト編曲者',
      date: '2025年1月'
    }
  }
}

// Helper function to create test note
function createTestNote(
  katakana: string,
  fingering: string,
  pitch: number,
  duration: number = 1.0,
  ornaments?: string[],
  techniques?: string[]
): KinkoNote {
  return {
    katakana,
    fingering,
    pitch,
    duration,
    ornaments,
    techniques
  }
}

describe('KinkoScoreRenderer', () => {
  let canvas: HTMLCanvasElement
  let renderer: KinkoScoreRenderer
  let ctx: CanvasRenderingContext2D

  beforeEach(() => {
    canvas = createTestCanvas()
    renderer = new KinkoScoreRenderer(canvas)
    ctx = canvas.getContext('2d')!
    
    // Clear all canvas mock calls
    jest.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      const newRenderer = new KinkoScoreRenderer(canvas)
      
      expect(canvas.width).toBe(800)
      expect(canvas.height).toBe(1200)
      expect(ctx.font).toContain('24px')
      expect(ctx.textAlign).toBe('center')
      expect(ctx.textBaseline).toBe('middle')
    })

    it('should accept custom render options', () => {
      const customOptions: Partial<RenderOptions> = {
        width: 1000,
        height: 1400,
        fontSize: 30,
        lineSpacing: 50,
        margins: { top: 80, right: 80, bottom: 80, left: 80 }
      }
      
      const newRenderer = new KinkoScoreRenderer(canvas, customOptions)
      
      expect(canvas.width).toBe(1000)
      expect(canvas.height).toBe(1400)
      expect(ctx.font).toContain('30px')
    })

    it('should throw error if canvas context is not available', () => {
      const mockCanvas = {
        getContext: jest.fn(() => null)
      } as unknown as HTMLCanvasElement
      
      expect(() => new KinkoScoreRenderer(mockCanvas))
        .toThrow('Could not get 2D context from canvas')
    })
  })

  describe('Score Rendering', () => {
    it('should render basic score components', () => {
      const score = createTestScore()
      
      renderer.renderScore(score)
      
      // Verify canvas was cleared (white background)
      expect(ctx.fillStyle).toBe('#000000') // After clearing, fillStyle is reset to black
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height)
      
      // Verify fillText was called multiple times (title, notes, metadata)
      expect(ctx.fillText).toHaveBeenCalledWith(score.title, expect.any(Number), expect.any(Number))
      expect(ctx.fillText).toHaveBeenCalledWith('ロ', expect.any(Number), expect.any(Number))
      expect(ctx.fillText).toHaveBeenCalledWith('ツ', expect.any(Number), expect.any(Number))
      expect(ctx.fillText).toHaveBeenCalledWith('レ', expect.any(Number), expect.any(Number))
    })

    it('should render title with larger font', () => {
      const score = createTestScore()
      const titleFontSize = 24 * 1.5 // Default fontSize * 1.5
      
      renderer.renderScore(score)
      
      expect(ctx.font).toHaveBeenCalledWith(expect.stringContaining(`bold ${titleFontSize}px`))
    })

    it('should render notes from right to left', () => {
      const phrase: KinkoPhrase = {
        notes: [
          createTestNote('ロ', 'ro', 293.66),
          createTestNote('ツ', 'tsu', 349.23),
          createTestNote('レ', 're', 392.00)
        ],
        breath: true
      }
      const score = createTestScore([phrase])
      
      renderer.renderScore(score)
      
      const fillTextCalls = (ctx.fillText as jest.Mock).mock.calls
        .filter(call => ['ロ', 'ツ', 'レ'].includes(call[0]))
      
      expect(fillTextCalls).toHaveLength(3)
      
      // Verify X coordinates decrease from right to left (traditional Japanese layout)
      const xCoords = fillTextCalls.map(call => call[1])
      expect(xCoords[0]).toBeGreaterThan(xCoords[1]) // ロ should be rightmost
      expect(xCoords[1]).toBeGreaterThan(xCoords[2]) // ツ should be middle
    })

    it('should render breath marks', () => {
      const score = createTestScore()
      
      renderer.renderScore(score)
      
      expect(ctx.fillText).toHaveBeenCalledWith('、', expect.any(Number), expect.any(Number))
    })
  })

  describe('Ornament Rendering', () => {
    it('should render ornaments above notes', () => {
      const noteWithOrnaments = createTestNote('ロ', 'ro', 293.66, 1.0, ['—', '⌒'])
      const phrase: KinkoPhrase = { notes: [noteWithOrnaments], breath: false }
      const score = createTestScore([phrase])
      
      renderer.renderScore(score)
      
      // Should render main note and ornaments
      expect(ctx.fillText).toHaveBeenCalledWith('ロ', expect.any(Number), expect.any(Number))
      expect(ctx.fillText).toHaveBeenCalledWith('—', expect.any(Number), expect.any(Number))
      expect(ctx.fillText).toHaveBeenCalledWith('⌒', expect.any(Number), expect.any(Number))
    })

    it('should position multiple ornaments correctly', () => {
      const noteWithMultipleOrnaments = createTestNote('ロ', 'ro', 293.66, 1.0, ['—', '⌒', '＞'])
      const phrase: KinkoPhrase = { notes: [noteWithMultipleOrnaments], breath: false }
      const score = createTestScore([phrase])
      
      renderer.renderScore(score)
      
      // Check that ornaments have different X positions
      const ornamentCalls = (ctx.fillText as jest.Mock).mock.calls
        .filter(call => ['—', '⌒', '＞'].includes(call[0]))
      
      expect(ornamentCalls).toHaveLength(3)
      
      const ornamentXPositions = ornamentCalls.map(call => call[1])
      expect(new Set(ornamentXPositions).size).toBe(3) // All different X positions
    })

    it('should use smaller font for ornaments', () => {
      const noteWithOrnaments = createTestNote('ロ', 'ro', 293.66, 1.0, ['—'])
      const phrase: KinkoPhrase = { notes: [noteWithOrnaments], breath: false }
      const score = createTestScore([phrase])
      
      const fontCalls: string[] = []
      const originalFont = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'font')?.set
      Object.defineProperty(ctx, 'font', {
        set: function(value: string) {
          fontCalls.push(value)
          if (originalFont) originalFont.call(this, value)
        }
      })
      
      renderer.renderScore(score)
      
      const ornamentFont = fontCalls.find(font => font.includes('16.8px')) // 24 * 0.7
      expect(ornamentFont).toBeDefined()
    })
  })

  describe('Duration Indicators', () => {
    it('should render duration marks for long notes', () => {
      const longNote = createTestNote('ロ', 'ro', 293.66, 2.5)
      const phrase: KinkoPhrase = { notes: [longNote], breath: false }
      const score = createTestScore([phrase])
      
      renderer.renderScore(score)
      
      // Should render duration mark below note
      expect(ctx.fillText).toHaveBeenCalledWith('———', expect.any(Number), expect.any(Number))
    })

    it('should use correct duration marks for different lengths', () => {
      const testCases = [
        { duration: 1.2, expectedMark: '—' },
        { duration: 1.8, expectedMark: '——' },
        { duration: 2.5, expectedMark: '———' },
        { duration: 4.5, expectedMark: '—————' }
      ]
      
      testCases.forEach(({ duration, expectedMark }) => {
        const canvas = createTestCanvas()
        const renderer = new KinkoScoreRenderer(canvas)
        const ctx = canvas.getContext('2d')!
        
        const note = createTestNote('ロ', 'ro', 293.66, duration)
        const phrase: KinkoPhrase = { notes: [note], breath: false }
        const score = createTestScore([phrase])
        
        renderer.renderScore(score)
        
        expect(ctx.fillText).toHaveBeenCalledWith(expectedMark, expect.any(Number), expect.any(Number))
      })
    })

    it('should not render duration marks for short notes', () => {
      const shortNote = createTestNote('ロ', 'ro', 293.66, 0.8) // Less than 1.0
      const phrase: KinkoPhrase = { notes: [shortNote], breath: false }
      const score = createTestScore([phrase])
      
      renderer.renderScore(score)
      
      // Should not render any duration marks
      const durationMarks = ['—', '——', '———', '—————']
      durationMarks.forEach(mark => {
        expect(ctx.fillText).not.toHaveBeenCalledWith(mark, expect.any(Number), expect.any(Number))
      })
    })
  })

  describe('Technique Indicators', () => {
    it('should render technique indicators', () => {
      const noteWithTechniques = createTestNote('ロ', 'ro', 293.66, 1.0, [], ['meri', 'vibrato'])
      const phrase: KinkoPhrase = { notes: [noteWithTechniques], breath: false }
      const score = createTestScore([phrase])
      
      renderer.renderScore(score)
      
      // Should render technique indicators
      expect(ctx.fillText).toHaveBeenCalledWith('↓', expect.any(Number), expect.any(Number)) // meri
      expect(ctx.fillText).toHaveBeenCalledWith('～', expect.any(Number), expect.any(Number)) // vibrato
    })

    it('should use correct symbols for different techniques', () => {
      const techniqueSymbols = [
        { technique: 'meri', expectedSymbol: '↓' },
        { technique: 'kari', expectedSymbol: '↑' },
        { technique: 'vibrato', expectedSymbol: '～' },
        { technique: 'glissando', expectedSymbol: '∿' },
        { technique: 'accent', expectedSymbol: '＞' },
        { technique: 'ornamental', expectedSymbol: '◯' },
        { technique: 'breath', expectedSymbol: '◆' },
        { technique: 'grace', expectedSymbol: '♪' }
      ]
      
      techniqueSymbols.forEach(({ technique, expectedSymbol }) => {
        const canvas = createTestCanvas()
        const renderer = new KinkoScoreRenderer(canvas)
        const ctx = canvas.getContext('2d')!
        
        const note = createTestNote('ロ', 'ro', 293.66, 1.0, [], [technique])
        const phrase: KinkoPhrase = { notes: [note], breath: false }
        const score = createTestScore([phrase])
        
        renderer.renderScore(score)
        
        expect(ctx.fillText).toHaveBeenCalledWith(expectedSymbol, expect.any(Number), expect.any(Number))
      })
    })

    it('should position multiple techniques vertically', () => {
      const noteWithMultipleTechniques = createTestNote('ロ', 'ro', 293.66, 1.0, [], ['meri', 'vibrato', 'grace'])
      const phrase: KinkoPhrase = { notes: [noteWithMultipleTechniques], breath: false }
      const score = createTestScore([phrase])
      
      renderer.renderScore(score)
      
      const techniqueCalls = (ctx.fillText as jest.Mock).mock.calls
        .filter(call => ['↓', '～', '♪'].includes(call[0]))
      
      expect(techniqueCalls).toHaveLength(3)
      
      // Y positions should be different (stacked vertically)
      const yPositions = techniqueCalls.map(call => call[2])
      expect(new Set(yPositions).size).toBe(3)
    })
  })

  describe('Metadata Rendering', () => {
    it('should render composer information', () => {
      const score = createTestScore()
      
      renderer.renderScore(score)
      
      expect(ctx.fillText).toHaveBeenCalledWith(
        `作曲: ${score.metadata!.composer}`,
        expect.any(Number),
        expect.any(Number)
      )
    })

    it('should render arranger information', () => {
      const score = createTestScore()
      
      renderer.renderScore(score)
      
      expect(ctx.fillText).toHaveBeenCalledWith(
        `編曲: ${score.metadata!.arranger}`,
        expect.any(Number),
        expect.any(Number)
      )
    })

    it('should render date information', () => {
      const score = createTestScore()
      
      renderer.renderScore(score)
      
      expect(ctx.fillText).toHaveBeenCalledWith(
        `日付: ${score.metadata!.date}`,
        expect.any(Number),
        expect.any(Number)
      )
    })

    it('should handle missing metadata gracefully', () => {
      const scoreWithoutMetadata: KinkoScore = {
        title: 'テスト楽曲',
        phrases: [{
          notes: [createTestNote('ロ', 'ro', 293.66)],
          breath: true
        }]
      }
      
      expect(() => renderer.renderScore(scoreWithoutMetadata)).not.toThrow()
    })
  })

  describe('Layout and Positioning', () => {
    it('should handle line wrapping for long phrases', () => {
      // Create a phrase with many notes that should wrap
      const longPhrase: KinkoPhrase = {
        notes: Array.from({ length: 20 }, (_, i) => 
          createTestNote(['ロ', 'ツ', 'レ', 'チ', 'リ'][i % 5], 'ro', 293.66)
        ),
        breath: true
      }
      const score = createTestScore([longPhrase])
      
      renderer.renderScore(score)
      
      // Should render all notes
      expect(ctx.fillText).toHaveBeenCalledTimes(expect.any(Number))
      
      // Y positions should vary (indicating line wrapping)
      const noteCalls = (ctx.fillText as jest.Mock).mock.calls
        .filter(call => ['ロ', 'ツ', 'レ', 'チ', 'リ'].includes(call[0]))
      
      const yPositions = new Set(noteCalls.map(call => call[2]))
      expect(yPositions.size).toBeGreaterThan(1) // Multiple lines used
    })

    it('should handle multiple phrases correctly', () => {
      const phrases: KinkoPhrase[] = [
        {
          notes: [createTestNote('ロ', 'ro', 293.66), createTestNote('ツ', 'tsu', 349.23)],
          breath: true
        },
        {
          notes: [createTestNote('レ', 're', 392.00), createTestNote('チ', 'chi', 440.00)],
          breath: true
        }
      ]
      const score = createTestScore(phrases)
      
      renderer.renderScore(score)
      
      // Should render all notes from both phrases
      expect(ctx.fillText).toHaveBeenCalledWith('ロ', expect.any(Number), expect.any(Number))
      expect(ctx.fillText).toHaveBeenCalledWith('ツ', expect.any(Number), expect.any(Number))
      expect(ctx.fillText).toHaveBeenCalledWith('レ', expect.any(Number), expect.any(Number))
      expect(ctx.fillText).toHaveBeenCalledWith('チ', expect.any(Number), expect.any(Number))
      
      // Should render two breath marks
      const breathCalls = (ctx.fillText as jest.Mock).mock.calls
        .filter(call => call[0] === '、')
      expect(breathCalls).toHaveLength(2)
    })

    it('should respect canvas boundaries', () => {
      const smallCanvas = document.createElement('canvas')
      smallCanvas.width = 200
      smallCanvas.height = 300
      const smallRenderer = new KinkoScoreRenderer(smallCanvas)
      
      const longScore = createTestScore([
        {
          notes: Array.from({ length: 50 }, (_, i) => createTestNote('ロ', 'ro', 293.66)),
          breath: true
        }
      ])
      
      // Should not throw error even with limited canvas size
      expect(() => smallRenderer.renderScore(longScore)).not.toThrow()
    })
  })

  describe('Canvas Export', () => {
    it('should export canvas as data URL', () => {
      const score = createTestScore()
      renderer.renderScore(score)
      
      const dataURL = renderer.toDataURL()
      expect(dataURL).toMatch(/^data:image\/png;base64,/)
    })

    it('should support different export formats', () => {
      const score = createTestScore()
      renderer.renderScore(score)
      
      const jpegURL = renderer.toDataURL('image/jpeg', 0.8)
      expect(jpegURL).toMatch(/^data:image\/jpeg;base64,/)
    })
  })

  describe('Canvas Resizing', () => {
    it('should resize canvas correctly', () => {
      renderer.resize(1000, 1400)
      
      expect(canvas.width).toBe(1000)
      expect(canvas.height).toBe(1400)
    })

    it('should maintain rendering capability after resize', () => {
      renderer.resize(600, 800)
      const score = createTestScore()
      
      expect(() => renderer.renderScore(score)).not.toThrow()
      expect(ctx.fillText).toHaveBeenCalled()
    })
  })

  describe('Font and Style Management', () => {
    it('should use Japanese-appropriate fonts', () => {
      const score = createTestScore()
      renderer.renderScore(score)
      
      // Font should include Japanese font families
      expect(ctx.font).toMatch(/Noto Sans CJK JP|Yu Mincho|Hiragino Mincho ProN/)
    })

    it('should save and restore canvas state for technique indicators', () => {
      const noteWithTechniques = createTestNote('ロ', 'ro', 293.66, 1.0, [], ['meri'])
      const phrase: KinkoPhrase = { notes: [noteWithTechniques], breath: false }
      const score = createTestScore([phrase])
      
      renderer.renderScore(score)
      
      expect(ctx.save).toHaveBeenCalled()
      expect(ctx.restore).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle empty scores gracefully', () => {
      const emptyScore: KinkoScore = {
        title: 'Empty Score',
        phrases: []
      }
      
      expect(() => renderer.renderScore(emptyScore)).not.toThrow()
      expect(ctx.fillText).toHaveBeenCalledWith('Empty Score', expect.any(Number), expect.any(Number))
    })

    it('should handle phrases with no notes', () => {
      const emptyPhraseScore: KinkoScore = {
        title: 'Test',
        phrases: [{
          notes: [],
          breath: true
        }]
      }
      
      expect(() => renderer.renderScore(emptyPhraseScore)).not.toThrow()
    })

    it('should handle notes with missing properties', () => {
      const incompleteNote = { katakana: 'ロ', fingering: 'ro', pitch: 293.66, duration: 1.0 } as KinkoNote
      const phrase: KinkoPhrase = { notes: [incompleteNote], breath: true }
      const score = createTestScore([phrase])
      
      expect(() => renderer.renderScore(score)).not.toThrow()
      expect(ctx.fillText).toHaveBeenCalledWith('ロ', expect.any(Number), expect.any(Number))
    })
  })
})