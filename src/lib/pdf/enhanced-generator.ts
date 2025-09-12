import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { KinkoScore, KinkoPhrase, KinkoNote } from '@/types'

export interface EnhancedPDFOptions {
  pageSize: 'A4' | 'Letter' | 'A3'
  orientation: 'portrait' | 'landscape'
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  fontSize: number
  lineSpacing: number
  charSpacing: number
  colors: {
    text: [number, number, number]
    accent: [number, number, number]
    background: [number, number, number]
  }
  showFingeringChart: boolean
  showMetadata: boolean
}

export class EnhancedKinkoPDFGenerator {
  private doc!: PDFDocument
  private options: EnhancedPDFOptions
  private currentPage: any
  private currentY: number = 0
  private currentX: number = 0
  private pageWidth: number = 0
  private pageHeight: number = 0

  constructor(options?: Partial<EnhancedPDFOptions>) {
    this.options = {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: 72, // 1 inch = 72 points
        right: 54,
        bottom: 72,
        left: 54
      },
      fontSize: 16,
      lineSpacing: 24,
      charSpacing: 18,
      colors: {
        text: [0, 0, 0],
        accent: [0.2, 0.2, 0.6],
        background: [1, 1, 1]
      },
      showFingeringChart: true,
      showMetadata: true,
      ...options
    }

    this.setPageDimensions()
  }

  private setPageDimensions() {
    const sizes = {
      A4: { width: 595, height: 842 },
      Letter: { width: 612, height: 792 },
      A3: { width: 842, height: 1191 }
    }

    const size = sizes[this.options.pageSize]
    
    if (this.options.orientation === 'landscape') {
      this.pageWidth = size.height
      this.pageHeight = size.width
    } else {
      this.pageWidth = size.width
      this.pageHeight = size.height
    }
  }

  async generatePDF(score: KinkoScore): Promise<Uint8Array> {
    this.doc = await PDFDocument.create()
    
    await this.startNewPage()
    await this.drawTitlePage(score)
    
    // Add fingering chart if requested
    if (this.options.showFingeringChart) {
      await this.startNewPage()
      await this.drawFingeringChart()
    }
    
    // Add main score
    await this.startNewPage()
    await this.drawScore(score)
    
    return this.doc.save()
  }

  private async startNewPage() {
    this.currentPage = this.doc.addPage([this.pageWidth, this.pageHeight])
    this.currentY = this.pageHeight - this.options.margins.top
    this.currentX = this.pageWidth - this.options.margins.right
    
    // Set background color
    const [r, g, b] = this.options.colors.background
    this.currentPage.drawRectangle({
      x: 0,
      y: 0,
      width: this.pageWidth,
      height: this.pageHeight,
      color: rgb(r, g, b)
    })
  }

  private async drawTitlePage(score: KinkoScore) {
    const font = await this.doc.embedFont(StandardFonts.Helvetica)
    const boldFont = await this.doc.embedFont(StandardFonts.HelveticaBold)
    
    // Main title
    const titleFontSize = this.options.fontSize * 2
    const titleWidth = font.widthOfTextAtSize(score.title, titleFontSize)
    
    this.currentPage.drawText(score.title, {
      x: (this.pageWidth - titleWidth) / 2,
      y: this.currentY - 100,
      size: titleFontSize,
      font: boldFont,
      color: rgb(...this.options.colors.text)
    })
    
    // Subtitle
    const subtitleFontSize = this.options.fontSize * 1.2
    const subtitle = '琴古流記譜 (Kinko-ryu Notation)'
    const subtitleWidth = font.widthOfTextAtSize(subtitle, subtitleFontSize)
    
    this.currentPage.drawText(subtitle, {
      x: (this.pageWidth - subtitleWidth) / 2,
      y: this.currentY - 150,
      size: subtitleFontSize,
      font,
      color: rgb(...this.options.colors.accent)
    })
    
    // Metadata
    if (this.options.showMetadata && score.metadata) {
      let metadataY = this.currentY - 250
      
      if (score.metadata.composer) {
        this.currentPage.drawText(`作曲者: ${score.metadata.composer}`, {
          x: this.options.margins.left,
          y: metadataY,
          size: this.options.fontSize,
          font,
          color: rgb(...this.options.colors.text)
        })
        metadataY -= 25
      }
      
      if (score.metadata.arranger) {
        this.currentPage.drawText(`編曲者: ${score.metadata.arranger}`, {
          x: this.options.margins.left,
          y: metadataY,
          size: this.options.fontSize,
          font,
          color: rgb(...this.options.colors.text)
        })
        metadataY -= 25
      }
      
      if (score.metadata.date) {
        this.currentPage.drawText(`作成日: ${score.metadata.date}`, {
          x: this.options.margins.left,
          y: metadataY,
          size: this.options.fontSize,
          font,
          color: rgb(...this.options.colors.text)
        })
      }
    }
    
    // Statistics
    const totalNotes = score.phrases.reduce((sum, phrase) => sum + phrase.notes.length, 0)
    let statsY = this.pageHeight / 2
    
    const stats = [
      `楽句数: ${score.phrases.length}`,
      `音符数: ${totalNotes}`,
      score.tempo ? `テンポ: ${score.tempo} BPM` : '',
      score.key ? `調: ${score.key}` : ''
    ].filter(Boolean)
    
    for (const stat of stats) {
      this.currentPage.drawText(stat, {
        x: this.options.margins.left,
        y: statsY,
        size: this.options.fontSize,
        font,
        color: rgb(...this.options.colors.text)
      })
      statsY -= 25
    }
  }

  private async drawFingeringChart() {
    const font = await this.doc.embedFont(StandardFonts.Helvetica)
    const boldFont = await this.doc.embedFont(StandardFonts.HelveticaBold)
    
    // Title
    const title = '琴古流運指表 (Kinko-ryu Fingering Chart)'
    const titleWidth = boldFont.widthOfTextAtSize(title, this.options.fontSize * 1.5)
    
    this.currentPage.drawText(title, {
      x: (this.pageWidth - titleWidth) / 2,
      y: this.currentY - 50,
      size: this.options.fontSize * 1.5,
      font: boldFont,
      color: rgb(...this.options.colors.text)
    })
    
    // Chart headers
    const headerY = this.currentY - 100
    const colWidth = 120
    const startX = this.options.margins.left
    
    const headers = ['音符', 'カタカナ', '運指', '周波数']
    
    headers.forEach((header, index) => {
      this.currentPage.drawText(header, {
        x: startX + (index * colWidth),
        y: headerY,
        size: this.options.fontSize,
        font: boldFont,
        color: rgb(...this.options.colors.accent)
      })
    })
    
    // Draw header underline
    this.currentPage.drawLine({
      start: { x: startX, y: headerY - 5 },
      end: { x: startX + (headers.length * colWidth), y: headerY - 5 },
      thickness: 1,
      color: rgb(...this.options.colors.accent)
    })
    
    // Basic fingering data (simplified)
    const fingeringData = [
      { note: 'D4', katakana: 'ロ', fingering: 'ro', freq: '293.66 Hz' },
      { note: 'F4', katakana: 'ツ', fingering: 'tsu', freq: '349.23 Hz' },
      { note: 'G4', katakana: 'レ', fingering: 're', freq: '392.00 Hz' },
      { note: 'A4', katakana: 'チ', fingering: 'chi', freq: '440.00 Hz' },
      { note: 'C5', katakana: 'リ', fingering: 'ri', freq: '523.25 Hz' },
    ]
    
    let rowY = headerY - 30
    
    fingeringData.forEach((row) => {
      const rowData = [row.note, row.katakana, row.fingering, row.freq]
      
      rowData.forEach((data, index) => {
        this.currentPage.drawText(data, {
          x: startX + (index * colWidth),
          y: rowY,
          size: this.options.fontSize * 0.9,
          font,
          color: rgb(...this.options.colors.text)
        })
      })
      
      rowY -= 25
    })
  }

  private async drawScore(score: KinkoScore) {
    const font = await this.doc.embedFont(StandardFonts.Helvetica)
    
    let phraseIndex = 0
    
    for (const phrase of score.phrases) {
      // Check if we need a new page
      if (this.currentY < this.options.margins.bottom + 100) {
        await this.startNewPage()
      }
      
      await this.drawPhrase(phrase, phraseIndex, font)
      phraseIndex++
    }
  }

  private async drawPhrase(phrase: KinkoPhrase, phraseIndex: number, font: any) {
    let lineX = this.currentX
    const phraseStartY = this.currentY
    
    // Phrase marker
    this.currentPage.drawText(`[${phraseIndex + 1}]`, {
      x: 20,
      y: this.currentY,
      size: this.options.fontSize * 0.8,
      font,
      color: rgb(...this.options.colors.accent)
    })
    
    // Draw notes from right to left
    for (const note of phrase.notes) {
      // Line wrap check
      if (lineX < this.options.margins.left + 50) {
        this.currentY -= this.options.lineSpacing
        lineX = this.currentX
      }
      
      await this.drawNote(note, lineX, this.currentY, font)
      lineX -= this.options.charSpacing
    }
    
    // Breath mark
    if (phrase.breath) {
      this.currentPage.drawText('、', {
        x: lineX + this.options.charSpacing / 2,
        y: this.currentY,
        size: this.options.fontSize,
        font,
        color: rgb(...this.options.colors.text)
      })
    }
    
    this.currentY -= this.options.lineSpacing * 1.5
  }

  private async drawNote(note: KinkoNote, x: number, y: number, font: any) {
    // Main katakana
    this.currentPage.drawText(note.katakana, {
      x,
      y,
      size: this.options.fontSize,
      font,
      color: rgb(...this.options.colors.text)
    })
    
    // Duration marks
    if (note.duration > 1.0) {
      const durationMark = this.getDurationMark(note.duration)
      this.currentPage.drawText(durationMark, {
        x,
        y: y - 20,
        size: this.options.fontSize * 0.8,
        font,
        color: rgb(...this.options.colors.text)
      })
    }
    
    // Ornaments
    if (note.ornaments && note.ornaments.length > 0) {
      note.ornaments.forEach((ornament, index) => {
        this.currentPage.drawText(ornament, {
          x: x + (index * 8) - ((note.ornaments!.length - 1) * 4),
          y: y + 15,
          size: this.options.fontSize * 0.7,
          font,
          color: rgb(...this.options.colors.accent)
        })
      })
    }
  }

  private getDurationMark(duration: number): string {
    if (duration >= 4.0) return '———'
    if (duration >= 2.0) return '——'
    if (duration >= 1.5) return '—'
    return ''
  }

  async getBlob(): Promise<Blob> {
    const pdfBytes = await this.doc.save()
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
  }
}

// Utility function
export async function generateEnhancedKinkoPDF(
  score: KinkoScore,
  options?: Partial<EnhancedPDFOptions>
): Promise<Blob> {
  const generator = new EnhancedKinkoPDFGenerator(options)
  await generator.generatePDF(score)
  return generator.getBlob()
}