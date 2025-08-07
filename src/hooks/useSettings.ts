import { useState, useCallback, useEffect } from 'react';
import type { AppSettings, SettingsState } from '../types';
import { storage } from '../utils/storage';

const defaultSettings: AppSettings = {
  apiKey: '',
  model: 'whisper-1',
  language: undefined,
  temperature: 0,
};

export const useSettings = () => {
  const [state, setState] = useState<SettingsState>({
    isOpen: false,
    settings: defaultSettings,
    isValid: false,
  });

  // Load settings from storage on mount
  useEffect(() => {
    const savedSettings = storage.getSettings();
    if (savedSettings) {
      setState((prev: SettingsState) => ({
        ...prev,
        settings: { ...defaultSettings, ...savedSettings },
        isValid: Boolean(savedSettings.apiKey?.trim()),
      }));
    }
  }, []);

  const openSettings = useCallback(() => {
    setState((prev: SettingsState) => ({ ...prev, isOpen: true }));
  }, []);

  const closeSettings = useCallback(() => {
    setState((prev: SettingsState) => ({ ...prev, isOpen: false }));
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setState((prev: SettingsState) => {
      const newSettings = { ...prev.settings, ...updates };
      const isValid = Boolean(newSettings.apiKey?.trim());
      
      // Save to storage
      storage.saveSettings(newSettings);
      
      return {
        ...prev,
        settings: newSettings,
        isValid,
      };
    });
  }, []);

  const resetSettings = useCallback(() => {
    setState((prev: SettingsState) => ({
      ...prev,
      settings: defaultSettings,
      isValid: false,
    }));
    storage.clearSettings();
  }, []);

  const validateApiKey = useCallback((apiKey: string): boolean => {
    // Basic validation for OpenAI API key format
    const trimmed = apiKey.trim();
    return trimmed.length > 0 && trimmed.startsWith('sk-');
  }, []);

  return {
    ...state,
    openSettings,
    closeSettings,
    updateSettings,
    resetSettings,
    validateApiKey,
  };
}; 