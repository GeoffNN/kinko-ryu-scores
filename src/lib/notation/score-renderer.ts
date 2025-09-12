import { KinkoScore, KinkoPhrase, KinkoNote } from '@/types'

export interface RenderOptions {
  width: number
  height: number
  fontSize: number
  lineSpacing: number
  charSpacing: number
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export class KinkoScoreRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private options: RenderOptions

  constructor(canvas: HTMLCanvasElement, options?: Partial<RenderOptions>) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas')
    }
    this.ctx = ctx

    this.options = {
      width: 800,
      height: 1200,
      fontSize: 24,
      lineSpacing: 40,
      charSpacing: 30,
      margins: {
        top: 60,
        right: 60,
        bottom: 60,
        left: 60
      },
      ...options
    }

    this.setupCanvas()
  }

  private setupCanvas() {
    this.canvas.width = this.options.width
    this.canvas.height = this.options.height
    
    // Set up font for Japanese characters
    this.ctx.font = `${this.options.fontSize}px "Noto Sans CJK JP", "Yu Mincho", "Hiragino Mincho ProN", serif`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
  }

  renderScore(score: KinkoScore): void {
    this.clearCanvas()
    this.drawTitle(score.title)
    this.drawPhrases(score.phrases)
    this.drawMetadata(score.metadata)
  }

  private clearCanvas() {
    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.fillStyle = '#000000'
  }

  private drawTitle(title: string) {
    const titleFontSize = this.options.fontSize * 1.5
    this.ctx.font = `bold ${titleFontSize}px "Noto Sans CJK JP", "Yu Mincho", serif`
    
    const centerX = this.canvas.width / 2
    const titleY = this.options.margins.top
    
    this.ctx.fillText(title, centerX, titleY)
    
    // Reset font
    this.ctx.font = `${this.options.fontSize}px "Noto Sans CJK JP", "Yu Mincho", serif`
  }

  private drawPhrases(phrases: KinkoPhrase[]) {
    const startX = this.canvas.width - this.options.margins.right
    let currentY = this.options.margins.top + 80
    let currentX = startX

    for (const phrase of phrases) {
      const phraseResult = this.drawPhrase(phrase, currentX, currentY)
      
      // Move to next line
      currentY = phraseResult.nextY + this.options.lineSpacing
      currentX = startX
      
      // Check if we need a new page/area
      if (currentY > this.canvas.height - this.options.margins.bottom) {
        // In a real implementation, this would create a new page
        break
      }
    }
  }

  private drawPhrase(phrase: KinkoPhrase, startX: number, startY: number): { nextY: number } {
    let currentX = startX
    let currentY = startY
    const lineHeight = this.options.lineSpacing

    // Draw notes from right to left (traditional Japanese reading direction)
    for (let i = 0; i < phrase.notes.length; i++) {
      const note = phrase.notes[i]
      
      // Check if we need to wrap to next line
      if (currentX < this.options.margins.left + 50) {
        currentY += lineHeight
        currentX = startX
      }

      this.drawNote(note, currentX, currentY)
      currentX -= this.options.charSpacing
    }

    // Draw breath mark if present
    if (phrase.breath) {
      this.drawBreathMark(currentX + this.options.charSpacing / 2, currentY)
    }

    return { nextY: currentY }
  }

  private drawNote(note: KinkoNote, x: number, y: number) {
    // Draw main katakana character
    this.ctx.fillStyle = '#000000'
    this.ctx.fillText(note.katakana, x, y)

    // Draw ornaments above
    if (note.ornaments && note.ornaments.length > 0) {
      const ornamentY = y - this.options.fontSize / 2 - 10
      this.ctx.font = `${this.options.fontSize * 0.7}px "Noto Sans CJK JP", serif`
      
      note.ornaments.forEach((ornament, index) => {
        const ornamentX = x + (index * 15) - ((note.ornaments!.length - 1) * 7.5)
        this.ctx.fillText(ornament, ornamentX, ornamentY)
      })
      
      // Reset font
      this.ctx.font = `${this.options.fontSize}px "Noto Sans CJK JP", serif`
    }

    // Draw duration indicator below
    if (note.duration > 1.0) {
      const durationY = y + this.options.fontSize / 2 + 15
      const durationMark = this.getDurationMark(note.duration)
      
      this.ctx.font = `${this.options.fontSize * 0.8}px "Noto Sans CJK JP", serif`
      this.ctx.fillText(durationMark, x, durationY)
      this.ctx.font = `${this.options.fontSize}px "Noto Sans CJK JP", serif`
    }

    // Draw techniques indicators
    if (note.techniques && note.techniques.length > 0) {
      this.drawTechniqueIndicators(note.techniques, x, y)
    }
  }

  private getDurationMark(duration: number): string {
    if (duration >= 4.0) return '—————' // Very long
    if (duration >= 2.0) return '———' // Long
    if (duration >= 1.5) return '——' // Medium
    return '—' // Normal
  }

  private drawTechniqueIndicators(techniques: string[], x: number, y: number) {
    // Draw small indicators for techniques
    this.ctx.save()
    this.ctx.fillStyle = '#666666'
    this.ctx.font = `${this.options.fontSize * 0.6}px sans-serif`
    
    techniques.forEach((technique, index) => {
      const indicatorY = y + 5 + (index * 10)
      const indicator = this.getTechniqueIndicator(technique)
      this.ctx.fillText(indicator, x + 15, indicatorY)
    })
    
    this.ctx.restore()
  }

  private getTechniqueIndicator(technique: string): string {
    const indicators: { [key: string]: string } = {
      vibrato: '～',
      glissando: '∿',
      accent: '＞',
      unstable: '◦'
    }
    return indicators[technique] || '•'
  }

  private drawBreathMark(x: number, y: number) {
    this.ctx.save()
    this.ctx.fillStyle = '#666666'
    this.ctx.font = `${this.options.fontSize}px "Noto Sans CJK JP", serif`
    this.ctx.fillText('、', x, y)
    this.ctx.restore()
  }

  private drawMetadata(metadata?: { composer?: string; arranger?: string; date?: string }) {
    if (!metadata) return

    const metadataY = this.canvas.height - this.options.margins.bottom + 20
    const smallFontSize = this.options.fontSize * 0.8
    
    this.ctx.save()
    this.ctx.font = `${smallFontSize}px "Noto Sans CJK JP", serif`
    this.ctx.textAlign = 'left'
    
    let currentY = metadataY
    
    if (metadata.composer) {
      this.ctx.fillText(`作曲: ${metadata.composer}`, this.options.margins.left, currentY)
      currentY += 20
    }
    
    if (metadata.arranger) {
      this.ctx.fillText(`編曲: ${metadata.arranger}`, this.options.margins.left, currentY)
      currentY += 20
    }
    
    if (metadata.date) {
      this.ctx.fillText(`日付: ${metadata.date}`, this.options.margins.left, currentY)
    }
    
    this.ctx.restore()
  }

  // Export canvas as image data URL
  toDataURL(type: string = 'image/png', quality?: number): string {
    return this.canvas.toDataURL(type, quality)
  }

  // Resize canvas
  resize(width: number, height: number) {
    this.options.width = width
    this.options.height = height
    this.setupCanvas()
  }
}