import React, { useState, useCallback, useMemo } from 'react';
import { Search, Plus, Trash2, ChevronLeft } from 'lucide-react';
import type { TranscriptionResult } from '../../types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

interface ModernSidebarProps {
  results: TranscriptionResult[];
  selectedResultId?: string;
  onSelectResult: (result: TranscriptionResult) => void;
  onNewRecording: () => void;
  onDeleteResult: (id: string) => void;
  onClearAll: () => void;
}

function SidebarToggle() {
  const { toggleSidebar } = useSidebar();
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleSidebar}
      className="h-7 w-7 p-0"
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
}

function ModernSidebarContent({ 
  results, 
  selectedResultId, 
  onSelectResult, 
  onNewRecording, 
  onDeleteResult, 
  onClearAll 
}: ModernSidebarProps) {
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
    <Sidebar variant="sidebar" className="w-64 border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          <SidebarToggle />
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col gap-4 p-4">
        {/* New Recording Button */}
        <Button 
          onClick={onNewRecording}
          className="w-full justify-start gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Recording
        </Button>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>

        {/* Results List */}
        <div className="flex-1 space-y-1">
          {filteredAndSortedResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <div className="text-2xl mb-2">🎙️</div>
              <p className="text-sm">No recordings</p>
              {searchQuery && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 h-auto p-0"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <SidebarMenu>
              {filteredAndSortedResults.map((result) => (
                <SidebarMenuItem key={result.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={selectedResultId === result.id}
                    className={cn(
                      "group relative w-full justify-start p-3 h-auto",
                      selectedResultId === result.id && "bg-accent"
                    )}
                  >
                    <button
                      onClick={() => onSelectResult(result)}
                      onMouseEnter={() => setHoveredId(result.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className="flex w-full items-center text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium">
                          {getResultTitle(result)}
                        </div>
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
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
        </div>
      </SidebarContent>

      {/* Footer */}
      {results.length > 0 && (
        <SidebarFooter className="border-t p-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearAll}
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}

export const ModernSidebar: React.FC<ModernSidebarProps> = (props) => {
  return <ModernSidebarContent {...props} />;
};
