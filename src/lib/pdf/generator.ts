import jsPDF from 'jspdf'
import { KinkoScore, KinkoPhrase, KinkoNote } from '@/types'

export interface PDFOptions {
  pageWidth: number // mm
  pageHeight: number // mm
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  fontSize: number
  lineSpacing: number
  charSpacing: number
  title?: string
}

export class KinkoPDFGenerator {
  private doc: jsPDF
  private options: PDFOptions
  private currentY: number = 0
  private currentX: number = 0

  constructor(options?: Partial<PDFOptions>) {
    this.options = {
      pageWidth: 210, // A4 width
      pageHeight: 297, // A4 height
      margins: {
        top: 25,
        right: 20,
        bottom: 25,
        left: 20
      },
      fontSize: 14,
      lineSpacing: 20,
      charSpacing: 12,
      ...options
    }

    // Create PDF in portrait orientation
    this.doc = new jsPDF('portrait', 'mm', 'a4')
    this.setupFonts()
  }

  private async setupFonts() {
    // In a real implementation, you would load Japanese fonts
    // For now, we'll use built-in fonts with unicode support
    this.doc.setFont('helvetica')
    this.doc.setFontSize(this.options.fontSize)
  }

  async generatePDF(score: KinkoScore): Promise<Blob> {
    this.startNewPage()
    this.drawTitle(score.title)
    
    let phraseIndex = 0
    for (const phrase of score.phrases) {
      // Check if we need a new page
      if (this.currentY > this.options.pageHeight - this.options.margins.bottom - 50) {
        this.startNewPage()
      }
      
      this.drawPhrase(phrase, phraseIndex)
      phraseIndex++
    }
    
    this.drawMetadata(score.metadata)
    
    return new Blob([this.doc.output('arraybuffer')], { type: 'application/pdf' })
  }

  private startNewPage() {
    if (this.currentY > 0) {
      this.doc.addPage()
    }
    
    this.currentY = this.options.margins.top
    this.currentX = this.options.pageWidth - this.options.margins.right
  }

  private drawTitle(title: string) {
    const titleFontSize = this.options.fontSize * 1.5
    this.doc.setFontSize(titleFontSize)
    
    const titleWidth = this.doc.getTextWidth(title)
    const centerX = this.options.pageWidth / 2
    
    this.doc.text(title, centerX - titleWidth / 2, this.currentY)
    
    this.currentY += 25
    this.doc.setFontSize(this.options.fontSize)
  }

  private drawPhrase(phrase: KinkoPhrase, phraseIndex: number) {
    const startY = this.currentY
    let lineX = this.currentX
    
    // Draw phrase number/marker
    this.doc.setFontSize(this.options.fontSize * 0.8)
    this.doc.text(`[${phraseIndex + 1}]`, 5, this.currentY)
    this.doc.setFontSize(this.options.fontSize)
    
    // Draw notes from right to left
    for (const note of phrase.notes) {
      // Check if we need to wrap to next line
      if (lineX < this.options.margins.left + 30) {
        this.currentY += this.options.lineSpacing
        lineX = this.currentX
      }
      
      this.drawNote(note, lineX, this.currentY)
      lineX -= this.options.charSpacing
    }
    
    // Draw breath mark
    if (phrase.breath) {
      this.drawBreathMark(lineX + this.options.charSpacing / 2, this.currentY)
    }
    
    // Add extra spacing after phrase
    this.currentY += this.options.lineSpacing * 1.5
  }

  private drawNote(note: KinkoNote, x: number, y: number) {
    // Main katakana character
    this.doc.text(note.katakana, x, y)
    
    // Duration indicators
    if (note.duration > 1.0) {
      const durationMark = this.getDurationMark(note.duration)
      this.doc.setFontSize(this.options.fontSize * 0.8)
      this.doc.text(durationMark, x, y + 5)
      this.doc.setFontSize(this.options.fontSize)
    }
    
    // Ornaments above
    if (note.ornaments && note.ornaments.length > 0) {
      this.doc.setFontSize(this.options.fontSize * 0.7)
      note.ornaments.forEach((ornament, index) => {
        const ornamentX = x + (index * 3) - ((note.ornaments!.length - 1) * 1.5)
        this.doc.text(ornament, ornamentX, y - 5)
      })
      this.doc.setFontSize(this.options.fontSize)
    }
    
    // Techniques (small indicators)
    if (note.techniques && note.techniques.length > 0) {
      this.doc.setFontSize(this.options.fontSize * 0.6)
      note.techniques.forEach((technique, index) => {
        const indicator = this.getTechniqueIndicator(technique)
        this.doc.text(indicator, x + 3, y + 2 + (index * 2))
      })
      this.doc.setFontSize(this.options.fontSize)
    }
  }

  private getDurationMark(duration: number): string {
    if (duration >= 4.0) return '———'
    if (duration >= 2.0) return '——'
    if (duration >= 1.5) return '—'
    return ''
  }

  private getTechniqueIndicator(technique: string): string {
    const indicators: { [key: string]: string } = {
      vibrato: '~',
      glissando: '/',
      accent: '>',
      unstable: '°'
    }
    return indicators[technique] || '•'
  }

  private drawBreathMark(x: number, y: number) {
    this.doc.setFontSize(this.options.fontSize)
    this.doc.text('、', x, y)
  }

  private drawMetadata(metadata?: { composer?: string; arranger?: string; date?: string }) {
    if (!metadata) return
    
    const metadataY = this.options.pageHeight - this.options.margins.bottom
    let currentY = metadataY
    
    this.doc.setFontSize(this.options.fontSize * 0.8)
    
    if (metadata.composer) {
      this.doc.text(`Composer: ${metadata.composer}`, this.options.margins.left, currentY)
      currentY -= 5
    }
    
    if (metadata.arranger) {
      this.doc.text(`Arranger: ${metadata.arranger}`, this.options.margins.left, currentY)
      currentY -= 5
    }
    
    if (metadata.date) {
      this.doc.text(`Date: ${metadata.date}`, this.options.margins.left, currentY)
    }
  }

  // Get PDF as data URL for preview
  getDataURL(): string {
    return this.doc.output('dataurlstring')
  }

  // Save PDF file
  save(filename: string) {
    this.doc.save(filename)
  }
}

// Utility function to generate PDF from score
export async function generateKinkoPDF(
  score: KinkoScore, 
  options?: Partial<PDFOptions>
): Promise<Blob> {
  const generator = new KinkoPDFGenerator(options)
  return generator.generatePDF(score)
}