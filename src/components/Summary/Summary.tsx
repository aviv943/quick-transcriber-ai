import { useState, useCallback } from 'react';
import type { SummaryData } from '../../types';
import './Summary.css';

interface SummaryProps {
  summary?: SummaryData;
  isLoading?: boolean;
  isRegenerating?: boolean;
  onRegenerate?: () => Promise<void>;
  className?: string;
}

export const Summary: React.FC<SummaryProps> = ({
  summary,
  isLoading = false,
  isRegenerating = false,
  onRegenerate,
  className = '',
}) => {
  const [activeLanguage, setActiveLanguage] = useState<'english' | 'hebrew'>('english');
  const [showKeyPoints, setShowKeyPoints] = useState(true);
  const [showInsights, setShowInsights] = useState(true);
  const [showActionItems, setShowActionItems] = useState(true);

  const handleLanguageToggle = useCallback((language: 'english' | 'hebrew') => {
    setActiveLanguage(language);
  }, []);

  const toggleKeyPoints = useCallback(() => {
    setShowKeyPoints(prev => !prev);
  }, []);

  const toggleInsights = useCallback(() => {
    setShowInsights(prev => !prev);
  }, []);

  const toggleActionItems = useCallback(() => {
    setShowActionItems(prev => !prev);
  }, []);

  const getContentTypeLabel = (contentType: SummaryData['contentType']): string => {
    const labels = {
      meeting: 'Business Meeting',
      conversation: 'Conversation',
      lecture: 'Lecture/Presentation',
      interview: 'Interview',
      song: 'Song/Music',
      script: 'Script/Drama',
      other: 'General Content'
    };
    return labels[contentType] || 'General Content';
  };

  const getPriorityBadge = (priority?: string): React.JSX.Element | null => {
    if (!priority) return null;
    
    const priorityConfig = {
      high: { label: 'High Priority', className: 'priority-high' },
      medium: { label: 'Medium Priority', className: 'priority-medium' },
      low: { label: 'Low Priority', className: 'priority-low' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    if (!config) return null;
    
    return (
      <span className={`priority-badge ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getContentTypeIcon = (contentType: SummaryData['contentType']): React.JSX.Element => {
    switch (contentType) {
      case 'meeting':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'interview':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        );
      case 'lecture':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10,9 9,9 8,9" />
          </svg>
        );
      case 'song':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        );
      case 'script':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10,9 9,9 8,9" />
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        );
    }
  };

  if (isLoading || isRegenerating || !summary) {
    return (
      <div className={`summary-container ${className}`}>
        <div className="summary-loading">
          <div className="loading-spinner"></div>
          <p>{isRegenerating ? 'Regenerating summary...' : 'Generating AI summary...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`summary-container ${className}`}>
      <div className="summary-header">
        <div className="content-type">
          <div className="content-type-icon">
            {getContentTypeIcon(summary.contentType)}
          </div>
          <div className="content-type-text">
            {(activeLanguage === 'english' && summary.englishTitle) || (activeLanguage === 'hebrew' && summary.hebrewTitle) ? (
              <span className={`summary-title ${activeLanguage === 'hebrew' ? 'rtl' : ''}`}>
                {activeLanguage === 'english' ? summary.englishTitle : summary.hebrewTitle}
              </span>
            ) : (
              <span className="content-type-label">
                {getContentTypeLabel(summary.contentType)}
              </span>
            )}
            <span className="ai-indicator">AI Summary</span>
            {getPriorityBadge(summary.priority)}
          </div>
        </div>
        
        <div className="header-actions">
          <div className="language-toggle">
            <button
              className={`language-btn ${activeLanguage === 'english' ? 'active' : ''}`}
              onClick={() => handleLanguageToggle('english')}
            >
              English
            </button>
            <button
              className={`language-btn ${activeLanguage === 'hebrew' ? 'active' : ''}`}
              onClick={() => handleLanguageToggle('hebrew')}
            >
              עברית
            </button>
          </div>
          
          {onRegenerate && (
            <div className="regenerate-toggle">
              <button
                className="regenerate-btn"
                onClick={onRegenerate}
                title="Regenerate summary"
                aria-label="Regenerate summary"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 2v6h6"/>
                  <path d="M21 12A9 9 0 0 0 6 5.3L3 8"/>
                  <path d="M21 22v-6h-6"/>
                  <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/>
                </svg>
                Regenerate
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="summary-content">
        <div className={`summary-text ${activeLanguage === 'hebrew' ? 'rtl' : ''}`}>
          {activeLanguage === 'english' ? summary.english : summary.hebrew}
        </div>

        {/* Key Points Section */}
        {((activeLanguage === 'english' && summary.keyPoints.length > 0) || 
          (activeLanguage === 'hebrew' && summary.hebrewKeyPoints && summary.hebrewKeyPoints.length > 0)) && (
          <div className="expandable-section">
            <button
              className="section-toggle"
              onClick={toggleKeyPoints}
            >
              <span>Key Points</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`toggle-icon ${showKeyPoints ? 'rotated' : ''}`}
              >
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
            
            {showKeyPoints && (
              <ul className={`section-list ${activeLanguage === 'hebrew' ? 'rtl' : ''}`}>
                {(activeLanguage === 'english' ? summary.keyPoints : (summary.hebrewKeyPoints || [])).map((point, index) => (
                  <li key={index} className="section-item">
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Strategic Insights Section */}
        {((activeLanguage === 'english' && summary.insights && summary.insights.length > 0) ||
          (activeLanguage === 'hebrew' && summary.hebrewInsights && summary.hebrewInsights.length > 0)) && (
          <div className="expandable-section">
            <button
              className="section-toggle"
              onClick={toggleInsights}
            >
              <span>Strategic Insights</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`toggle-icon ${showInsights ? 'rotated' : ''}`}
              >
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
            
            {showInsights && (
              <ul className={`section-list ${activeLanguage === 'hebrew' ? 'rtl' : ''}`}>
                {(activeLanguage === 'english' ? (summary.insights || []) : (summary.hebrewInsights || [])).map((insight, index) => (
                  <li key={index} className="section-item insight-item">
                    {insight}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Action Items Section */}
        {((activeLanguage === 'english' && summary.actionItems && summary.actionItems.length > 0) ||
          (activeLanguage === 'hebrew' && summary.hebrewActionItems && summary.hebrewActionItems.length > 0)) && (
          <div className="expandable-section">
            <button
              className="section-toggle"
              onClick={toggleActionItems}
            >
              <span>Action Items</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`toggle-icon ${showActionItems ? 'rotated' : ''}`}
              >
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
            
            {showActionItems && (
              <ul className={`section-list ${activeLanguage === 'hebrew' ? 'rtl' : ''}`}>
                {(activeLanguage === 'english' ? (summary.actionItems || []) : (summary.hebrewActionItems || [])).map((action, index) => (
                  <li key={index} className="section-item action-item">
                    {action}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Additional Information */}
        {((activeLanguage === 'english' && (summary.participants || summary.timeline)) ||
          (activeLanguage === 'hebrew' && (summary.hebrewParticipants || summary.hebrewTimeline))) && (
          <div className={`additional-info ${activeLanguage === 'hebrew' ? 'rtl' : ''}`}>
            {((activeLanguage === 'english' && summary.participants && summary.participants.length > 0) ||
              (activeLanguage === 'hebrew' && summary.hebrewParticipants && summary.hebrewParticipants.length > 0)) && (
              <div className="info-item">
                <span className="info-label">
                  {activeLanguage === 'hebrew' ? 'משתתפים:' : 'Participants:'}
                </span>
                <span className="info-value">
                  {(activeLanguage === 'english' ? (summary.participants || []) : (summary.hebrewParticipants || [])).join(', ')}
                </span>
              </div>
            )}
            {((activeLanguage === 'english' && summary.timeline) ||
              (activeLanguage === 'hebrew' && summary.hebrewTimeline)) && (
              <div className="info-item">
                <span className="info-label">
                  {activeLanguage === 'hebrew' ? 'ציר זמן:' : 'Timeline:'}
                </span>
                <span className="info-value">
                  {activeLanguage === 'english' ? summary.timeline : summary.hebrewTimeline}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="summary-footer">
        <span className="summary-timestamp">
          Generated: {summary.createdAt.toLocaleString()}
        </span>
      </div>
    </div>
  );
}; 