'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, AlertTriangle, CheckCircle, Music } from 'lucide-react'
import { SheetMusicProcessor, WesternScore } from '@/lib/sheet-music/processor'
import { KinkoScore } from '@/types'

interface SheetUploadProps {
  onConversionComplete: (kinkoScore: KinkoScore) => void
}

export function SheetUpload({ onConversionComplete }: SheetUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [westernScore, setWesternScore] = useState<WesternScore | null>(null)
  const [validation, setValidation] = useState<{
    isValid: boolean
    warnings: string[]
    suggestions: string[]
  } | null>(null)

  const processor = new SheetMusicProcessor()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (SheetMusicProcessor.isSupportedFormat(selectedFile.name)) {
        setFile(selectedFile)
        setWesternScore(null)
        setValidation(null)
      } else {
        alert('Unsupported file format. Please use PDF, MusicXML, or MIDI files.')
      }
    }
  }

  const handleProcess = async () => {
    if (!file) return

    setProcessing(true)
    setProgress(10)

    try {
      // Step 1: Process PDF/sheet music
      setProgress(30)
      const score = await processor.processPDF(file)
      setWesternScore(score)
      
      // Step 2: Validate for shakuhachi
      setProgress(50)
      const validationResult = processor.validateForShakuhachi(score)
      setValidation(validationResult)
      
      // Step 3: Convert to Kinko-ryu if valid
      setProgress(70)
      if (validationResult.isValid || validationResult.warnings.length === 0) {
        const kinkoScore = await processor.convertToKinko(score)
        setProgress(100)
        onConversionComplete(kinkoScore)
      } else {
        setProgress(100)
      }
      
    } catch (error) {
      console.error('Processing failed:', error)
      alert('Failed to process sheet music. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleProceedAnyway = async () => {
    if (!westernScore) return

    setProcessing(true)
    try {
      const kinkoScore = await processor.convertToKinko(westernScore)
      onConversionComplete(kinkoScore)
    } catch (error) {
      console.error('Conversion failed:', error)
      alert('Failed to convert sheet music.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Sheet Music Upload</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Upload your sheet music</p>
              <p className="text-sm text-gray-600 mb-4">
                Supported formats: PDF, MusicXML, MIDI
              </p>
              
              <input
                type="file"
                accept=".pdf,.xml,.musicxml,.mid,.midi"
                onChange={handleFileSelect}
                className="hidden"
                id="sheet-upload"
                disabled={processing}
              />
              
              <Button asChild variant="outline" disabled={processing}>
                <label htmlFor="sheet-upload" className="cursor-pointer">
                  Choose File
                </label>
              </Button>
              
              {file && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}
            </div>
            
            {file && !processing && !westernScore && (
              <Button onClick={handleProcess} className="w-full">
                Process Sheet Music
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Processing Progress */}
      {processing && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Music className="h-5 w-5 animate-pulse" />
                <span className="font-medium">Processing sheet music...</span>
              </div>
              <Progress value={progress} />
              <div className="text-sm text-gray-600">
                {progress < 30 && 'Reading and analyzing sheet music...'}
                {progress >= 30 && progress < 50 && 'Extracting musical notation...'}
                {progress >= 50 && progress < 70 && 'Validating for shakuhachi compatibility...'}
                {progress >= 70 && progress < 100 && 'Converting to Kinko-ryu notation...'}
                {progress === 100 && 'Complete!'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {validation.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              <span>Shakuhachi Compatibility Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {validation.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-yellow-700">Warnings:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-700">
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {validation.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-blue-700">Suggestions:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {validation.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-blue-700">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex space-x-3 pt-4">
              {validation.isValid && (
                <Button onClick={handleProcess} disabled={processing}>
                  Convert to Kinko-ryu
                </Button>
              )}
              
              {!validation.isValid && (
                <Button 
                  onClick={handleProceedAnyway} 
                  disabled={processing}
                  variant="outline"
                >
                  Proceed Anyway
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null)
                  setWesternScore(null)
                  setValidation(null)
                }}
              >
                Try Different File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Western Score Preview */}
      {westernScore && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Score Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div><strong>Title:</strong> {westernScore.title || 'Untitled'}</div>
                <div><strong>Composer:</strong> {westernScore.composer || 'Unknown'}</div>
                <div><strong>Key:</strong> {westernScore.keySignature}</div>
              </div>
              <div className="space-y-2">
                <div><strong>Time Signature:</strong> {westernScore.timeSignature.numerator}/{westernScore.timeSignature.denominator}</div>
                <div><strong>Tempo:</strong> {westernScore.tempo || 'Not specified'} BPM</div>
                <div><strong>Measures:</strong> {westernScore.measures.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}