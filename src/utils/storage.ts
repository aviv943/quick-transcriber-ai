import type { AppSettings, TranscriptionResult } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'quicktranscriber_settings',
  RESULTS: 'quicktranscriber_results',
} as const;

export const storage = {
  // Settings management
  saveSettings: (settings: AppSettings): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },

  getSettings: (): AppSettings | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return null;
    }
  },

  clearSettings: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    } catch (error) {
      console.error('Failed to clear settings:', error);
    }
  },

  // Results management
  saveResults: (results: TranscriptionResult[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
    } catch (error) {
      console.error('Failed to save results:', error);
    }
  },

  getResults: (): TranscriptionResult[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RESULTS);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      return parsed.map((result: any) => ({
        ...result,
        createdAt: new Date(result.createdAt),
        summary: result.summary ? {
          ...result.summary,
          createdAt: new Date(result.summary.createdAt)
        } : undefined
      }));
    } catch (error) {
      console.error('Failed to load results:', error);
      return [];
    }
  },

  clearResults: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.RESULTS);
    } catch (error) {
      console.error('Failed to clear results:', error);
    }
  },
}; 