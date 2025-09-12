import { NextRequest, NextResponse } from 'next/server'
import { AudioAnalyzer } from '@/lib/audio/analyzer'
import { KinkoMapper } from '@/lib/notation/kinko-mapper'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Process based on type
    if (type === 'audio') {
      const analyzer = new AudioAnalyzer()
      
      try {
        // Analyze the audio file
        const analysisResult = await analyzer.analyzeAudioFile(file)
        
        // Convert to Kinko-ryu notation
        const kinkoScore = KinkoMapper.convertToKinko(analysisResult.notes)
        
        // Add metadata
        kinkoScore.title = file.name.replace(/\.[^/.]+$/, "")
        kinkoScore.tempo = analysisResult.tempo
        kinkoScore.key = analysisResult.key
        kinkoScore.metadata = {
          date: new Date().toISOString().split('T')[0]
        }

        return NextResponse.json({
          success: true,
          result: {
            id: Math.random().toString(36).substr(2, 9),
            score: kinkoScore,
            confidence: analysisResult.confidence,
            processingTime: Date.now() // Simplified timing
          }
        })
        
      } catch (analysisError) {
        console.error('Audio analysis failed:', analysisError)
        return NextResponse.json(
          { error: 'Failed to analyze audio file' },
          { status: 500 }
        )
      } finally {
        analyzer.dispose()
      }
      
    } else {
      return NextResponse.json(
        { error: 'Unsupported transcription type' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Transcription API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Kinko-ryu Transcription API',
    endpoints: {
      POST: 'Upload and transcribe audio files',
    },
    supportedFormats: ['mp3', 'wav', 'flac', 'm4a', 'ogg']
  })
}