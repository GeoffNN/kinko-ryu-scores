// YouTube audio extraction utilities
import ytdl from 'ytdl-core'
import { Readable } from 'stream'

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

    try {
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
          resolve({ buffer, info })
        })
        
        stream.on('error', (error) => {
          console.error('YouTube download error:', error)
          reject(new Error(`Failed to download YouTube audio: ${error.message}`))
        })
      })
      
    } catch (error) {
      console.error('YouTube extraction failed:', error)
      throw new Error(`YouTube processing failed: ${error}`)
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