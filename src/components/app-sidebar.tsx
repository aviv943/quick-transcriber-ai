import React, { useState, useCallback, useMemo } from 'react';
import { Search, Plus, Trash2, Settings, X } from 'lucide-react';
import type { TranscriptionResult } from '../types';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AppSidebarProps {
  results: TranscriptionResult[];
  selectedResultId?: string;
  onSelectResult: (result: TranscriptionResult) => void;
  onNewRecording: () => void;
  onDeleteResult: (id: string) => void;
  onClearAll: () => void;
  onOpenSettings: () => void;
}

export function AppSidebar({
  results,
  selectedResultId,
  onSelectResult,
  onNewRecording,
  onDeleteResult,
  onClearAll,
  onOpenSettings,
}: AppSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    let filtered = results;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = results.filter(result => {
        // Search in file name (remove extension)
        const fileName = result.audioFileName.toLowerCase().replace(/\.[^/.]+$/, '');
        
        // Search in transcription text
        const transcriptionText = result.text.toLowerCase();
        
        // Search in summary fields
        const englishSummary = result.summary?.english?.toLowerCase() || '';
        const hebrewSummary = result.summary?.hebrew?.toLowerCase() || '';
        const englishTitle = result.summary?.englishTitle?.toLowerCase() || '';
        const hebrewTitle = result.summary?.hebrewTitle?.toLowerCase() || '';
        
        // Search in key points
        const keyPoints = result.summary?.keyPoints?.join(' ').toLowerCase() || '';
        const hebrewKeyPoints = result.summary?.hebrewKeyPoints?.join(' ').toLowerCase() || '';
        
        return fileName.includes(query) ||
               transcriptionText.includes(query) ||
               englishSummary.includes(query) ||
               hebrewSummary.includes(query) ||
               englishTitle.includes(query) ||
               hebrewTitle.includes(query) ||
               keyPoints.includes(query) ||
               hebrewKeyPoints.includes(query);
      });
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
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={onNewRecording}
              className="w-full"
              size="lg"
            >
              <Plus className="h-4 w-4" />
              <span>New Recording</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Recordings</SidebarGroupLabel>
          <div className="px-3 pb-2">
            <div className="relative group-data-[collapsible=icon]:hidden">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search recordings..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="h-8 pl-7 pr-8 text-sm bg-sidebar-accent/50 border-sidebar-border focus:bg-sidebar-accent focus:border-sidebar-ring"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:text-sidebar-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredAndSortedResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground group-data-[collapsible=icon]:hidden">
                  <div className="text-2xl mb-2">{searchQuery ? '🔍' : '🎙️'}</div>
                  <p className="text-xs mb-2">
                    {searchQuery ? `No results for "${searchQuery}"` : 'No recordings'}
                  </p>
                  {searchQuery && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                      className="h-auto p-0 text-xs text-sidebar-primary hover:text-sidebar-primary/80"
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              ) : (
                filteredAndSortedResults.map((result) => (
                  <SidebarMenuItem key={result.id}>
                    <SidebarMenuButton
                      onClick={() => onSelectResult(result)}
                      onMouseEnter={() => setHoveredId(result.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      isActive={selectedResultId === result.id}
                      tooltip={getResultTitle(result)}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex-shrink-0">🎙️</div>
                        <span className="truncate font-medium">
                          {getResultTitle(result)}
                        </span>
                      </div>
                      
                      {hoveredId === result.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteResult(result.id);
                          }}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="sr-only">Delete recording</span>
                        </Button>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onOpenSettings}
              tooltip="Settings"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {results.length > 0 && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={onClearAll}
                tooltip="Clear All Recordings"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear All</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
