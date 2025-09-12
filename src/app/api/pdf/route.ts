import { NextRequest, NextResponse } from 'next/server'
import { generateEnhancedKinkoPDF } from '@/lib/pdf/enhanced-generator'
import { KinkoScore } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { score, options } = body as { 
      score: KinkoScore, 
      options?: any 
    }

    if (!score) {
      return NextResponse.json(
        { error: 'Score data is required' },
        { status: 400 }
      )
    }

    // Validate score structure
    if (!score.phrases || !Array.isArray(score.phrases)) {
      return NextResponse.json(
        { error: 'Invalid score format: phrases array required' },
        { status: 400 }
      )
    }

    try {
      // Generate PDF
      const pdfBlob = await generateEnhancedKinkoPDF(score, {
        showFingeringChart: options?.showFingeringChart ?? true,
        showMetadata: options?.showMetadata ?? true,
        pageSize: options?.pageSize ?? 'A4',
        orientation: options?.orientation ?? 'portrait',
        ...options
      })

      // Convert blob to buffer for response
      const pdfBuffer = await pdfBlob.arrayBuffer()
      
      // Set appropriate headers
      const filename = `${score.title || 'kinko-score'}.pdf`
      
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBuffer.byteLength.toString(),
        }
      })

    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError)
      return NextResponse.json(
        { error: 'Failed to generate PDF' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('PDF API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Kinko-ryu PDF Generator API',
    usage: {
      method: 'POST',
      body: {
        score: 'KinkoScore object',
        options: {
          showFingeringChart: 'boolean (default: true)',
          showMetadata: 'boolean (default: true)',
          pageSize: 'A4 | Letter | A3 (default: A4)',
          orientation: 'portrait | landscape (default: portrait)'
        }
      }
    }
  })
}