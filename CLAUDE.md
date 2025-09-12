# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive music transcription application that converts solo instrumental music into traditional Japanese Kinko-ryu shakuhachi notation using modern web technologies and AI-powered audio analysis.

## Technology Stack

- **Framework**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Package Manager**: pnpm
- **Audio Processing**: Web Audio API, Tone.js, custom pitch detection algorithms
- **PDF Generation**: pdf-lib, jsPDF with Japanese typography support
- **Database**: Supabase (PostgreSQL) integration ready
- **Deployment**: Configured for Vercel hosting
- **Storage**: Vercel Blob Storage integration prepared

## Development Commands

```bash
# Development
pnpm dev          # Start development server on http://localhost:3000
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript type checking
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page with demo functionality
│   ├── transcribe/        # Main transcription interface
│   ├── about/             # Project information
│   ├── help/              # User documentation
│   └── api/               # API routes (transcribe, youtube, pdf)
├── components/            # React components
│   ├── ui/               # Base UI components (Button, Card, etc.)
│   ├── upload/           # File upload and processing status
│   ├── score/            # Kinko-ryu score display and rendering
│   └── sheet-music/      # Western notation processing
├── lib/                   # Core libraries
│   ├── audio/            # Audio analysis and YouTube extraction
│   ├── notation/         # Kinko-ryu notation engine and mapping
│   ├── pdf/              # PDF generation with Japanese typography
│   ├── sheet-music/      # Western notation to Kinko-ryu conversion
│   └── supabase/         # Database client setup
└── types/                # TypeScript type definitions
```

## Current Implementation Status

### ✅ FULLY IMPLEMENTED
- **Next.js Application**: Complete web app with navigation, routing, and pages
- **UI Components**: Modern, responsive interface with Tailwind CSS
- **File Upload System**: Drag-and-drop for audio files and YouTube URLs
- **Processing Status**: Real-time progress with download buttons
- **Kinko-ryu Notation Engine**: Authentic Japanese notation rendering
- **Score Display**: Interactive canvas-based score viewer with zoom controls
- **PDF Generation**: High-quality PDFs with traditional layout and fingering charts
- **Western Sheet Music Upload**: PDF upload with compatibility analysis
- **Documentation**: Complete user help and about pages

### 🔄 MOCK/DEMO STAGE
- **Audio Analysis**: Basic pitch detection framework exists but uses simplified mock data
- **YouTube Audio Extraction**: URL validation works, actual audio download needs server implementation
- **Sheet Music OCR**: PDF upload and validation working, actual notation extraction is mocked
- **Real-time Processing**: Progress indicators work, but actual audio processing is simulated

### 🎯 PRODUCTION READY
- **PDF Export**: Fully functional with traditional Japanese formatting
- **Score Rendering**: Authentic Kinko-ryu notation display
- **User Interface**: Complete responsive design
- **Navigation**: Multi-page application structure
- **Error Handling**: User-friendly error states and validation

## Architecture Notes

### Kinko-ryu Notation System
- Traditional right-to-left, top-to-bottom reading direction
- Katakana-based fingering notation: ロ (ro), ツ (tsu), レ (re), チ (chi), リ (ri)
- Breath marks, ornaments, and technique indicators
- Professional PDF generation with embedded Japanese fonts

### Audio Processing Pipeline
- Web Audio API integration for client-side analysis
- Autocorrelation-based pitch detection algorithms
- Note onset detection and musical phrase grouping
- Western to Japanese note mapping

### Development Considerations
- ESLint configured with relaxed rules for warnings vs errors
- TypeScript strict mode enabled
- Component-based architecture for reusability
- Responsive design principles throughout