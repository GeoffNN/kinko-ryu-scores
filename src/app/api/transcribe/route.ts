import { NextRequest, NextResponse } from 'next/server'
import { ServerAudioAnalyzer } from '@/lib/audio/server-analyzer'
import { KinkoMapper } from '@/lib/notation/kinko-mapper'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    // Validate file presence
    if (!file) {
      return NextResponse.json(
        {
          error: 'No file provided',
          details: 'Please select an audio file to upload.'
        },
        { status: 400 }
      )
    }

    // Validate file type
    if (!type) {
      return NextResponse.json(
        {
          error: 'File type not specified',
          details: 'The upload request is missing the file type parameter.'
        },
        { status: 400 }
      )
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: 'File too large',
          details: `File size is ${Math.round(file.size / 1024 / 1024)}MB. Maximum allowed size is 50MB.`,
          fileSize: file.size,
          maxSize: maxSize
        },
        { status: 400 }
      )
    }

    // Validate file format
    const supportedFormats = ['mp3', 'wav', 'flac', 'm4a', 'ogg']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (!fileExtension || !supportedFormats.includes(fileExtension)) {
      return NextResponse.json(
        {
          error: 'Unsupported file format',
          details: `File format '.${fileExtension}' is not supported. Supported formats: ${supportedFormats.join(', ')}`,
          fileName: file.name,
          supportedFormats: supportedFormats
        },
        { status: 400 }
      )
    }

    console.log(`Processing ${fileExtension.toUpperCase()} file: ${file.name} (${Math.round(file.size / 1024)}KB)`)

    // Process based on type
    if (type === 'audio') {
      const analyzer = new ServerAudioAnalyzer()

      try {
        // Convert file to buffer
        console.log('Converting file to buffer...')
        const arrayBuffer = await file.arrayBuffer()
        const audioBuffer = Buffer.from(arrayBuffer)

        // Estimate duration (this is simplified - real duration would need audio decoding)
        const estimatedDuration = Math.max(10, file.size / (44100 * 2)) // Rough estimate

        // Analyze the audio file
        console.log('Starting audio analysis...')
        const analysisResult = await analyzer.analyzeAudioBuffer(audioBuffer, estimatedDuration)
        console.log(`Analysis completed: ${analysisResult.notes.length} notes detected`)

        // Convert to Kinko-ryu notation
        const kinkoScore = KinkoMapper.convertToKinko(analysisResult.notes)

        // Add metadata
        kinkoScore.title = file.name.replace(/\.[^/.]+$/, "")
        kinkoScore.tempo = analysisResult.tempo
        kinkoScore.key = analysisResult.key
        kinkoScore.metadata = {
          date: new Date().toISOString().split('T')[0],
          originalFile: file.name,
          fileSize: `${Math.round(file.size / 1024)}KB`,
          format: fileExtension.toUpperCase(),
          estimatedDuration: `${Math.round(estimatedDuration)}s`
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

      } catch (analysisError: any) {
        console.error('Audio analysis failed:', analysisError)

        let errorMessage = 'Failed to analyze audio file'
        let errorDetails = 'An unknown error occurred during audio processing.'

        // Provide specific error messages based on the error type
        if (analysisError.message) {
          if (analysisError.message.includes('decodeAudioData')) {
            errorMessage = 'Audio decoding failed'
            errorDetails = `Unable to decode ${fileExtension.toUpperCase()} file. The file may be corrupted or use an unsupported codec variant. Try converting to WAV or MP3 format.`
          } else if (analysisError.message.includes('AudioContext')) {
            errorMessage = 'Audio processing unavailable'
            errorDetails = 'Web Audio API is not available in your browser or environment. Try using a modern browser like Chrome, Firefox, or Safari.'
          } else if (analysisError.message.includes('pitch detection')) {
            errorMessage = 'Pitch detection failed'
            errorDetails = 'Unable to detect musical notes in the audio. The recording may be too noisy, contain multiple instruments, or lack clear pitched content.'
          } else if (analysisError.message.includes('empty') || analysisError.message.includes('no audio')) {
            errorMessage = 'No audio detected'
            errorDetails = 'The uploaded file appears to be empty or contains no audible audio data.'
          } else {
            errorDetails = `Processing error: ${analysisError.message}`
          }
        }

        return NextResponse.json(
          {
            error: errorMessage,
            details: errorDetails,
            fileName: file.name,
            fileFormat: fileExtension,
            suggestions: [
              'Ensure the audio file contains clear, solo instrumental music',
              'Try converting to WAV or MP3 format if using M4A',
              'Check that the file is not corrupted',
              'Use recordings with minimal background noise'
            ]
          },
          { status: 500 }
        )
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