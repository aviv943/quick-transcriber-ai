import { useCallback, useEffect, useState } from 'react';
import type { AudioFile, TranscriptionResult as TranscriptionResultType } from './types';
import { useTranscription } from './hooks/useTranscription';
import { useSettings } from './hooks/useSettings';
import { OfficialLayout } from './components/Layout/OfficialLayout';
import { AudioUploader } from './components/AudioUploader';
import { ModernTranscriptionResult } from './components/TranscriptionResult/ModernTranscriptionResult';
import { ModernSettings } from './components/Settings/ModernSettings';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { storage } from './utils/storage';
import './App.css';

function App() {

  const {
    isLoading,
    error,
    results,
    currentFile,
    isGeneratingSummary,
    regeneratingIds,
    batchProgress,
    setCurrentFile,
    transcribeAudio,
    removeResult,
    clearResults,
    clearError,
    regenerateSummary,
  } = useTranscription();

  const {
    isOpen: isSettingsOpen,
    settings,
    isValid: isSettingsValid,
    openSettings,
    closeSettings,
    updateSettings,
    validateApiKey,
  } = useSettings();

  // State for selected result in the modern UI
  const [selectedResult, setSelectedResult] = useState<TranscriptionResultType | null>(null);
  const [showUploadInterface, setShowUploadInterface] = useState(false);
  const [transcriptionContext, setTranscriptionContext] = useState('');

  const handleFileSelect = useCallback((file: AudioFile) => {
    setCurrentFile(file);
    setShowUploadInterface(false); // Hide upload interface when file is selected
  }, [setCurrentFile]);

  const handleTranscribe = useCallback(async () => {
    if (!currentFile || !isSettingsValid) return;

    try {
      await transcribeAudio(currentFile.file, settings.apiKey, transcriptionContext.trim() || undefined);
      
      // Clean up file URL
      if (currentFile.url) {
        URL.revokeObjectURL(currentFile.url);
      }
      
      // Hide upload interface and let auto-selection pick up the new result
      setShowUploadInterface(false);
      setTranscriptionContext(''); // Clear context after transcription
    } catch (err) {
      console.error('Transcription failed:', err);
    }
  }, [currentFile, isSettingsValid, transcribeAudio, settings.apiKey, transcriptionContext]);

  const handleClearError = useCallback(() => {
    clearError();
  }, [clearError]);

  const handleRemoveResult = useCallback((id: string) => {
    removeResult(id);
  }, [removeResult]);

  const handleClearAllResults = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all transcription results?')) {
      clearResults();
    }
  }, [clearResults]);

  const handleRegenerateSummary = useCallback(async (resultId: string) => {
    if (!isSettingsValid) {
      console.error('Cannot regenerate summary: settings not valid');
      return;
    }

    try {
      await regenerateSummary(resultId, settings.apiKey);
    } catch (err) {
      console.error('Summary regeneration failed:', err);
      // Error handling is already done in the hook
    }
  }, [regenerateSummary, isSettingsValid, settings.apiKey]);

  const handleUpdateContext = useCallback((resultId: string, context: string) => {
    // Update the result with new context
    const updatedResults = results.map(result => 
      result.id === resultId ? { ...result, context } : result
    );
    
    // Update storage
    storage.saveResults(updatedResults);
    
    // Update selected result if it's the one being updated
    if (selectedResult && selectedResult.id === resultId) {
      setSelectedResult({ ...selectedResult, context });
    }
  }, [results, selectedResult]);

  const handleRegenerateWithContext = useCallback(async (resultId: string, context: string) => {
    if (!isSettingsValid) {
      console.error('Cannot regenerate summary with context: settings not valid');
      return;
    }

    try {
      // First update the context
      handleUpdateContext(resultId, context);
      
      // Then regenerate the summary with context
      await regenerateSummary(resultId, settings.apiKey, context);
    } catch (err) {
      console.error('Summary regeneration with context failed:', err);
      // Error handling is already done in the hook
    }
  }, [regenerateSummary, isSettingsValid, settings.apiKey, handleUpdateContext]);

  // Modern UI handlers
  const handleSelectResult = useCallback((result: TranscriptionResultType) => {
    setSelectedResult(result);
    setCurrentFile(null); // Clear current file when viewing a result
    setShowUploadInterface(false); // Hide upload interface when selecting a result
  }, [setCurrentFile]);

  const handleNewRecording = useCallback(() => {
    setSelectedResult(null);
    setCurrentFile(null); // Clear any existing file
    setShowUploadInterface(true); // Show upload interface
    setTranscriptionContext(''); // Clear context for new recording
  }, [setCurrentFile]);

  const isTranscribeDisabled = !currentFile || !isSettingsValid || isLoading || isGeneratingSummary;

  // Auto-select first result if none selected (but not when showing upload interface)
  useEffect(() => {
    if (results.length > 0 && !selectedResult && !currentFile && !showUploadInterface) {
      setSelectedResult(results[0]);
    }
  }, [results, selectedResult, currentFile, showUploadInterface]);

  return (
    <OfficialLayout
      results={results}
      selectedResult={selectedResult || undefined}
      onSelectResult={handleSelectResult}
      onNewRecording={handleNewRecording}
      onDeleteResult={handleRemoveResult}
      onClearAllResults={handleClearAllResults}
      onOpenSettings={openSettings}
    >
      {/* Main Content Based on Current State */}
      {!isSettingsValid ? (
        // API Key Warning
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-6 max-w-md p-8">
            <div className="w-16 h-16 mx-auto text-yellow-500">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">API Key Required</h2>
              <p className="text-muted-foreground">Configure your OpenAI API key to start transcribing audio files with AI-powered summaries.</p>
            </div>
            <Button onClick={openSettings} className="gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Configure API Key
            </Button>
          </div>
        </div>
      ) : currentFile || showUploadInterface ? (
        // File Upload & Processing State
        <div className="upload-workspace">
          <div className="upload-container">
            <AudioUploader 
              onFileSelect={handleFileSelect}
              isLoading={isLoading}
              disabled={!isSettingsValid}
            />
            
            {currentFile && (
              <div className="current-file-card">
              <div className="file-header">
                <div className="file-icon">🎙️</div>
                <div className="file-info">
                  <h3>{currentFile.name}</h3>
                  <div className="file-meta">
                    <span>{(currentFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    {currentFile.duration && (
                      <span>{Math.round(currentFile.duration)}s</span>
                    )}
                  </div>
                </div>
                <button 
                  className="remove-file-btn"
                  onClick={() => {
                    setCurrentFile(null);
                    setShowUploadInterface(false);
                  }}
                  disabled={isLoading}
                  title="Remove file"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {currentFile.url && (
                <div className="audio-preview">
                  <audio controls src={currentFile.url} />
                </div>
              )}

              {/* Context Input Section */}
              <div className="p-4 border border-border rounded-lg bg-card">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="text-sm font-medium text-foreground">Recording Context</h3>
                    <span className="text-xs text-muted-foreground">(Optional)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Provide context about this recording to help the AI generate a better summary. 
                    This will be used during the initial summary generation.
                  </p>
                  <Textarea
                    placeholder="e.g., This is a client meeting about project requirements for a new mobile app. The client mentioned they want to focus on user experience and have a tight deadline..."
                    value={transcriptionContext}
                    onChange={(e) => setTranscriptionContext(e.target.value)}
                    className="min-h-[80px] text-sm"
                    rows={3}
                    disabled={isLoading || isGeneratingSummary}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {transcriptionContext.length > 0 ? `${transcriptionContext.length} characters` : 'No context provided'}
                    </span>
                    {transcriptionContext.trim() && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="font-medium">Will enhance summary</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="transcribe-actions">
                <button 
                  className="transcribe-btn"
                  onClick={handleTranscribe}
                  disabled={isTranscribeDisabled}
                >
                  {isLoading 
                    ? (batchProgress 
                      ? `${batchProgress.phase === 'analyzing' ? 'Analyzing...' :
                           batchProgress.phase === 'chunking' ? 'Splitting...' :
                           batchProgress.phase === 'processing' ? 
                             (batchProgress.totalChunks === 1 ? 
                               `Compressing... ${batchProgress.progress.toFixed(0)}%` :
                               `Processing ${batchProgress.currentChunk}/${batchProgress.totalChunks}`) :
                           batchProgress.phase === 'combining' ? 
                             (batchProgress.totalChunks === 1 ? 'Transcribing...' : 'Combining...') :
                           'Processing...'}`
                      : 'Transcribing...')
                    : isGeneratingSummary 
                    ? 'Generating Summary...' 
                    : 'Start Transcription'}
                  {!isLoading && !isGeneratingSummary && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5,3 19,12 5,21 5,3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Progress Display */}
              {batchProgress && (
                <div className="progress-card">
                  <div className="progress-info">
                    <div className="progress-title">
                      {batchProgress.phase === 'analyzing' && '🔍 Analyzing file...'}
                      {batchProgress.phase === 'chunking' && '✂️ Splitting into chunks...'}
                      {batchProgress.phase === 'processing' && (
                        batchProgress.totalChunks === 1 ? '🗜️ Compressing audio...' : '🎵 Processing chunks...'
                      )}
                      {batchProgress.phase === 'combining' && (
                        batchProgress.totalChunks === 1 ? '🎵 Transcribing...' : '🔗 Combining results...'
                      )}
                    </div>
                    <div className="progress-details">
                      {batchProgress.phase === 'processing' && batchProgress.totalChunks > 1 ? (
                        `Chunk ${batchProgress.currentChunk} of ${batchProgress.totalChunks}`
                      ) : (
                        `${Math.round(batchProgress.progress)}% complete`
                      )}
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${batchProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        </div>
              ) : selectedResult ? (
          // Selected Result View
          <div style={{ padding: '0' }}>
            <ModernTranscriptionResult
              result={selectedResult}
              onRemove={handleRemoveResult}
              isGeneratingSummary={isGeneratingSummary}
              isRegenerating={regeneratingIds.has(selectedResult.id)}
              onRegenerateSummary={handleRegenerateSummary}
              onUpdateContext={handleUpdateContext}
              onRegenerateWithContext={handleRegenerateWithContext}
              className="selected-result"
            />
          </div>
        ) : results.length === 0 ? (
          // Empty State
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-6 max-w-md p-8">
              <div className="w-20 h-20 mx-auto text-muted-foreground">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">Ready to Transcribe</h2>
                <p className="text-muted-foreground">Upload your first audio file to get started with AI-powered transcription and summaries.</p>
              </div>
              <Button onClick={handleNewRecording} className="gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Start Recording
              </Button>
            </div>
          </div>
        ) : (
          // Default: Show message
          <div className="flex items-center justify-center min-h-[200px]">
            <p className="text-muted-foreground">Select a recording from the sidebar to view its details.</p>
          </div>
        )}

      {/* Error Display */}
      {error && (
        <div className="error-overlay">
          <div className="error-card">
            <div className="error-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div className="error-content">
              <h3>Error</h3>
              <p>{error.message}</p>
              <button className="error-dismiss-btn" onClick={handleClearError}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <ModernSettings
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={closeSettings}
        onSave={updateSettings}
        onValidateApiKey={validateApiKey}
      />
    </OfficialLayout>
  );
}

export default App;
