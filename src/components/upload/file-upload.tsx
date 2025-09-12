'use client'

import React, { useState, useCallback } from 'react'
import { Upload, File, Music, Youtube, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TranscriptionInput } from '@/types'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onUpload: (input: TranscriptionInput) => void
  isProcessing?: boolean
}

export function FileUpload({ onUpload, isProcessing = false }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [])

  const handleFileSelect = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase()
    
    if (['mp3', 'wav', 'flac', 'm4a', 'ogg'].includes(extension || '')) {
      onUpload({
        type: 'audio',
        audio: {
          file,
          name: file.name,
          format: extension || 'unknown'
        }
      })
    } else if (['pdf'].includes(extension || '')) {
      onUpload({
        type: 'sheet',
        sheet: {
          file,
          name: file.name,
          pages: 1 // Will be determined later
        }
      })
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleYouTubeSubmit = () => {
    if (youtubeUrl.trim()) {
      onUpload({
        type: 'youtube',
        youtube: {
          url: youtubeUrl.trim()
        }
      })
      setYoutubeUrl('')
    }
  }

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be')
  }

  return (
    <div className="space-y-6">
      {/* Drag and Drop Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors duration-200",
          dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          isProcessing && "opacity-50 pointer-events-none"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-16 px-6">
          <Upload className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Drop your files here
          </h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Upload audio files (MP3, WAV, FLAC) or sheet music (PDF) to transcribe into Kinko-ryu notation
          </p>
          <input
            type="file"
            onChange={handleFileInput}
            accept=".mp3,.wav,.flac,.m4a,.ogg,.pdf"
            className="hidden"
            id="file-upload"
            disabled={isProcessing}
          />
          <Button 
            asChild 
            variant="outline" 
            disabled={isProcessing}
            className="mb-4"
          >
            <label htmlFor="file-upload" className="cursor-pointer">
              <File className="h-4 w-4 mr-2" />
              Choose Files
            </label>
          </Button>
        </CardContent>
      </Card>

      {/* YouTube URL Input */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Youtube className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-medium">YouTube URL</h3>
          </div>
          <div className="flex space-x-2">
            <input
              type="url"
              placeholder="Paste YouTube URL here..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isProcessing}
            />
            <Button
              onClick={handleYouTubeSubmit}
              disabled={!isYouTubeUrl(youtubeUrl) || isProcessing}
            >
              Transcribe
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Supported Formats Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <Music className="h-4 w-4 text-primary" />
          <span>Audio: MP3, WAV, FLAC, M4A</span>
        </div>
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-primary" />
          <span>Sheet Music: PDF</span>
        </div>
        <div className="flex items-center space-x-2">
          <Youtube className="h-4 w-4 text-primary" />
          <span>YouTube Videos</span>
        </div>
      </div>
    </div>
  )
}