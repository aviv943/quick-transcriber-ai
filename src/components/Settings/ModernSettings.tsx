import { useState, useCallback, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Key, 
  Cpu, 
  Globe, 
  Thermometer,
  ExternalLink,
  AlertCircle,
  Info
} from 'lucide-react';
import type { AppSettings } from '../../types';

// shadcn/ui components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

interface ModernSettingsProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
  onValidateApiKey: (apiKey: string) => boolean;
}

export const ModernSettings: React.FC<ModernSettingsProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
  onValidateApiKey,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
    setValidationError(null);
  }, [settings, isOpen]);

  const handleInputChange = useCallback((field: keyof AppSettings, value: string | number) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
    if (field === 'apiKey') {
      setValidationError(null);
    }
  }, []);

  const handleSave = useCallback(async () => {
    // Validate API key
    if (!localSettings.apiKey.trim()) {
      setValidationError('API key is required');
      return;
    }

    setIsValidating(true);
    
    // Simulate validation delay for better UX
    setTimeout(() => {
      if (!onValidateApiKey(localSettings.apiKey)) {
        setValidationError('Invalid API key format. It should start with "sk-"');
        setIsValidating(false);
        return;
      }

      onSave(localSettings);
      setIsValidating(false);
      onClose();
    }, 500);
  }, [localSettings, onValidateApiKey, onSave, onClose]);

  const handleCancel = useCallback(() => {
    setLocalSettings(settings);
    setValidationError(null);
    setIsValidating(false);
    onClose();
  }, [settings, onClose]);





  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <SettingsIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Settings</DialogTitle>
              <DialogDescription>
                Configure your OpenAI API settings and transcription preferences.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* API Configuration Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">API Configuration</CardTitle>
              </div>
              <CardDescription>
                Configure your OpenAI API key for transcription and summary generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="flex items-center gap-2">
                  OpenAI API Key
                  <Badge variant="secondary" className="text-xs">Required</Badge>
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={localSettings.apiKey}
                  onChange={(e) => handleInputChange('apiKey', e.target.value)}
                  placeholder="sk-..."
                  className={validationError ? 'border-destructive focus-visible:ring-destructive' : ''}
                  autoComplete="off"
                />
                {validationError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {validationError}
                  </div>
                )}
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    Get your API key from{' '}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      OpenAI Platform
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>


            </CardContent>
          </Card>

          {/* Model Configuration Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Model Configuration</CardTitle>
              </div>
              <CardDescription>
                Choose the AI model and configure transcription parameters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model">Transcription Model</Label>
                <Select 
                  value={localSettings.model} 
                  onValueChange={(value) => handleInputChange('model', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whisper-1">
                      <div className="flex items-center gap-2">
                        <span>Whisper-1</span>
                        <Badge variant="outline" className="text-xs">Recommended</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  OpenAI's Whisper model for high-quality speech recognition
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Language (Optional)
                </Label>
                <Input
                  id="language"
                  type="text"
                  value={localSettings.language || ''}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  placeholder="en, es, fr, de... (auto-detect if empty)"
                />
                <p className="text-xs text-muted-foreground">
                  ISO 639-1 language code. Leave empty for automatic detection
                </p>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  Temperature: {localSettings.temperature || 0}
                </Label>
                <div className="px-2">
                  <Slider
                    value={[localSettings.temperature || 0]}
                    onValueChange={(value) => handleInputChange('temperature', value[0])}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Deterministic (0)</span>
                  <span>Random (1)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Controls randomness in the transcription. Lower values are more focused and deterministic.
                </p>
              </div>
            </CardContent>
          </Card>


        </div>

        <DialogFooter className="flex-shrink-0 gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isValidating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isValidating}
            className="min-w-[120px]"
          >
            {isValidating ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Validating...
              </div>
            ) : (
              'Save Settings'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
