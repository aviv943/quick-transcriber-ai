import { useState, useCallback, useRef, useEffect } from 'react';
import type { AudioFile } from '../../types';
import { isAudioFile } from '../../utils/file';
import './AudioUploader.css';

interface AudioUploaderProps {
  onFileSelect: (file: AudioFile) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  onFileSelect,
  isLoading = false,
  disabled = false,
}) => {

  
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize file input event listener
    const input = fileInputRef.current;
    if (input) {
      const testHandler = () => {
        // File input change handler
      };
      input.addEventListener('change', testHandler);
      
      return () => {
        input.removeEventListener('change', testHandler);
      };
    }
  }, []);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Validate file type
      if (!isAudioFile(file)) {
        throw new Error('Please select a valid audio file');
      }

      // Get audio duration (skipped for now to avoid potential issues)
      let duration: number | undefined;
      duration = undefined;

      const audioFile: AudioFile = {
        file,
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        duration,
        url: URL.createObjectURL(file),
      };

      // Call onFileSelect
      onFileSelect(audioFile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process file';
      console.error('File processing error:', err);
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isProcessing) {
      setIsDragOver(true);
    }
  }, [disabled, isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled || isProcessing) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [disabled, isProcessing, processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || isProcessing) {
      return;
    }
    
    const files = e.target.files;
    
    if (files && files.length > 0) {
      processFile(files[0]).finally(() => {
        // Reset input after processing is complete
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      });
    }
  }, [disabled, isProcessing, processFile]);

  const handleClick = useCallback(() => {
    if (!disabled && !isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled, isProcessing]);

  const supportedFormats = ['mp3', 'mp4', 'm4a', 'wav', 'webm'];

  return (
    <div className="audio-uploader">
      <div
        className={`upload-area ${isDragOver ? 'drag-over' : ''} ${disabled || isProcessing ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={disabled || isProcessing ? -1 : 0}
        aria-label="Upload audio file"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.m4a,.mp3,.wav,.mp4,.webm"
          onChange={handleFileInput}
          disabled={disabled || isProcessing}
          className="file-input"
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
        />

        <div className="upload-content">
          <div className="upload-icon">
            {isLoading || isProcessing ? (
              <div className="spinner" />
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
          </div>

          <div className="upload-text">
            <p className="primary-text">
              {isLoading ? 'Transcribing...' : 
               isProcessing ? 'Processing file...' : 
               'Drop your audio file here or click to browse'}
            </p>
            <p className="secondary-text">
              Supports: {supportedFormats.join(', ')} • Large files automatically compressed
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}; 