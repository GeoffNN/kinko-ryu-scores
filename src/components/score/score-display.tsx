'use client'

import React, { useRef, useEffect, useState } from 'react'
import { KinkoScore } from '@/types'
import { KinkoScoreRenderer } from '@/lib/notation/score-renderer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface ScoreDisplayProps {
  score: KinkoScore
  onDownload?: () => void
}

export function ScoreDisplay({ score, onDownload }: ScoreDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [renderer, setRenderer] = useState<KinkoScoreRenderer | null>(null)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    if (canvasRef.current) {
      const newRenderer = new KinkoScoreRenderer(canvasRef.current, {
        width: 800,
        height: 1200,
        fontSize: 24,
        lineSpacing: 40,
        charSpacing: 30,
        margins: { top: 60, right: 60, bottom: 60, left: 60 }
      })
      
      setRenderer(newRenderer)
      newRenderer.renderScore(score)
    }
  }, [score])

  useEffect(() => {
    if (canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current
      const container = containerRef.current
      
      // Update canvas display size based on zoom
      canvas.style.width = `${800 * zoom}px`
      canvas.style.height = `${1200 * zoom}px`
      
      // Center the canvas if it's smaller than container
      if (800 * zoom < container.clientWidth) {
        canvas.style.marginLeft = 'auto'
        canvas.style.marginRight = 'auto'
        canvas.style.display = 'block'
      }
    }
  }, [zoom])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25))
  }

  const handleResetZoom = () => {
    setZoom(1)
  }

  const handleDownloadPNG = () => {
    if (canvasRef.current) {
      const dataURL = canvasRef.current.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `${score.title || 'kinko-score'}.png`
      link.href = dataURL
      link.click()
    }
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span className="text-xl font-bold">琴古流記譜</span>
            <span className="text-sm text-muted-foreground ml-2">
              Kinko-ryu Notation
            </span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.25}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetZoom}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <span className="text-sm text-muted-foreground min-w-[60px]">
              {Math.round(zoom * 100)}%
            </span>
            
            <Button
              onClick={handleDownloadPNG}
              size="sm"
              className="ml-4"
            >
              <Download className="h-4 w-4 mr-2" />
              PNG
            </Button>
            
            {onDownload && (
              <Button
                onClick={onDownload}
                size="sm"
                variant="default"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div 
          ref={containerRef}
          className="border border-gray-200 rounded-lg overflow-auto bg-white"
          style={{ 
            maxHeight: '80vh',
            minHeight: '400px'
          }}
        >
          <canvas
            ref={canvasRef}
            className="block"
            style={{
              imageRendering: 'crisp-edges',
              maxWidth: 'none'
            }}
          />
        </div>
        
        {/* Score Information */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Title:</span>
              <span>{score.title}</span>
            </div>
            {score.tempo && (
              <div className="flex justify-between">
                <span className="font-medium">Tempo:</span>
                <span>{score.tempo} BPM</span>
              </div>
            )}
            {score.key && (
              <div className="flex justify-between">
                <span className="font-medium">Key:</span>
                <span>{score.key}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Phrases:</span>
              <span>{score.phrases.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total Notes:</span>
              <span>
                {score.phrases.reduce((total, phrase) => total + phrase.notes.length, 0)}
              </span>
            </div>
            {score.metadata?.date && (
              <div className="flex justify-between">
                <span className="font-medium">Date:</span>
                <span>{score.metadata.date}</span>
              </div>
            )}
          </div>
        </div>

        {/* Traditional Reading Note */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm">
          <p className="text-blue-800">
            <strong>Reading Direction:</strong> Traditional Kinko-ryu notation is read from right to left, 
            top to bottom, following classical Japanese text direction. The katakana characters represent 
            shakuhachi fingerings and techniques.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}