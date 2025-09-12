# Kinko-ryu Transcription

A modern web application for transcribing music into traditional Japanese Kinko-ryu shakuhachi notation using AI-powered audio analysis.

## Features

- **Audio Transcription**: Upload audio files (MP3, WAV, FLAC) or YouTube URLs for automatic transcription
- **Sheet Music Conversion**: Convert Western notation (PDF, MusicXML) to Kinko-ryu format
- **Authentic Notation**: Traditional right-to-left katakana-based notation system
- **PDF Export**: High-quality PDF generation with fingering charts and metadata
- **Interactive Score Display**: Zoomable score viewer with traditional layout

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   - Supabase credentials (optional, for user accounts)
   - Vercel Blob token (optional, for file storage)
   - YouTube API key (optional, for enhanced YouTube support)

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
pnpm build
pnpm start
```

## Usage

### Audio Transcription
1. Go to the "Transcribe" page
2. Select "Audio Transcription" 
3. Upload an audio file or paste a YouTube URL
4. Wait for processing (typically 30-60 seconds)
5. Review and download your Kinko-ryu score

### Sheet Music Conversion
1. Go to the "Transcribe" page
2. Select "Sheet Music"
3. Upload a PDF of Western notation
4. Review compatibility analysis
5. Convert to Kinko-ryu format

## Technical Architecture

### Frontend
- **Framework**: Next.js 14 with App Router
- **UI**: React 18 + Tailwind CSS
- **Audio Processing**: Web Audio API + Tone.js
- **Score Rendering**: HTML5 Canvas

### Backend
- **API Routes**: Next.js API routes
- **PDF Generation**: pdf-lib with custom Kinko-ryu renderer
- **Audio Analysis**: Custom pitch detection algorithms
- **Database**: Supabase (PostgreSQL)

### Deployment
- **Platform**: Vercel
- **Storage**: Vercel Blob Storage
- **CDN**: Vercel Edge Network

## Kinko-ryu Notation System

Kinko-ryu (琴古流) is a traditional school of shakuhachi music notation:

- **Reading Direction**: Right to left, top to bottom
- **Basic Notes**: ロ (ro), ツ (tsu), レ (re), チ (chi), リ (ri)
- **Techniques**: Various symbols for ornaments, breath marks, and dynamics
- **Layout**: Traditional Japanese document formatting

### Fingering Chart

| Western | Katakana | Fingering | Frequency |
|---------|----------|-----------|-----------|
| D4      | ロ       | ro        | 293.66 Hz |
| F4      | ツ       | tsu       | 349.23 Hz |
| G4      | レ       | re        | 392.00 Hz |
| A4      | チ       | chi       | 440.00 Hz |
| C5      | リ       | ri        | 523.25 Hz |

## Best Practices for Audio Input

### Recommended
- High-quality solo instrumental recordings
- Clean audio with minimal background noise
- Monophonic (single melodic line) music
- Recordings in the shakuhachi range (D4-D6)
- Uncompressed formats when possible

### Avoid
- Polyphonic or multi-instrument recordings
- Low-quality or heavily compressed audio
- Recordings with reverb or heavy processing
- Very fast passages or complex ornaments
- Live recordings with audience noise

## API Endpoints

### POST /api/transcribe
Transcribe audio files to Kinko-ryu notation
- **Body**: FormData with audio file
- **Response**: JSON with score data and confidence metrics

### POST /api/pdf
Generate PDF from Kinko-ryu score data
- **Body**: JSON with score object and options
- **Response**: PDF file download

### POST /api/youtube
Extract and transcribe YouTube audio
- **Body**: JSON with YouTube URL
- **Response**: JSON with transcription result

## Contributing

Contributions are welcome! This project aims to preserve and promote traditional Japanese music notation through modern technology.

### Areas for Improvement
- Enhanced pitch detection algorithms
- More accurate ornament recognition
- Support for additional notation styles
- Mobile app development
- Community score sharing features

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Traditional Kinko-ryu shakuhachi masters and practitioners
- The shakuhachi community for guidance on notation authenticity
- Open source audio processing and PDF generation libraries

---

Built with ❤️ for the preservation of traditional Japanese music
