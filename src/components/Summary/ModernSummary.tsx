import { useState, useCallback } from 'react';
import { 
  Users, 
  Mic, 
  FileText, 
  Music, 
  MessageCircle, 
  ChevronDown,
  Lightbulb,
  CheckCircle,
  Clock,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import type { SummaryData } from '../../types';

// shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

interface ModernSummaryProps {
  summary?: SummaryData;
  isLoading?: boolean;
  isRegenerating?: boolean;
  onRegenerate?: () => Promise<void>;
  className?: string;
}

export const ModernSummary: React.FC<ModernSummaryProps> = ({
  summary,
  isLoading = false,
  isRegenerating = false,
  onRegenerate,
  className = '',
}) => {
  const [activeLanguage, setActiveLanguage] = useState<'english' | 'hebrew'>('english');
  const [expandedSections, setExpandedSections] = useState({
    keyPoints: true,
    insights: true,
    actionItems: true,
  });

  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const getContentTypeInfo = (contentType: SummaryData['contentType']) => {
    const types = {
      meeting: { 
        label: 'Business Meeting', 
        icon: Users, 
        color: 'bg-blue-500/10 text-blue-700 border-blue-200' 
      },
      conversation: { 
        label: 'Conversation', 
        icon: MessageCircle, 
        color: 'bg-green-500/10 text-green-700 border-green-200' 
      },
      lecture: { 
        label: 'Lecture/Presentation', 
        icon: FileText, 
        color: 'bg-purple-500/10 text-purple-700 border-purple-200' 
      },
      interview: { 
        label: 'Interview', 
        icon: Mic, 
        color: 'bg-orange-500/10 text-orange-700 border-orange-200' 
      },
      song: { 
        label: 'Song/Music', 
        icon: Music, 
        color: 'bg-pink-500/10 text-pink-700 border-pink-200' 
      },
      script: { 
        label: 'Script/Drama', 
        icon: FileText, 
        color: 'bg-indigo-500/10 text-indigo-700 border-indigo-200' 
      },
      other: { 
        label: 'General Content', 
        icon: MessageCircle, 
        color: 'bg-gray-500/10 text-gray-700 border-gray-200' 
      }
    };
    return types[contentType] || types.other;
  };

  const getPriorityVariant = (priority?: string) => {
    switch (priority) {
      case 'high': return 'destructive' as const;
      case 'medium': return 'secondary' as const;
      case 'low': return 'outline' as const;
      default: return null;
    }
  };

  if (isLoading || isRegenerating || !summary) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {isRegenerating ? 'Regenerating summary...' : 'Generating AI summary...'}
                </span>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contentTypeInfo = getContentTypeInfo(summary.contentType);
  const ContentTypeIcon = contentTypeInfo.icon;
  const priorityVariant = getPriorityVariant(summary.priority);

  const currentTitle = activeLanguage === 'english' 
    ? summary.englishTitle 
    : summary.hebrewTitle;

  const currentSummaryText = activeLanguage === 'english' 
    ? summary.english 
    : summary.hebrew;

  const currentKeyPoints = activeLanguage === 'english' 
    ? summary.keyPoints 
    : (summary.hebrewKeyPoints || []);

  const currentInsights = activeLanguage === 'english' 
    ? (summary.insights || []) 
    : (summary.hebrewInsights || []);

  const currentActionItems = activeLanguage === 'english' 
    ? (summary.actionItems || []) 
    : (summary.hebrewActionItems || []);

  const currentParticipants = activeLanguage === 'english' 
    ? (summary.participants || []) 
    : (summary.hebrewParticipants || []);

  const currentTimeline = activeLanguage === 'english' 
    ? summary.timeline 
    : summary.hebrewTimeline;

  const isRTL = activeLanguage === 'hebrew';

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className={`p-2 rounded-lg border ${contentTypeInfo.color}`}>
                <ContentTypeIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg">
                    {currentTitle || contentTypeInfo.label}
                  </CardTitle>
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI Summary
                  </Badge>
                  {priorityVariant && (
                    <Badge variant={priorityVariant} className="text-xs">
                      {summary.priority?.toUpperCase()} PRIORITY
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Generated: {summary.createdAt.toLocaleString()}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Language Toggle */}
              <Tabs value={activeLanguage} onValueChange={(value) => setActiveLanguage(value as 'english' | 'hebrew')}>
                <TabsList className="h-8">
                  <TabsTrigger value="english" className="h-6 px-2 text-xs">
                    EN
                  </TabsTrigger>
                  <TabsTrigger value="hebrew" className="h-6 px-2 text-xs">
                    עב
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Regenerate Button */}
              {onRegenerate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRegenerate}
                  disabled={isRegenerating}
                  className="h-8 px-2 text-xs"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isRegenerating ? 'animate-spin' : ''}`} />
                  Regenerate
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Main Summary Text */}
          <div className={`prose prose-sm max-w-none ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <p className="text-foreground leading-relaxed">
              {currentSummaryText}
            </p>
          </div>

          {/* Key Points Section */}
          {currentKeyPoints.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <Button
                  variant="ghost"
                  onClick={() => toggleSection('keyPoints')}
                  className="flex items-center justify-between w-full p-0 h-auto hover:bg-transparent"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <CardTitle className="text-base">Key Points</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {currentKeyPoints.length}
                    </Badge>
                  </div>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform ${expandedSections.keyPoints ? 'rotate-180' : ''}`} 
                  />
                </Button>
              </CardHeader>
              {expandedSections.keyPoints && (
                <CardContent className="pt-0">
                  <ul className={`space-y-2 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
                    {currentKeyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          )}

          {/* Strategic Insights Section */}
          {currentInsights.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <Button
                  variant="ghost"
                  onClick={() => toggleSection('insights')}
                  className="flex items-center justify-between w-full p-0 h-auto hover:bg-transparent"
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                    <CardTitle className="text-base">Strategic Insights</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {currentInsights.length}
                    </Badge>
                  </div>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform ${expandedSections.insights ? 'rotate-180' : ''}`} 
                  />
                </Button>
              </CardHeader>
              {expandedSections.insights && (
                <CardContent className="pt-0">
                  <ul className={`space-y-3 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
                    {currentInsights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-yellow-600 mt-2 flex-shrink-0" />
                        <span className="leading-relaxed">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          )}

          {/* Action Items Section */}
          {currentActionItems.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <Button
                  variant="ghost"
                  onClick={() => toggleSection('actionItems')}
                  className="flex items-center justify-between w-full p-0 h-auto hover:bg-transparent"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-base">Action Items</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {currentActionItems.length}
                    </Badge>
                  </div>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform ${expandedSections.actionItems ? 'rotate-180' : ''}`} 
                  />
                </Button>
              </CardHeader>
              {expandedSections.actionItems && (
                <CardContent className="pt-0">
                  <ul className={`space-y-2 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
                    {currentActionItems.map((action, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                        <span className="leading-relaxed">{action}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          )}

          {/* Additional Information */}
          {(currentParticipants.length > 0 || currentTimeline) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentParticipants.length > 0 && (
                  <div className={`${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
                    <span className="text-sm font-medium text-muted-foreground">
                      {isRTL ? 'משתתפים:' : 'Participants:'}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {currentParticipants.map((participant, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {participant}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {currentTimeline && (
                  <div className={`${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {isRTL ? 'ציר זמן:' : 'Timeline:'}
                    </span>
                    <p className="mt-1 text-sm leading-relaxed">{currentTimeline}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
