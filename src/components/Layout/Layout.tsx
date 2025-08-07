import React, { useState } from 'react';
import { Sidebar } from '../Sidebar';
import type { TranscriptionResult } from '../../types';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  results: TranscriptionResult[];
  selectedResult?: TranscriptionResult;
  onSelectResult: (result: TranscriptionResult) => void;
  onNewRecording: () => void;
  onDeleteResult: (id: string) => void;
  onClearAllResults: () => void;
  onOpenSettings: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  results,
  selectedResult,
  onSelectResult,
  onNewRecording,
  onDeleteResult,
  onClearAllResults,
  onOpenSettings,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="modern-layout">
      <Sidebar
        results={results}
        selectedResultId={selectedResult?.id}
        onSelectResult={onSelectResult}
        onNewRecording={onNewRecording}
        onDeleteResult={onDeleteResult}
        onClearAll={onClearAllResults}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />
      
      <div className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <header className="main-header">
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={handleToggleSidebar}
              aria-label="Toggle sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            
            {selectedResult && (
              <div className="current-recording-info">
                <div className="recording-icon">
                  {selectedResult.summary?.contentType === 'meeting' ? '👥' :
                   selectedResult.summary?.contentType === 'interview' ? '🎤' :
                   selectedResult.summary?.contentType === 'lecture' ? '📚' :
                   selectedResult.summary?.contentType === 'song' ? '🎵' :
                   selectedResult.summary?.contentType === 'script' ? '📝' : '🎙️'}
                </div>
                <div className="recording-details">
                  <h1 className="recording-title">
                    {selectedResult.summary?.englishTitle || selectedResult.audioFileName}
                  </h1>
                  <div className="recording-meta">
                    <span className="recording-date">
                      {selectedResult.createdAt.toLocaleDateString()}
                    </span>
                    {selectedResult.duration && (
                      <span className="recording-duration">
                        {Math.round(selectedResult.duration)}s
                      </span>
                    )}
                    {selectedResult.summary && (
                      <span className="ai-processed">AI Processed</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="header-actions">
            <button 
              className="settings-btn"
              onClick={onOpenSettings}
              title="Settings"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </header>
        
        <main className="main-workspace">
          {children}
        </main>
      </div>
    </div>
  );
};
