'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ProcessingJob } from '@/types'
import { Loader2, CheckCircle, XCircle, Clock, Download, Eye } from 'lucide-react'

interface ProcessingStatusProps {
  job: ProcessingJob
  onViewScore?: () => void
  onDownloadPDF?: () => void
}

export function ProcessingStatus({ job, onViewScore, onDownloadPDF }: ProcessingStatusProps) {
  const getStatusIcon = () => {
    switch (job.status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = () => {
    switch (job.status) {
      case 'pending':
        return 'Waiting to process...'
      case 'processing':
        return 'Analyzing audio and generating notation...'
      case 'completed':
        return 'Transcription completed successfully!'
      case 'error':
        return job.error || 'An error occurred during processing'
      default:
        return 'Unknown status'
    }
  }

  const getProgressText = () => {
    if (job.status === 'completed') return '100%'
    if (job.status === 'error') return 'Failed'
    if (job.status === 'pending') return '0%'
    return `${job.progress}%`
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          {getStatusIcon()}
          <span>Processing Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>{getStatusText()}</span>
              <span className="font-medium">{getProgressText()}</span>
            </div>
            <Progress 
              value={job.status === 'completed' ? 100 : job.progress} 
              className="h-2"
            />
          </div>
          
          {job.status === 'processing' && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div className={job.progress >= 20 ? 'text-foreground' : ''}>
                ✓ File uploaded and validated
              </div>
              <div className={job.progress >= 40 ? 'text-foreground' : ''}>
                • Analyzing audio signal...
              </div>
              <div className={job.progress >= 60 ? 'text-foreground' : ''}>
                • Detecting notes and timing...
              </div>
              <div className={job.progress >= 80 ? 'text-foreground' : ''}>
                • Converting to Kinko-ryu notation...
              </div>
              <div className={job.progress >= 95 ? 'text-foreground' : ''}>
                • Generating score and PDF...
              </div>
            </div>
          )}

          {job.result && job.status === 'completed' && (
            <div className="text-sm space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Processing Time:</span>
                  <span>{job.result.processingTime}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Confidence:</span>
                  <span>{(job.result.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                {onViewScore && (
                  <Button
                    onClick={onViewScore}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Score
                  </Button>
                )}
                
                {onDownloadPDF && (
                  <Button
                    onClick={onDownloadPDF}
                    size="sm"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}