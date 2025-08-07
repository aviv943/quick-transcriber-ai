import { useState, useCallback, useEffect } from 'react';
import type { AppSettings } from '../../types';
import './Settings.css';

interface SettingsProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
  onValidateApiKey: (apiKey: string) => boolean;
}

export const Settings: React.FC<SettingsProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
  onValidateApiKey,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [showApiKey, setShowApiKey] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleInputChange = useCallback((field: keyof AppSettings, value: string | number) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
    if (field === 'apiKey') {
      setValidationError(null);
    }
  }, []);

  const handleSave = useCallback(() => {
    // Validate API key
    if (!localSettings.apiKey.trim()) {
      setValidationError('API key is required');
      return;
    }

    if (!onValidateApiKey(localSettings.apiKey)) {
      setValidationError('Invalid API key format. It should start with "sk-"');
      return;
    }

    onSave(localSettings);
    onClose();
  }, [localSettings, onValidateApiKey, onSave, onClose]);

  const handleCancel = useCallback(() => {
    setLocalSettings(settings);
    setValidationError(null);
    onClose();
  }, [settings, onClose]);

  const toggleApiKeyVisibility = useCallback(() => {
    setShowApiKey(prev => !prev);
  }, []);

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return `${key.slice(0, 8)}${'*'.repeat(key.length - 12)}${key.slice(-4)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <button
            className="close-btn"
            onClick={handleCancel}
            aria-label="Close settings"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="settings-content">
          <div className="field-group">
            <label htmlFor="apiKey" className="field-label">
              OpenAI API Key
              <span className="required">*</span>
            </label>
            <div className="api-key-input-container">
              <input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={localSettings.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                placeholder="sk-..."
                className={`field-input ${validationError ? 'error' : ''}`}
                autoComplete="off"
              />
              <button
                type="button"
                className="toggle-visibility-btn"
                onClick={toggleApiKeyVisibility}
                aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
              >
                {showApiKey ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {validationError && (
              <div className="field-error">{validationError}</div>
            )}
            <div className="field-help">
              Get your API key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="help-link"
              >
                OpenAI Platform
              </a>
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="model" className="field-label">
              Model
            </label>
            <select
              id="model"
              value={localSettings.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              className="field-input"
            >
              <option value="whisper-1">Whisper-1</option>
            </select>
            <div className="field-help">
              Currently only Whisper-1 model is supported
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="language" className="field-label">
              Language (Optional)
            </label>
            <input
              id="language"
              type="text"
              value={localSettings.language || ''}
              onChange={(e) => handleInputChange('language', e.target.value)}
              placeholder="en, es, fr, de... (auto-detect if empty)"
              className="field-input"
            />
            <div className="field-help">
              ISO 639-1 language code. Leave empty for auto-detection
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="temperature" className="field-label">
              Temperature
            </label>
            <input
              id="temperature"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={localSettings.temperature || 0}
              onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
              className="field-input"
            />
            <div className="field-help">
              Controls randomness (0 = deterministic, 1 = very random)
            </div>
          </div>

          {settings.apiKey && (
            <div className="current-key-info">
              <strong>Current API Key:</strong> {maskApiKey(settings.apiKey)}
            </div>
          )}
        </div>

        <div className="settings-actions">
          <button
            className="btn btn-secondary"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}; 