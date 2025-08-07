export interface SummaryData {
  englishTitle?: string;
  hebrewTitle?: string;
  english: string;
  hebrew: string;
  contentType: 'meeting' | 'conversation' | 'lecture' | 'interview' | 'song' | 'script' | 'other';
  keyPoints: string[];
  hebrewKeyPoints?: string[];
  insights?: string[];
  hebrewInsights?: string[];
  actionItems?: string[];
  hebrewActionItems?: string[];
  participants?: string[];
  hebrewParticipants?: string[];
  timeline?: string;
  hebrewTimeline?: string;
  priority?: 'high' | 'medium' | 'low';
  createdAt: Date;
}

export interface TranscriptionResult {
  id: string;
  text: string;
  audioFileName: string;
  duration?: number;
  language?: string;
  confidence?: number;
  createdAt: Date;
  summary?: SummaryData;
  context?: string;
}

export interface AudioFile {
  file: File;
  id: string;
  name: string;
  size: number;
  duration?: number;
  url?: string;
}

export interface AppSettings {
  apiKey: string;
  model: 'whisper-1';
  language?: string;
  temperature?: number;
}

export interface TranscriptionRequest {
  file: File;
  model: string;
  language?: string;
  temperature?: number;
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

export interface SummaryRequest {
  text: string;
  language?: string;
  audioFileName: string;
  context?: string;
}

export interface TranscriptionError {
  message: string;
  code?: string;
  type: 'api_error' | 'file_error' | 'network_error' | 'validation_error';
}

export interface BatchProgress {
  phase: 'analyzing' | 'chunking' | 'processing' | 'combining';
  currentChunk: number;
  totalChunks: number;
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
}

export interface TranscriptionState {
  isLoading: boolean;
  error: TranscriptionError | null;
  results: TranscriptionResult[];
  currentFile: AudioFile | null;
  batchProgress?: BatchProgress;
}

export interface SettingsState {
  isOpen: boolean;
  settings: AppSettings;
  isValid: boolean;
}

export type Theme = 'light' | 'dark' | 'system'; 