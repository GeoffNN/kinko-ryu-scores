import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HelpCircle, Upload, FileText, Music, Download, Zap } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Help & Support
            </h1>
            <p className="text-xl text-slate-600">
              Learn how to use Kinko-ryu Transcription effectively
            </p>
          </div>

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-6 w-6" />
                <span>Getting Started</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Audio Transcription</h3>
                  <ol className="text-sm space-y-2 list-decimal list-inside">
                    <li>Click "Audio Transcription" on the main page</li>
                    <li>Upload an audio file (MP3, WAV, FLAC) or paste a YouTube URL</li>
                    <li>Wait for the AI to analyze and transcribe the music</li>
                    <li>Review and download your Kinko-ryu notation</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Sheet Music Conversion</h3>
                  <ol className="text-sm space-y-2 list-decimal list-inside">
                    <li>Click "Sheet Music" on the main page</li>
                    <li>Upload a PDF of Western notation</li>
                    <li>Review compatibility warnings if any</li>
                    <li>Convert to traditional Kinko-ryu format</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Music className="h-6 w-6" />
                <span>Best Practices for Audio Transcription</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2 text-green-600">✓ Do</h3>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Use high-quality audio recordings</li>
                    <li>Ensure single instrument (monophonic) pieces</li>
                    <li>Choose recordings with minimal background noise</li>
                    <li>Use pieces in the shakuhachi range (D4-D6)</li>
                    <li>Prefer solo performances over ensemble pieces</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2 text-red-600">✗ Avoid</h3>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Low-quality or compressed audio</li>
                    <li>Polyphonic or multi-instrument recordings</li>
                    <li>Recordings with heavy reverb or effects</li>
                    <li>Very fast passages or complex ornaments</li>
                    <li>Live recordings with audience noise</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Formats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-6 w-6" />
                <span>Supported File Formats</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Audio Files</h3>
                  <ul className="text-sm space-y-1">
                    <li>• MP3 (.mp3)</li>
                    <li>• WAV (.wav)</li>
                    <li>• FLAC (.flac)</li>
                    <li>• M4A (.m4a)</li>
                    <li>• OGG (.ogg)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Sheet Music</h3>
                  <ul className="text-sm space-y-1">
                    <li>• PDF (.pdf)</li>
                    <li>• MusicXML (.xml)</li>
                    <li>• MIDI (.mid, .midi)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Web Sources</h3>
                  <ul className="text-sm space-y-1">
                    <li>• YouTube URLs</li>
                    <li>• YouTube Music URLs</li>
                    <li>• Youtu.be short URLs</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Understanding Results */}
          <Card>
            <CardHeader>
              <CardTitle>Understanding Your Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Confidence Score</h3>
                <p className="text-sm mb-2">
                  The confidence score indicates how certain the AI is about the transcription:
                </p>
                <ul className="text-sm space-y-1 list-disc list-inside ml-4">
                  <li><strong>90-100%:</strong> Excellent - High confidence in accuracy</li>
                  <li><strong>80-90%:</strong> Good - Minor uncertainties, generally reliable</li>
                  <li><strong>70-80%:</strong> Fair - Some sections may need manual review</li>
                  <li><strong>Below 70%:</strong> Poor - Significant uncertainties, review carefully</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Kinko-ryu Symbols</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl mb-1">ロ</div>
                    <div>ro (D)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">ツ</div>
                    <div>tsu (F)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">レ</div>
                    <div>re (G)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">チ</div>
                    <div>chi (A)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">リ</div>
                    <div>ri (C)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HelpCircle className="h-6 w-6" />
                <span>Troubleshooting</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Common Issues</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>Q: The transcription seems inaccurate</strong>
                      <p>A: Try using a higher quality recording with less background noise. Ensure the audio contains only a single melodic line.</p>
                    </div>
                    
                    <div>
                      <strong>Q: Processing is taking too long</strong>
                      <p>A: Large files or complex audio may take longer. Try using shorter clips (under 5 minutes) for faster processing.</p>
                    </div>
                    
                    <div>
                      <strong>Q: YouTube URL not working</strong>
                      <p>A: Ensure the URL is accessible and the video contains audio. Some videos may be restricted or unavailable.</p>
                    </div>
                    
                    <div>
                      <strong>Q: PDF export is blank</strong>
                      <p>A: This might be a browser issue. Try refreshing the page and generating the PDF again.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-6 w-6" />
                <span>Export Options</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">PDF Export</h3>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>High-resolution PDF suitable for printing</li>
                    <li>Includes fingering chart and metadata</li>
                    <li>Traditional right-to-left layout</li>
                    <li>Multiple page sizes (A4, Letter, A3)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">PNG Export</h3>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Image format for web sharing</li>
                    <li>Adjustable zoom levels</li>
                    <li>Good for social media or presentations</li>
                    <li>Transparent background option</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Still Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                If you encounter issues not covered in this guide, please check our FAQ section 
                or contact our support team. We're committed to helping you make the most of 
                traditional Kinko-ryu notation tools.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}