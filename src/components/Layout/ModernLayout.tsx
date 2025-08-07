import React from 'react';
import { Settings } from 'lucide-react';
import type { TranscriptionResult } from '../../types';
import { ModernSidebar } from '../Sidebar/ModernSidebar';
import { Button } from '@/components/ui/button';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';


interface ModernLayoutProps {
  children: React.ReactNode;
  results: TranscriptionResult[];
  selectedResult?: TranscriptionResult;
  onSelectResult: (result: TranscriptionResult) => void;
  onNewRecording: () => void;
  onDeleteResult: (id: string) => void;
  onClearAllResults: () => void;
  onOpenSettings: () => void;
}

export const ModernLayout: React.FC<ModernLayoutProps> = ({
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
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full">
        <ModernSidebar
          results={results}
          selectedResultId={selectedResult?.id}
          onSelectResult={onSelectResult}
          onNewRecording={onNewRecording}
          onDeleteResult={onDeleteResult}
          onClearAll={onClearAllResults}
        />
        
        <SidebarInset className="flex flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-6">
            <div className="flex items-center gap-4">
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
                    <h1 className="truncate text-lg font-semibold">
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
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenSettings}
                className="h-9 w-9 p-0"
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
