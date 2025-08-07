import { useState, useCallback } from 'react';
import { 
  FileText, 
  Clock, 
  Calendar, 
  Copy, 
  Download, 
  Trash2, 
  MoreHorizontal, 
  Sparkles,
  RefreshCw,
  Mail,
  FileCode,
  Volume2,
  MessageSquareText,
  Save
} from 'lucide-react';
import type { TranscriptionResult as TranscriptionResultType } from '../../types';
import { formatDuration, downloadText } from '../../utils/file';
import { ModernSummary } from '../Summary/ModernSummary';

// shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Textarea } from '@/components/ui/textarea';

interface ModernTranscriptionResultProps {
  result: TranscriptionResultType;
  onRemove?: (id: string) => void;
  isGeneratingSummary?: boolean;
  isRegenerating?: boolean;
  onRegenerateSummary?: (resultId: string) => Promise<void>;
  onUpdateContext?: (resultId: string, context: string) => void;
  onRegenerateWithContext?: (resultId: string, context: string) => Promise<void>;
  className?: string;
}

type ContentView = 'transcript' | 'summary' | 'context' | 'markdown' | 'email';

// Helper function to format summary data as Markdown
const formatAsMarkdown = (result: TranscriptionResultType): string => {
  const { summary } = result;
  if (!summary) return `# ${result.audioFileName}\n\n## Transcript\n\n${result.text}`;

  const title = summary.englishTitle || result.audioFileName;
  let markdown = `# ${title}\n\n`;
  
  if (summary.priority) {
    markdown += `**Priority:** ${summary.priority.toUpperCase()}\n\n`;
  }
  
  markdown += `## Summary\n\n${summary.english}\n\n`;
  
  if (summary.keyPoints && summary.keyPoints.length > 0) {
    markdown += `## Key Points\n\n`;
    summary.keyPoints.forEach(point => {
      markdown += `• ${point}\n`;
    });
    markdown += `\n`;
  }
  
  if (summary.insights && summary.insights.length > 0) {
    markdown += `## Strategic Insights\n\n`;
    summary.insights.forEach(insight => {
      markdown += `💡 ${insight}\n`;
    });
    markdown += `\n`;
  }
  
  if (summary.actionItems && summary.actionItems.length > 0) {
    markdown += `## Action Items\n\n`;
    summary.actionItems.forEach(action => {
      markdown += `✓ ${action}\n`;
    });
    markdown += `\n`;
  }
  
  if (summary.participants && summary.participants.length > 0) {
    markdown += `## Participants\n\n${summary.participants.join(', ')}\n\n`;
  }
  
  if (summary.timeline) {
    markdown += `## Timeline\n\n${summary.timeline}\n\n`;
  }
  
  markdown += `## Full Transcript\n\n${result.text}\n\n`;
  markdown += `---\n*Generated: ${summary.createdAt.toLocaleString()}*`;
  
  return markdown;
};

// Helper function to format summary data for email
const formatAsEmail = (result: TranscriptionResultType): string => {
  const { summary } = result;
  if (!summary) {
    return `Subject: Transcription - ${result.audioFileName}

TRANSCRIPT
===========

${result.text}

Generated: ${result.createdAt.toLocaleString()}`;
  }

  const title = summary.englishTitle || result.audioFileName;
  let email = `Subject: ${title}\n\n`;
  
  if (summary.priority) {
    email += `PRIORITY: ${summary.priority.toUpperCase()}\n\n`;
  }
  
  email += `EXECUTIVE SUMMARY\n==================\n\n${summary.english}\n\n`;
  
  if (summary.keyPoints && summary.keyPoints.length > 0) {
    email += `KEY POINTS\n===========\n\n`;
    summary.keyPoints.forEach((point, index) => {
      email += `${index + 1}. ${point}\n\n`;
    });
  }
  
  if (summary.insights && summary.insights.length > 0) {
    email += `STRATEGIC INSIGHTS\n==================\n\n`;
    summary.insights.forEach((insight, index) => {
      email += `${index + 1}. ${insight}\n\n`;
    });
  }
  
  if (summary.actionItems && summary.actionItems.length > 0) {
    email += `ACTION ITEMS\n=============\n\n`;
    summary.actionItems.forEach((action, index) => {
      email += `${index + 1}. ${action}\n\n`;
    });
  }
  
  if (summary.participants && summary.participants.length > 0) {
    email += `PARTICIPANTS\n=============\n\n${summary.participants.join(', ')}\n\n`;
  }
  
  if (summary.timeline) {
    email += `TIMELINE\n=========\n\n${summary.timeline}\n\n`;
  }
  
  email += `FULL TRANSCRIPT\n================\n\n${result.text}\n\n`;
  email += `Generated: ${summary.createdAt.toLocaleString()}`;
  
  return email;
};

export const ModernTranscriptionResult: React.FC<ModernTranscriptionResultProps> = ({
  result,
  onRemove,
  isGeneratingSummary = false,
  isRegenerating = false,
  onRegenerateSummary,
  onUpdateContext,
  onRegenerateWithContext,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<ContentView>('transcript');
  const [copied, setCopied] = useState(false);
  const [contextText, setContextText] = useState(result.context || '');
  const [isContextSaved, setIsContextSaved] = useState(true);
  const [isRegeneratingWithContext, setIsRegeneratingWithContext] = useState(false);

  const handleCopy = useCallback(async (content?: string) => {
    try {
      const textToCopy = content || result.text;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  }, [result.text]);

  const handleDownload = useCallback((format: 'txt' | 'markdown' | 'email' = 'txt') => {
    let content: string;
    let extension: string;
    let suffix: string;

    switch (format) {
      case 'markdown':
        content = formatAsMarkdown(result);
        extension = 'md';
        suffix = 'markdown';
        break;
      case 'email':
        content = formatAsEmail(result);
        extension = 'txt';
        suffix = 'email';
        break;
      default:
        content = result.text;
        extension = 'txt';
        suffix = 'transcription';
    }

    const filename = `${result.audioFileName.replace(/\.[^/.]+$/, '')}-${suffix}.${extension}`;
    downloadText(content, filename);
  }, [result]);

  const handleRemove = useCallback(() => {
    if (onRemove) {
      onRemove(result.id);
    }
  }, [onRemove, result.id]);

  const handleRegenerateSummary = useCallback(async () => {
    if (onRegenerateSummary && result.id) {
      try {
        await onRegenerateSummary(result.id);
      } catch (error) {
        console.error('Failed to regenerate summary:', error);
      }
    }
  }, [onRegenerateSummary, result.id]);

  const handleContextChange = useCallback((value: string) => {
    setContextText(value);
    setIsContextSaved(value === (result.context || ''));
  }, [result.context]);

  const handleSaveContext = useCallback(() => {
    if (onUpdateContext && result.id) {
      onUpdateContext(result.id, contextText);
      setIsContextSaved(true);
    }
  }, [onUpdateContext, result.id, contextText]);

  const handleRegenerateWithContext = useCallback(async () => {
    if (onRegenerateWithContext && result.id) {
      setIsRegeneratingWithContext(true);
      try {
        // Save context first if not saved
        if (!isContextSaved && onUpdateContext) {
          onUpdateContext(result.id, contextText);
          setIsContextSaved(true);
        }
        await onRegenerateWithContext(result.id, contextText);
      } catch (error) {
        console.error('Failed to regenerate summary with context:', error);
      } finally {
        setIsRegeneratingWithContext(false);
      }
    }
  }, [onRegenerateWithContext, result.id, contextText, isContextSaved, onUpdateContext]);

  const getStatusBadge = () => {
    if (isGeneratingSummary) {
      return (
        <Badge variant="secondary" className="gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Generating...
        </Badge>
      );
    }
    if (result.summary) {
      return (
        <Badge variant="default" className="gap-1">
          <Sparkles className="h-3 w-3" />
          Ready
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Volume2 className="h-3 w-3" />
        Transcribed
      </Badge>
    );
  };

  const getPriorityBadge = () => {
    if (!result.summary?.priority) return null;
    
    const priority = result.summary.priority;
    const variants = {
      high: 'destructive' as const,
      medium: 'secondary' as const,
      low: 'outline' as const,
    };
    
    return (
      <Badge variant={variants[priority]} className="text-xs">
        {priority.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      {/* Card Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <CardTitle className="text-lg leading-tight truncate">
                {result.summary?.englishTitle || result.audioFileName}
              </CardTitle>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              {getStatusBadge()}
              {getPriorityBadge()}
              
              {result.duration && (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDuration(result.duration)}
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-auto p-2">
                    <p className="text-xs">Audio duration</p>
                  </HoverCardContent>
                </HoverCard>
              )}
              
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {result.createdAt.toLocaleDateString()}
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-auto p-2">
                  <p className="text-xs">Created: {result.createdAt.toLocaleString()}</p>
                </HoverCardContent>
              </HoverCard>
            </div>

            {result.summary?.englishTitle && (
              <CardDescription className="text-sm">
                File: {result.audioFileName}
              </CardDescription>
            )}
          </div>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleCopy()}>
                <Copy className="mr-2 h-4 w-4" />
                Copy transcript
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('txt')}>
                <Download className="mr-2 h-4 w-4" />
                Download transcript
              </DropdownMenuItem>
              {result.summary && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleCopy(formatAsMarkdown(result))}>
                    <FileCode className="mr-2 h-4 w-4" />
                    Copy as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload('markdown')}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCopy(formatAsEmail(result))}>
                    <Mail className="mr-2 h-4 w-4" />
                    Copy email format
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload('email')}>
                    <Download className="mr-2 h-4 w-4" />
                    Download email format
                  </DropdownMenuItem>
                </>
              )}
              {onRegenerateSummary && result.summary && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleRegenerateSummary}
                    disabled={isRegenerating}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                    Regenerate summary
                  </DropdownMenuItem>
                </>
              )}
              {onRemove && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleRemove}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete recording
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {/* Tabs Content */}
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ContentView)}>
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="transcript" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Transcript</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="summary" 
              disabled={!result.summary && !isGeneratingSummary}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Summary</span>
            </TabsTrigger>

            <TabsTrigger 
              value="context" 
              className="flex items-center gap-2"
            >
              <MessageSquareText className="h-4 w-4" />
              <span className="hidden sm:inline">Context</span>
              {!isContextSaved && (
                <div className="h-2 w-2 bg-orange-500 rounded-full ml-1" />
              )}
            </TabsTrigger>
            
            <TabsTrigger 
              value="markdown" 
              disabled={!result.summary && !isGeneratingSummary}
              className="flex items-center gap-2"
            >
              <FileCode className="h-4 w-4" />
              <span className="hidden sm:inline">Markdown</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="email" 
              disabled={!result.summary && !isGeneratingSummary}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
          </TabsList>

          {/* Transcript Tab */}
          <TabsContent value="transcript" className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">Original Transcript</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy()}
                    className="h-7 px-2 text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload('txt')}
                    className="h-7 px-2 text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {result.text}
                </p>
              </div>
              {result.language && (
                <div className="mt-3 pt-3 border-t">
                  <Badge variant="secondary" className="text-xs">
                    Language: {result.language.toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            <ModernSummary
              summary={result.summary}
              isLoading={isGeneratingSummary && !result.summary}
              isRegenerating={isRegenerating}
              onRegenerate={onRegenerateSummary ? handleRegenerateSummary : undefined}
            />
          </TabsContent>

          {/* Context Tab */}
          <TabsContent value="context" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">Recording Context</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isContextSaved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveContext}
                        className="h-7 px-2 text-xs"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                    )}
                    {onRegenerateWithContext && contextText.trim() && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleRegenerateWithContext}
                        disabled={isRegeneratingWithContext || isGeneratingSummary}
                        className="h-7 px-2 text-xs"
                      >
                        {isRegeneratingWithContext ? (
                          <div className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span>Generating...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            <span>Regenerate Summary</span>
                          </div>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                <CardDescription>
                  Provide additional context about this recording to help the AI generate a better summary. 
                  This information will be used to understand the background, purpose, or specific details 
                  that might not be clear from the transcript alone.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="e.g., This is a client meeting about project requirements for a new mobile app. The client mentioned they want to focus on user experience and have a tight deadline..."
                    value={contextText}
                    onChange={(e) => handleContextChange(e.target.value)}
                    className="min-h-[120px] resize-y"
                    rows={6}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {contextText.length > 0 ? `${contextText.length} characters` : 'No context provided'}
                    </span>
                    {!isContextSaved && contextText !== (result.context || '') && (
                      <span className="text-orange-600 font-medium">Unsaved changes</span>
                    )}
                  </div>
                </div>

                {contextText.trim() && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 mb-1">Context will enhance your summary</p>
                        <p className="text-blue-700">
                          The AI will use this context to provide more accurate insights, better categorization, 
                          and more relevant action items in the summary.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!contextText.trim() && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MessageSquareText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-1">No context provided</p>
                        <p>
                          Adding context helps the AI understand the purpose and background of your recording, 
                          leading to more accurate and useful summaries.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Markdown Tab */}
          <TabsContent value="markdown" className="space-y-4">
            <div className="rounded-lg border">
              <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                <h3 className="font-medium text-sm">Markdown Export</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(formatAsMarkdown(result))}
                    className="h-7 px-2 text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload('markdown')}
                    className="h-7 px-2 text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap text-foreground">
                  {formatAsMarkdown(result)}
                </pre>
              </div>
            </div>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-4">
            <div className="rounded-lg border">
              <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                <h3 className="font-medium text-sm">Email Format</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(formatAsEmail(result))}
                    className="h-7 px-2 text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload('email')}
                    className="h-7 px-2 text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap text-foreground">
                  {formatAsEmail(result)}
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Success Notification */}
      {copied && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium shadow-lg">
            ✓ Copied to clipboard!
          </div>
        </div>
      )}
    </Card>
  );
};
