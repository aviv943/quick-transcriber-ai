import React from 'react';
import type { TranscriptionResult } from '../../types';
import { AppSidebar } from '../app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

interface OfficialLayoutProps {
  children: React.ReactNode;
  results: TranscriptionResult[];
  selectedResult?: TranscriptionResult;
  onSelectResult: (result: TranscriptionResult) => void;
  onNewRecording: () => void;
  onDeleteResult: (id: string) => void;
  onClearAllResults: () => void;
  onOpenSettings: () => void;
}

export const OfficialLayout: React.FC<OfficialLayoutProps> = ({
  children,
  results,
  selectedResult,
  onSelectResult,
  onNewRecording,
  onDeleteResult,
  onClearAllResults,
  onOpenSettings,
}) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar
        results={results}
        selectedResultId={selectedResult?.id}
        onSelectResult={onSelectResult}
        onNewRecording={onNewRecording}
        onDeleteResult={onDeleteResult}
        onClearAll={onClearAllResults}
        onOpenSettings={onOpenSettings}
      />
      
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          
          {selectedResult && (
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {selectedResult.summary?.contentType === 'meeting' ? '👥' :
                     selectedResult.summary?.contentType === 'interview' ? '🎤' :
                     selectedResult.summary?.contentType === 'lecture' ? '📚' :
                     selectedResult.summary?.contentType === 'song' ? '🎵' :
                     selectedResult.summary?.contentType === 'script' ? '📝' : '🎙️'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="truncate text-lg font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                      {selectedResult.summary?.englishTitle || selectedResult.audioFileName}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{selectedResult.createdAt.toLocaleDateString()}</span>
                      {selectedResult.duration && (
                        <>
                          <span>•</span>
                          <span>{Math.round(selectedResult.duration)}s</span>
                        </>
                      )}
                      {selectedResult.summary && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            AI Processed
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
