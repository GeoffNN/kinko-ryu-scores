export interface AudioFile {
  file: File;
  name: string;
  duration?: number;
  format: string;
}

export interface YouTubeInput {
  url: string;
  title?: string;
  duration?: number;
}

export interface SheetMusicFile {
  file: File;
  name: string;
  pages: number;
}

export interface TranscriptionInput {
  type: 'audio' | 'youtube' | 'sheet';
  audio?: AudioFile;
  youtube?: YouTubeInput;
  sheet?: SheetMusicFile;
}

export interface KinkoNote {
  katakana: string;
  fingering: string;
  pitch: number;
  duration: number;
  ornaments?: string[];
  techniques?: string[];
}

export interface KinkoPhrase {
  notes: KinkoNote[];
  breath?: boolean;
  expression?: string;
}

export interface KinkoScore {
  title: string;
  phrases: KinkoPhrase[];
  tempo?: number;
  key?: string;
  metadata?: {
    composer?: string;
    arranger?: string;
    date?: string;
    originalFile?: string;
    fileSize?: string;
    format?: string;
    estimatedDuration?: string;
  };
}

export interface TranscriptionResult {
  id: string;
  score: KinkoScore;
  confidence: number;
  processingTime: number;
  originalFile?: string;
}

export interface ProcessingJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  errorDetails?: string;
  errorSuggestions?: string[];
  fileName?: string;
  fileFormat?: string;
  result?: TranscriptionResult;
}