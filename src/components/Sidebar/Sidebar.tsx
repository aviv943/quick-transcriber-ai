import React, { useState, useCallback, useMemo } from 'react';
import type { TranscriptionResult } from '../../types';
import './Sidebar.css';

interface SidebarProps {
  results: TranscriptionResult[];
  selectedResultId?: string;
  onSelectResult: (result: TranscriptionResult) => void;
  onNewRecording: () => void;
  onDeleteResult: (id: string) => void;
  onClearAll: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  results,
  selectedResultId,
  onSelectResult,
  onNewRecording,
  onDeleteResult,
  onClearAll,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    let filtered = results;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = results.filter(result => 
        result.audioFileName.toLowerCase().includes(query) ||
        result.text.toLowerCase().includes(query) ||
        (result.summary?.english.toLowerCase().includes(query)) ||
        (result.summary?.hebrew?.toLowerCase().includes(query))
      );
    }

    // Sort by newest first
    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [results, searchQuery]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const getResultTitle = (result: TranscriptionResult) => {
    if (result.summary?.englishTitle) {
      return result.summary.englishTitle;
    }
    return result.audioFileName.replace(/\.[^/.]+$/, ''); // Remove file extension
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Collapse Toggle */}
      <div className="sidebar-header">
        <button 
          className="collapse-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className={isCollapsed ? 'rotated' : ''}
          >
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>
      </div>

      {/* New Recording Button */}
      <div className="sidebar-actions">
        <button 
          className="new-recording-btn"
          onClick={onNewRecording}
          title="New Recording"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {!isCollapsed && <span>New Recording</span>}
        </button>
      </div>

      {/* Search Bar */}
      {!isCollapsed && (
        <div className="sidebar-search">
          <div className="search-input-container">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchQuery && (
              <button 
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results List */}
      <div className="sidebar-content">
        {filteredAndSortedResults.length === 0 ? (
          <div className="empty-state">
            {!isCollapsed ? (
              <>
                <div className="empty-icon">🎙️</div>
                <p>No recordings</p>
                {searchQuery && (
                  <button 
                    className="clear-search-link"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear search
                  </button>
                )}
              </>
            ) : (
              <div className="empty-icon">🎙️</div>
            )}
          </div>
        ) : (
          <div className="results-list">
            {filteredAndSortedResults.map((result) => (
              <div
                key={result.id}
                className={`result-item ${selectedResultId === result.id ? 'selected' : ''}`}
                onClick={() => onSelectResult(result)}
                onMouseEnter={() => setHoveredId(result.id)}
                onMouseLeave={() => setHoveredId(null)}
                title={isCollapsed ? getResultTitle(result) : undefined}
              >
                {!isCollapsed ? (
                  <div className="result-content">
                    <div className="result-title">
                      {getResultTitle(result)}
                    </div>
                  </div>
                ) : (
                  <div className="result-icon-collapsed">
                    🎙️
                  </div>
                )}

                {!isCollapsed && hoveredId === result.id && (
                  <div className="result-actions">
                    <button
                      className="result-action-btn delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteResult(result.id);
                      }}
                      title="Delete recording"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      {!isCollapsed && results.length > 0 && (
        <div className="sidebar-footer">
          <button 
            className="clear-all-btn"
            onClick={onClearAll}
            title="Clear all recordings"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};
