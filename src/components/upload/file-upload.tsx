'use client'

import React, { useState, useCallback } from 'react'
import { Upload, File, Music } from 'lucide-react'
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
    const maxSize = 50 * 1024 * 1024 // 50MB

    // Validate file size
    if (file.size > maxSize) {
      alert(`File is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 50MB.`)
      return
    }

    // Validate file extension - only audio files supported
    if (['mp3', 'wav', 'flac', 'm4a', 'ogg'].includes(extension || '')) {
      onUpload({
        type: 'audio',
        audio: {
          file,
          name: file.name,
          format: extension || 'unknown'
        }
      })
    } else {
      alert(`Unsupported file format '.${extension || 'unknown'}'. Supported formats: MP3, WAV, FLAC, M4A, OGG`)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
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
            Upload audio files (MP3, WAV, FLAC, M4A, OGG) to transcribe into Kinko-ryu notation
          </p>
          <input
            type="file"
            onChange={handleFileInput}
            accept=".mp3,.wav,.flac,.m4a,.ogg"
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

      {/* Supported Formats Info */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 text-sm">
          <Music className="h-4 w-4 text-primary" />
          <span>Supported formats: MP3, WAV, FLAC, M4A, OGG</span>
        </div>
      </div>
    </div>
  )
}