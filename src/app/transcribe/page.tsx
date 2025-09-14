'use client'

import { useState, useEffect } from 'react'
import { FileUpload } from '@/components/upload/file-upload'
import { ProcessingStatus } from '@/components/upload/processing-status'
import { ScoreDisplay } from '@/components/score/score-display'
import { SheetUpload } from '@/components/sheet-music/sheet-upload'
import { TranscriptionInput, ProcessingJob, KinkoScore } from '@/types'
import { AudioAnalyzer } from '@/lib/audio/analyzer'
import { KinkoMapper } from '@/lib/notation/kinko-mapper'
import { generateEnhancedKinkoPDF } from '@/lib/pdf/enhanced-generator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Music, FileText, ArrowLeft } from 'lucide-react'

export default function TranscribePage() {
  const [mode, setMode] = useState<'audio' | 'sheet' | 'result'>('audio')
  const [job, setJob] = useState<ProcessingJob | null>(null)
  const [score, setScore] = useState<KinkoScore | null>(null)
  
  // Check for result from homepage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('view') === 'result') {
      const storedResult = sessionStorage.getItem('transcriptionResult')
      if (storedResult) {
        try {
          const { job: storedJob, score: storedScore } = JSON.parse(storedResult)
          setJob(storedJob)
          setScore(storedScore)
          setMode('result')
          sessionStorage.removeItem('transcriptionResult')
        } catch (error) {
          console.error('Failed to load stored result:', error)
        }
      }
    }
  }, [])

  const handleAudioUpload = async (input: TranscriptionInput) => {
    const newJob: ProcessingJob = {
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0
    }
    
    setJob(newJob)

    try {
      // Simulate processing stages
      setJob(prev => prev ? { ...prev, status: 'processing', progress: 20 } : null)
      
      if (input.type === 'audio' && input.audio) {
        // Use the API endpoint instead of direct client-side processing
        setJob(prev => prev ? { ...prev, progress: 30 } : null)

        const formData = new FormData()
        formData.append('file', input.audio.file)
        formData.append('type', 'audio')

        try {
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
          })

          const data = await response.json()

          if (response.ok && data.success && data.result) {
            setJob(prev => prev ? {
              ...prev,
              status: 'completed',
              progress: 100,
              result: data.result
            } : null)

            setScore(data.result.score)
            setMode('result')
          } else {
            // Handle API error response
            setJob(prev => prev ? {
              ...prev,
              status: 'error',
              error: data.error || 'Failed to process audio file',
              errorDetails: data.details || 'An unknown error occurred during processing.',
              errorSuggestions: data.suggestions || [],
              fileName: data.fileName || input.audio?.name,
              fileFormat: data.fileFormat || input.audio?.format
            } : null)
          }
        } catch (error: any) {
          console.error('Network or parsing error:', error)

          // Handle network errors or JSON parsing errors
          setJob(prev => prev ? {
            ...prev,
            status: 'error',
            error: 'Network error',
            errorDetails: 'Failed to connect to the server. Please check your internet connection and try again.',
            errorSuggestions: [
              'Check your internet connection',
              'Try refreshing the page',
              'Make sure the file is not too large (50MB limit)'
            ],
            fileName: input.audio?.name,
            fileFormat: input.audio?.format
          } : null)
        }
      } else {
        // Unsupported input type
        setJob(prev => prev ? {
          ...prev,
          status: 'error',
          error: 'Unsupported input type',
          errorDetails: 'Only audio file upload is currently supported.',
          errorSuggestions: ['Upload an audio file (MP3, WAV, FLAC, M4A, OGG)']
        } : null)
      }

      /* Disabled features - only audio upload is supported
      } else if (input.type === 'youtube' && input.youtube) {
        // Handle YouTube URL processing
        setJob(prev => prev ? { ...prev, progress: 30 } : null)
        
        try {
          const response = await fetch('/api/youtube', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: input.youtube.url })
          })
          
          const data = await response.json()
          
          if (data.success && data.result) {
            setJob(prev => prev ? { 
              ...prev, 
              status: 'completed', 
              progress: 100,
              result: data.result
            } : null)
            
            setScore(data.result.score)
            setMode('result')
          } else {
            throw new Error(data.error || 'Failed to process YouTube URL')
          }
        } catch (error) {
          console.error('YouTube processing failed:', error)
          setJob(prev => prev ? { 
            ...prev, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Failed to process YouTube URL'
          } : null)
        }
      } else {
        // Handle other types with mock data
        setTimeout(() => {
          const mockScore: KinkoScore = {
            title: 'Sample Transcription',
            phrases: [
              {
                notes: [
                  { katakana: 'ロ', fingering: 'ro', pitch: 293.66, duration: 1.0 },
                  { katakana: 'ツ', fingering: 'tsu', pitch: 349.23, duration: 1.0 },
                  { katakana: 'レ', fingering: 're', pitch: 392.00, duration: 1.0 },
                  { katakana: 'チ', fingering: 'chi', pitch: 440.00, duration: 2.0 }
                ],
                breath: true
              }
            ]
          }
          
          setJob(prev => prev ? { 
            ...prev, 
            status: 'completed', 
            progress: 100,
            result: {
              id: 'demo-result',
              score: mockScore,
              confidence: 0.85,
              processingTime: 30
            }
          } : null)
          
          setScore(mockScore)
          setMode('result')
        }, 3000)
      }
      */

    } catch (error) {
      console.error('Transcription failed:', error)
      setJob(prev => prev ? {
        ...prev,
        status: 'error',
        error: 'Failed to transcribe audio. Please try again.'
      } : null)
    }
  }

  const handleSheetConversion = (kinkoScore: KinkoScore) => {
    setScore(kinkoScore)
    setMode('result')
  }

  const handleViewScore = () => {
    setMode('result')
  }

  const handleDownloadPDF = async () => {
    if (!score) return

    try {
      const pdfBlob = await generateEnhancedKinkoPDF(score, {
        showFingeringChart: true,
        showMetadata: true
      })
      
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${score.title || 'kinko-score'}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  const handleReset = () => {
    setMode('audio')
    setJob(null)
    setScore(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-slate-900">
              Kinko-ryu Transcription
            </h1>
          </div>
          <p className="text-lg text-slate-600">
            Transform your music into traditional Japanese shakuhachi notation
          </p>
        </header>

        {/* Mode Selection */}
        {mode !== 'result' && (
          <div className="max-w-2xl mx-auto mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant={mode === 'audio' ? 'default' : 'outline'}
                    onClick={() => setMode('audio')}
                    className="h-20 flex flex-col items-center space-y-2"
                  >
                    <Music className="h-6 w-6" />
                    <div>
                      <div className="font-medium">Audio Transcription</div>
                      <div className="text-xs text-muted-foreground">
                        Upload audio files or YouTube URLs
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    variant={mode === 'sheet' ? 'default' : 'outline'}
                    onClick={() => setMode('sheet')}
                    className="h-20 flex flex-col items-center space-y-2"
                  >
                    <FileText className="h-6 w-6" />
                    <div>
                      <div className="font-medium">Sheet Music</div>
                      <div className="text-xs text-muted-foreground">
                        Convert Western notation to Kinko-ryu
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content based on mode */}
        <main className="max-w-6xl mx-auto">
          {mode === 'audio' && !job && (
            <FileUpload 
              onUpload={handleAudioUpload}
              isProcessing={false}
            />
          )}

          {mode === 'audio' && job && (
            <div className="flex flex-col items-center space-y-8">
              <ProcessingStatus 
                job={job} 
                onViewScore={job.status === 'completed' && score ? handleViewScore : undefined}
                onDownloadPDF={job.status === 'completed' && score ? handleDownloadPDF : undefined}
              />
              
              {job.status === 'error' && (
                <Button onClick={handleReset} variant="outline">
                  Try Again
                </Button>
              )}
            </div>
          )}

          {mode === 'sheet' && (
            <SheetUpload onConversionComplete={handleSheetConversion} />
          )}

          {mode === 'result' && score && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  New Transcription
                </Button>

                {job?.result && (
                  <div className="text-sm text-muted-foreground">
                    Confidence: {(job.result.confidence * 100).toFixed(1)}% • 
                    Processing time: {job.result.processingTime}s
                  </div>
                )}
              </div>

              <ScoreDisplay 
                score={score}
                onDownload={handleDownloadPDF}
              />
            </div>
          )}
        </main>

        {/* Footer */}
        {mode !== 'result' && (
          <footer className="mt-16 text-center text-sm text-muted-foreground">
            <div className="space-y-2">
              <p>
                Traditional Kinko-ryu notation system • Built with modern AI technology
              </p>
              <p className="text-xs">
                Best results with solo instrumental recordings in quiet environments
              </p>
            </div>
          </footer>
        )}
      </div>
    </div>
  )
}