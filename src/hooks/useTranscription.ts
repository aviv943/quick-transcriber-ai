import { useState, useCallback } from 'react';
import type { TranscriptionState, TranscriptionResult, AudioFile, TranscriptionError, BatchProgress } from '../types';
import { openAIService } from '../services/openai';
import { storage } from '../utils/storage';

export const useTranscription = () => {
  const [state, setState] = useState<TranscriptionState>({
    isLoading: false,
    error: null,
    results: storage.getResults(),
    currentFile: null,
    batchProgress: undefined,
  });

  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());

  const setCurrentFile = useCallback((file: AudioFile | null) => {
    setState((prev: TranscriptionState) => ({ ...prev, currentFile: file, error: null }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev: TranscriptionState) => ({ ...prev, error: null }));
  }, []);

  const transcribeAudio = useCallback(async (file: File, apiKey: string, context?: string) => {
    console.log(`🎵 Starting transcription: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    setState((prev: TranscriptionState) => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      batchProgress: undefined,
    }));

    try {
      // Batch progress callback
      const onBatchProgress = (progress: BatchProgress) => {
        setState((prev: TranscriptionState) => ({
          ...prev,
          batchProgress: progress,
        }));
      };

      // Transcribe the audio
      const transcriptionResult = await openAIService.transcribeAudio(apiKey, {
        file,
        model: 'whisper-1',
        response_format: 'verbose_json',
      }, onBatchProgress);

      // Add context to transcription result if provided
      if (context?.trim()) {
        transcriptionResult.context = context.trim();
      }

      // Save transcription result
      setState((prev: TranscriptionState) => {
        const newResults = [transcriptionResult, ...prev.results];
        storage.saveResults(newResults);
        return {
          ...prev,
          isLoading: false,
          results: newResults,
          currentFile: null,
          batchProgress: undefined,
        };
      });

      // Generate summary automatically
      setIsGeneratingSummary(true);
      
      try {
        const summaryData = await openAIService.generateSummary(apiKey, {
          text: transcriptionResult.text,
          audioFileName: transcriptionResult.audioFileName,
          language: transcriptionResult.language,
          context,
        });
        
        console.log(`✅ Summary generated successfully`);

        // Update the result with summary
        setState((prev: TranscriptionState) => {
          const newResults = prev.results.map(result => 
            result.id === transcriptionResult.id 
              ? { ...result, summary: summaryData, context: context || result.context } 
              : result
          );
          storage.saveResults(newResults);
          
          return {
            ...prev,
            results: newResults,
          };
        });

        setIsGeneratingSummary(false);
        return transcriptionResult;
      } catch (summaryError) {
        // If summary generation fails, continue with transcription result
        console.error(`❌ Summary generation failed:`, summaryError);
        setIsGeneratingSummary(false);
        // Don't throw error for summary failure - transcription was successful
        return transcriptionResult;
      }
    } catch (error) {
      const transcriptionError = error as TranscriptionError;
      console.error(`❌ Transcription failed:`, transcriptionError.message);
      
      setState((prev: TranscriptionState) => ({
        ...prev,
        isLoading: false,
        error: transcriptionError,
        batchProgress: undefined,
      }));
      setIsGeneratingSummary(false);
      throw error;
    }
  }, []);

  const removeResult = useCallback((id: string) => {
    setState((prev: TranscriptionState) => {
      const newResults = prev.results.filter((result: TranscriptionResult) => result.id !== id);
      storage.saveResults(newResults);
      return {
        ...prev,
        results: newResults,
      };
    });
  }, []);

    const clearResults = useCallback(() => {
    setState((prev: TranscriptionState) => ({ ...prev, results: [] }));
    storage.clearResults();
  }, []);

  const regenerateSummary = useCallback(async (resultId: string, apiKey: string, context?: string) => {
    // Find the result
    const result = state.results.find(r => r.id === resultId);
    if (!result) {
      throw new Error('Transcription result not found');
    }

    // Set regenerating state for this specific result
    setRegeneratingIds(prev => new Set([...prev, resultId]));

    try {
      const summaryData = await openAIService.generateSummary(apiKey, {
        text: result.text,
        audioFileName: result.audioFileName,
        language: result.language,
        context,
      });

      // Update the result with new summary
      setState((prev: TranscriptionState) => {
        const newResults = prev.results.map(r => 
          r.id === resultId ? { ...r, summary: summaryData } : r
        );
        storage.saveResults(newResults);
        
        return {
          ...prev,
          results: newResults,
        };
      });

      console.log(`✅ Summary regenerated successfully`);
      return summaryData;
    } catch (error) {
      console.error(`❌ Summary regeneration failed:`, error);
      throw error;
    } finally {
      // Clear regenerating state
      setRegeneratingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(resultId);
        return newSet;
      });
    }
  }, [state.results]);

  return {
    ...state,
    isGeneratingSummary,
    regeneratingIds,
    setCurrentFile,
    transcribeAudio,
    removeResult,
    clearResults,
    clearError,
    regenerateSummary,
  };
}; 