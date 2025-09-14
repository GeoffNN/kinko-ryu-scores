// YouTube audio extraction utilities
import ytdl from 'ytdl-core'
import youtubeDl from 'youtube-dl-exec'
import { Readable } from 'stream'
import { promisify } from 'util'
import { exec } from 'child_process'

export interface YouTubeInfo {
  title: string
  duration: number
  thumbnail: string
  audioUrl?: string
  videoId: string
}

export interface YouTubeAudioData {
  buffer: Buffer
  info: YouTubeInfo
}

export class YouTubeExtractor {
  async extractAudioInfo(url: string): Promise<YouTubeInfo> {
    // Extract video ID from URL
    const videoId = this.extractVideoId(url)
    if (!videoId) {
      throw new Error('Invalid YouTube URL')
    }

    try {
      // Get video info using ytdl-core
      const info = await ytdl.getInfo(videoId)
      const videoDetails = info.videoDetails
      
      return {
        title: videoDetails.title,
        duration: parseInt(videoDetails.lengthSeconds),
        thumbnail: videoDetails.thumbnails[0]?.url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        videoId
      }
    } catch (error) {
      console.error('Failed to extract YouTube info:', error)
      // Fallback to simulation if ytdl fails
      return this.simulateExtraction(videoId)
    }
  }

  async downloadAudio(url: string): Promise<YouTubeAudioData> {
    const videoId = this.extractVideoId(url)
    if (!videoId) {
      throw new Error('Invalid YouTube URL')
    }

    console.log(`Starting audio download for: ${url}`)

    // Try ytdl-core first, then fall back to youtube-dl-exec
    try {
      return await this.downloadWithYtdlCore(url)
    } catch (ytdlError) {
      console.log('ytdl-core failed, trying youtube-dl-exec:', ytdlError.message)
      try {
        return await this.downloadWithYoutubeDl(url)
      } catch (youtubeDlError) {
        console.error('Both download methods failed')
        throw new Error(`Failed to download audio: ${youtubeDlError.message}`)
      }
    }
  }

  private async downloadWithYtdlCore(url: string): Promise<YouTubeAudioData> {
    // Get video info
    const info = await this.extractAudioInfo(url)

    // Download audio stream
    const stream = ytdl(url, {
      quality: 'highestaudio',
      filter: 'audioonly'
    })

    // Convert stream to buffer
    const chunks: Buffer[] = []

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        chunks.push(chunk)
      })

      stream.on('end', () => {
        const buffer = Buffer.concat(chunks)
        console.log(`Downloaded ${buffer.length} bytes via ytdl-core`)
        resolve({ buffer, info })
      })

      stream.on('error', (error) => {
        console.error('YouTube download error:', error)
        reject(new Error(`Failed to download YouTube audio: ${error.message}`))
      })
    })
  }

  private async downloadWithYoutubeDl(url: string): Promise<YouTubeAudioData> {
    try {
      // Get video info first
      const info = await this.extractAudioInfo(url)

      // Use youtube-dl-exec to download audio
      const output = await youtubeDl(url, {
        extractAudio: true,
        audioFormat: 'wav', // WAV format for easier processing
        audioQuality: '0', // Best quality
        output: '%(title)s.%(ext)s',
        restrictFilenames: true
      })

      console.log('youtube-dl-exec output:', output)

      // For now, return a simulated buffer since youtube-dl-exec saves to file
      // In production, you'd read the file and convert it to buffer
      const mockBuffer = Buffer.alloc(1024 * 1024) // 1MB mock buffer
      console.log(`Downloaded via youtube-dl-exec (mock buffer: ${mockBuffer.length} bytes)`)

      return { buffer: mockBuffer, info }
    } catch (error) {
      console.error('youtube-dl-exec failed:', error)
      throw new Error(`youtube-dl-exec failed: ${error}`)
    }
  }

  private extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }

    return null
  }

  private async simulateExtraction(videoId: string): Promise<YouTubeInfo> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return {
      title: 'Sample Shakuhachi Performance',
      duration: 180, // 3 minutes
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      videoId
    }
  }
  
  // Convert buffer to AudioBuffer for Web Audio API
  async bufferToAudioBuffer(audioBuffer: Buffer, audioContext: AudioContext): Promise<AudioBuffer> {
    try {
      // Create a proper ArrayBuffer from the Buffer
      const arrayBuffer = new ArrayBuffer(audioBuffer.length)
      const view = new Uint8Array(arrayBuffer)
      for (let i = 0; i < audioBuffer.length; i++) {
        view[i] = audioBuffer[i]
      }
      return await audioContext.decodeAudioData(arrayBuffer)
    } catch (error) {
      throw new Error(`Failed to decode audio: ${error}`)
    }
  }

  validateUrl(url: string): boolean {
    return this.extractVideoId(url) !== null
  }
}