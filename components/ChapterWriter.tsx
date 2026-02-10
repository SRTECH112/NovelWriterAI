'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import { StoryBible, Chapter } from '@/lib/types';

interface ChapterWriterProps {
  bible: StoryBible;
  outline: any;
  chapters: Chapter[];
  onChapterGenerated: (chapter: Chapter) => void;
}

export function ChapterWriter({ bible, outline, chapters, onChapterGenerated }: ChapterWriterProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  const safeStateDelta = {
    characterStates: selectedChapter?.characterStates || {},
    worldChanges: selectedChapter?.worldChanges || [],
    plotProgression: selectedChapter?.plotProgression || [],
  };

  const nextChapterNumber = chapters.length > 0 ? Math.max(...chapters.map(c => c.chapterNumber)) + 1 : 1;
  const canGenerateNext = nextChapterNumber <= outline.chapters.length;

  const handleGenerateNext = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyBible: bible,
          outline,
          chapterNumber: nextChapterNumber,
          previousChapters: chapters,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate chapter');
      }

      const result = await response.json();
      onChapterGenerated(result.chapter);
      setSelectedChapter(result.chapter);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (chapterNumber: number) => {
    setLoading(true);
    setError('');

    try {
      const previousChaps = chapters.filter(c => c.chapterNumber < chapterNumber);
      const response = await fetch('/api/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyBible: bible,
          outline,
          chapterNumber,
          previousChapters: previousChaps,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to regenerate chapter');
      }

      const result = await response.json();
      onChapterGenerated(result.chapter);
      setSelectedChapter(result.chapter);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Chapter Writer</CardTitle>
                <CardDescription>
                  Generate chapters one at a time with canon enforcement
                </CardDescription>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {chapters.length} / {outline.chapters.length} chapters written
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={handleGenerateNext}
            disabled={loading || !canGenerateNext}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Chapter {nextChapterNumber}...
              </>
            ) : canGenerateNext ? (
              `Generate Chapter ${nextChapterNumber}`
            ) : (
              'All Chapters Complete'
            )}
          </Button>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Chapter Timeline</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedChapter?.id === chapter.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedChapter(chapter)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Chapter {chapter.chapterNumber}</span>
                      {chapter.canonWarnings.length > 0 && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Canon Warning
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRegenerate(chapter.chapterNumber);
                      }}
                      disabled={loading}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{chapter.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedChapter && (
        <Card>
          <CardHeader>
            <CardTitle>Chapter {selectedChapter.chapterNumber}</CardTitle>
            <CardDescription>{selectedChapter.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prose Quality Score */}
            {selectedChapter.proseQuality && (
              <div className={`border rounded-lg p-4 ${
                selectedChapter.proseQuality.score >= 80 ? 'bg-green-50 border-green-200' :
                selectedChapter.proseQuality.score >= 60 ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <FileText className="h-4 w-4" />
                    Prose Quality Score
                  </div>
                  <Badge variant={
                    selectedChapter.proseQuality.score >= 80 ? 'default' :
                    selectedChapter.proseQuality.score >= 60 ? 'secondary' :
                    'destructive'
                  }>
                    {selectedChapter.proseQuality.score}/100
                  </Badge>
                </div>
                
                {selectedChapter.proseQuality.issues.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-1">Issues:</p>
                    <ul className="space-y-1 text-sm">
                      {selectedChapter.proseQuality.issues.map((issue, i) => (
                        <li key={i} className="text-red-700">• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedChapter.proseQuality.warnings.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-1">Warnings:</p>
                    <ul className="space-y-1 text-sm">
                      {selectedChapter.proseQuality.warnings.map((warning, i) => (
                        <li key={i} className="text-yellow-700">• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {selectedChapter.canonWarnings.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2 text-destructive font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  Canon Violations Detected
                </div>
                <ul className="space-y-1 text-sm">
                  {selectedChapter.canonWarnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Content</h3>
              <div className="bg-muted/50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {selectedChapter.content}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2 text-sm">Character States</h3>
                <div className="space-y-1 text-sm">
                  {Object.entries(safeStateDelta.characterStates).map(([char, state]) => (
                    <div key={char} className="bg-muted/50 p-2 rounded">
                      <span className="font-medium">{char}:</span> {state}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-sm">World Changes</h3>
                <ul className="space-y-1 text-sm">
                  {safeStateDelta.worldChanges.map((change, i) => (
                    <li key={i} className="bg-muted/50 p-2 rounded">
                      • {change}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
