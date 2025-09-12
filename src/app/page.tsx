'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/upload/file-upload'
import { ProcessingStatus } from '@/components/upload/processing-status'
import { TranscriptionInput, ProcessingJob } from '@/types'
import { generateEnhancedKinkoPDF } from '@/lib/pdf/enhanced-generator'
import { Music } from 'lucide-react'

export default function Home() {
  const [job, setJob] = useState<ProcessingJob | null>(null)

  const handleUpload = async (input: TranscriptionInput) => {
    // Create initial job
    const newJob: ProcessingJob = {
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0
    }
    
    setJob(newJob)

    // Simulate processing for demo
    setTimeout(() => {
      setJob(prev => prev ? { ...prev, status: 'processing', progress: 20 } : null)
    }, 1000)

    setTimeout(() => {
      setJob(prev => prev ? { ...prev, progress: 50 } : null)
    }, 3000)

    setTimeout(() => {
      setJob(prev => prev ? { ...prev, progress: 80 } : null)
    }, 5000)

    setTimeout(() => {
      setJob(prev => prev ? { 
        ...prev, 
        status: 'completed', 
        progress: 100,
        result: {
          id: 'demo-result',
          score: {
            title: 'Transcribed Piece',
            phrases: [],
          },
          confidence: 0.85,
          processingTime: 45
        }
      } : null)
    }, 7000)
  }

  const handleDownloadPDF = async () => {
    if (!job?.result?.score) return

    try {
      const pdfBlob = await generateEnhancedKinkoPDF(job.result.score, {
        showFingeringChart: true,
        showMetadata: true
      })
      
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${job.result.score.title || 'kinko-score'}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  const handleViewScore = () => {
    // For the main page, we could redirect to the transcribe page
    // or implement a modal view of the score
    alert('Score viewing feature - would show detailed score view')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-slate-900">
              Kinko-ryu Transcription
            </h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Transform your music into traditional Japanese Kinko-ryu notation using AI-powered transcription
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          {!job ? (
            <div className="space-y-8">
              <FileUpload onUpload={handleUpload} />
              
              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="text-center p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Music className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Audio Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Advanced pitch detection and note recognition for solo instrumental music
                  </p>
                </div>
                <div className="text-center p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-lg font-bold text-green-600">竹</span>
                  </div>
                  <h3 className="font-semibold mb-2">Kinko-ryu Notation</h3>
                  <p className="text-sm text-muted-foreground">
                    Authentic traditional Japanese shakuhachi notation with proper katakana symbols
                  </p>
                </div>
                <div className="text-center p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-lg font-bold text-purple-600">PDF</span>
                  </div>
                  <h3 className="font-semibold mb-2">Export & Print</h3>
                  <p className="text-sm text-muted-foreground">
                    High-quality PDF generation optimized for traditional score layout
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-8">
              <ProcessingStatus 
                job={job}
                onViewScore={job.status === 'completed' && job.result?.score ? handleViewScore : undefined}
                onDownloadPDF={job.status === 'completed' && job.result?.score ? handleDownloadPDF : undefined}
              />
              
              {job.status === 'completed' && (
                <div className="text-center">
                  <button 
                    onClick={() => setJob(null)}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Start New Transcription
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-20 text-center text-sm text-muted-foreground">
          <p>
            Traditional Kinko-ryu notation system • Built with modern AI technology
          </p>
        </footer>
      </div>
    </div>
  )
}