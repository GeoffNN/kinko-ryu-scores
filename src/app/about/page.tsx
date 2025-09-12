import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Music, Target, Zap, Users } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              About Kinko-ryu Transcription
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Bridging traditional Japanese music notation with modern AI technology
            </p>
          </div>

          {/* Mission */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-6 w-6" />
                <span>Our Mission</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Our mission is to preserve and promote the traditional Japanese shakuhachi musical 
                notation system, Kinko-ryu (琴古流), by making it accessible through modern technology. 
                We believe that traditional arts should not be confined to the past, but should evolve 
                and adapt to serve contemporary musicians and learners.
              </p>
              <p>
                By combining artificial intelligence with deep respect for traditional notation 
                practices, we create tools that help musicians transcribe, learn, and share 
                shakuhachi music in its authentic written form.
              </p>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>AI-Powered Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Advanced pitch detection and musical analysis algorithms specifically 
                  tuned for the unique characteristics of shakuhachi music, including 
                  microtonal variations and traditional techniques.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Music className="h-5 w-5" />
                  <span>Authentic Notation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Faithful reproduction of traditional Kinko-ryu notation using proper 
                  katakana symbols, reading direction, and formatting conventions that 
                  have been used for centuries.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* About Kinko-ryu */}
          <Card>
            <CardHeader>
              <CardTitle>About Kinko-ryu Notation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Kinko-ryu (琴古流) is one of the most important schools of shakuhachi music, 
                established in the late 18th century by Kurosawa Kinko. The notation system 
                uses katakana characters to represent fingering positions and techniques 
                specific to the shakuhachi bamboo flute.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="font-semibold mb-2">Key Characteristics:</h3>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Right-to-left, top-to-bottom reading direction</li>
                    <li>Katakana symbols for fingering positions</li>
                    <li>Special markings for breath and expression</li>
                    <li>Emphasis on spiritual and meditative aspects</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Basic Fingerings:</h3>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>ロ (ro) - All holes closed</li>
                    <li>ツ (tsu) - First hole open</li>
                    <li>レ (re) - First two holes open</li>
                    <li>チ (chi) - First three holes open</li>
                    <li>リ (ri) - First four holes open</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technology */}
          <Card>
            <CardHeader>
              <CardTitle>Technology Stack</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Audio Processing</h3>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>Web Audio API</li>
                    <li>Tone.js</li>
                    <li>Custom pitch detection</li>
                    <li>FFT analysis</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Frontend</h3>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>Next.js 14</li>
                    <li>React 18</li>
                    <li>TypeScript</li>
                    <li>Tailwind CSS</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Document Generation</h3>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>PDF-lib</li>
                    <li>Canvas rendering</li>
                    <li>Japanese typography</li>
                    <li>Print optimization</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Community */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-6 w-6" />
                <span>For the Community</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                This project is designed for shakuhachi students, teachers, and enthusiasts 
                who want to work with traditional notation. Whether you're learning your 
                first pieces or preserving family repertoire, our tools are built to respect 
                and maintain the authenticity of the Kinko-ryu tradition.
              </p>
              <p className="mt-4 text-sm text-gray-600">
                We welcome feedback from the shakuhachi community to continuously improve 
                the accuracy and usefulness of our transcription tools.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}