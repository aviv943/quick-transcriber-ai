import { useState, useCallback } from 'react';
import type { TranscriptionResult as TranscriptionResultType } from '../../types';
import { formatDuration, downloadText } from '../../utils/file';
import { Summary } from '../Summary';
import './TranscriptionResult.css';

interface TranscriptionResultProps {
  result: TranscriptionResultType;
  onRemove?: (id: string) => void;
  isGeneratingSummary?: boolean;
  isRegenerating?: boolean;
  onRegenerateSummary?: (resultId: string) => Promise<void>;
  className?: string;
}

type ContentView = 'transcript' | 'summary' | 'markdown' | 'email';

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

export const TranscriptionResult: React.FC<TranscriptionResultProps> = ({
  result,
  onRemove,
  isGeneratingSummary = false,
  isRegenerating = false,
  onRegenerateSummary,
  className = '',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeView, setActiveView] = useState<ContentView>('transcript');
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  }, [result.text]);

  const handleDownload = useCallback(() => {
    const filename = `${result.audioFileName.replace(/\.[^/.]+$/, '')}-transcription.txt`;
    downloadText(result.text, filename);
  }, [result.text, result.audioFileName]);

  const handleCopyFormat = useCallback(async (format: 'markdown' | 'email') => {
    try {
      const content = format === 'markdown' ? formatAsMarkdown(result) : formatAsEmail(result);
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(`Failed to copy ${format}:`, err);
    }
  }, [result]);

  const handleDownloadFormat = useCallback((format: 'markdown' | 'email') => {
    const content = format === 'markdown' ? formatAsMarkdown(result) : formatAsEmail(result);
    const extension = format === 'markdown' ? 'md' : 'txt';
    const filename = `${result.audioFileName.replace(/\.[^/.]+$/, '')}-${format}.${extension}`;
    downloadText(content, filename);
  }, [result]);

  const handleRemove = useCallback(() => {
    if (onRemove) {
      onRemove(result.id);
    }
  }, [onRemove, result.id]);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const toggleActions = useCallback(() => {
    setShowActions(prev => !prev);
  }, []);

  const handleViewChange = useCallback((view: ContentView) => {
    setActiveView(view);
    if (isCollapsed) {
      setIsCollapsed(false);
    }
  }, [isCollapsed]);

  const handleRegenerateSummary = useCallback(async () => {
    if (onRegenerateSummary && result.id) {
      try {
        await onRegenerateSummary(result.id);
      } catch (error) {
        console.error('Failed to regenerate summary:', error);
      }
    }
  }, [onRegenerateSummary, result.id]);

  const getStatusInfo = () => {
    if (isGeneratingSummary) return { text: 'Generating summary...', color: 'orange' };
    if (result.summary) return { text: 'Ready', color: 'green' };
    return { text: 'Transcribed', color: 'blue' };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`result-card ${className}`}>
      {/* Compact Header */}
      <div className="result-header" onClick={toggleCollapsed}>
        <div className="header-left">
          <div className="file-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
            </svg>
          </div>
          <div className="file-details">
            <h3 className="file-name">{result.audioFileName}</h3>
            <div className="metadata">
              <span className={`status status-${statusInfo.color}`}>
                {statusInfo.text}
              </span>
              {result.duration && (
                <span className="duration">{formatDuration(result.duration)}</span>
              )}
              <span className="timestamp">{result.createdAt.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <button 
            className="expand-toggle"
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className={`chevron ${!isCollapsed ? 'rotated' : ''}`}
            >
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </button>
          
          <div className="actions-menu">
            <button 
              className="actions-trigger"
              onClick={(e) => {
                e.stopPropagation();
                toggleActions();
              }}
              aria-label="More actions"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
            
            {showActions && (
              <div className="actions-dropdown">
                <button onClick={(e) => { e.stopPropagation(); handleCopy(); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Copy Text
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download
                </button>
                {onRemove && (
                  <button onClick={(e) => { e.stopPropagation(); handleRemove(); }} className="delete-action">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {!isCollapsed && (
        <div className="result-content">
          {/* Content Navigation */}
          <div className="content-nav">
            <button
              className={`nav-tab ${activeView === 'transcript' ? 'active' : ''}`}
              onClick={() => handleViewChange('transcript')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              Transcript
            </button>
            
            {(result.summary || isGeneratingSummary) && (
              <button
                className={`nav-tab ${activeView === 'summary' ? 'active' : ''}`}
                onClick={() => handleViewChange('summary')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Summary
                {isGeneratingSummary && !result.summary && (
                  <div className="loading-dot"></div>
                )}
              </button>
            )}

            {(result.summary || isGeneratingSummary) && (
              <button
                className={`nav-tab ${activeView === 'markdown' ? 'active' : ''}`}
                onClick={() => handleViewChange('markdown')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="9" y1="9" x2="15" y2="9"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                  <line x1="9" y1="12" x2="12" y2="12"/>
                </svg>
                Markdown
              </button>
            )}

            {(result.summary || isGeneratingSummary) && (
              <button
                className={`nav-tab ${activeView === 'email' ? 'active' : ''}`}
                onClick={() => handleViewChange('email')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Email
              </button>
            )}
          </div>

          {/* Content Display */}
          <div className="content-display">
            {activeView === 'transcript' && (
              <div className="transcript-content">
                <div className="transcript-text">
                  {result.text}
                </div>
                {result.language && (
                  <div className="content-footer">
                    <span className="language-tag">
                      Detected: {result.language.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {activeView === 'summary' && (
              <div className="summary-content">
                <Summary
                  summary={result.summary}
                  isLoading={isGeneratingSummary && !result.summary}
                  isRegenerating={isRegenerating}
                  onRegenerate={onRegenerateSummary ? handleRegenerateSummary : undefined}
                />
              </div>
            )}

            {activeView === 'markdown' && (
              <div className="export-content">
                <div className="export-header">
                  <h3>Markdown Export</h3>
                  <div className="export-actions">
                    <button onClick={() => handleCopyFormat('markdown')} className="export-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      Copy
                    </button>
                    <button onClick={() => handleDownloadFormat('markdown')} className="export-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download .md
                    </button>
                  </div>
                </div>
                <div className="export-preview">
                  <pre>{formatAsMarkdown(result)}</pre>
                </div>
              </div>
            )}

            {activeView === 'email' && (
              <div className="export-content">
                <div className="export-header">
                  <h3>Email Format</h3>
                  <div className="export-actions">
                    <button onClick={() => handleCopyFormat('email')} className="export-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      Copy
                    </button>
                    <button onClick={() => handleDownloadFormat('email')} className="export-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download .txt
                    </button>
                  </div>
                </div>
                <div className="export-preview">
                  <pre>{formatAsEmail(result)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Notifications */}
      {copied && (
        <div className="notification success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}; 