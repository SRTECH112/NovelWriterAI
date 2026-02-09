'use client';

import { Volume, Chapter, Page } from '@/lib/types';
import { ChevronDown, ChevronRight, FileText, Plus, Zap } from 'lucide-react';
import { useState } from 'react';

interface VolumeChapterPageListProps {
  volumes: Volume[];
  chapters: Record<string, Chapter[]>; // chapters by volume_id
  pages: Record<string, Page[]>; // pages by chapter_id
  currentChapterId: string | null;
  currentPageId: string | null;
  onChapterSelect: (chapter: Chapter) => void;
  onPageSelect: (page: Page) => void;
  onAddChapter: (volumeId: string) => void;
  onGeneratePage: (chapterId: string, pageNumber: number) => void;
}

export default function VolumeChapterPageList({
  volumes,
  chapters,
  pages,
  currentChapterId,
  currentPageId,
  onChapterSelect,
  onPageSelect,
  onAddChapter,
  onGeneratePage,
}: VolumeChapterPageListProps) {
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set(volumes.map(v => v.id)));
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const toggleVolume = (volumeId: string) => {
    setExpandedVolumes(prev => {
      const next = new Set(prev);
      if (next.has(volumeId)) {
        next.delete(volumeId);
      } else {
        next.add(volumeId);
      }
      return next;
    });
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {volumes.map(volume => {
        const volumeChapters = (chapters[volume.id] || []).sort((a, b) => a.chapterOrder - b.chapterOrder);
        const isExpanded = expandedVolumes.has(volume.id);

        return (
          <div key={volume.id} className="border rounded-lg">
            {/* Volume Header */}
            <div
              className="flex items-center gap-2 p-3 bg-muted/50 cursor-pointer hover:bg-muted"
              onClick={() => toggleVolume(volume.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span className="font-semibold">Volume {volume.volumeNumber}: {volume.title}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {volumeChapters.length} chapters
              </span>
            </div>

            {/* Chapters */}
            {isExpanded && (
              <div className="p-2 space-y-1">
                {volumeChapters.map(chapter => {
                  const chapterPages = (pages[chapter.id] || []).sort((a, b) => a.pageNumber - b.pageNumber);
                  const isChapterExpanded = expandedChapters.has(chapter.id);
                  const isSelected = currentChapterId === chapter.id;
                  const progress = chapter.targetPageCount > 0
                    ? Math.round((chapter.currentPageCount / chapter.targetPageCount) * 100)
                    : 0;

                  return (
                    <div key={chapter.id} className={`border rounded ${isSelected ? 'border-primary bg-primary/5' : ''}`}>
                      {/* Chapter Header */}
                      <div className="flex items-center gap-2 p-2">
                        <button
                          onClick={() => toggleChapter(chapter.id)}
                          className="p-0.5 hover:bg-muted rounded"
                        >
                          {isChapterExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </button>
                        <button
                          onClick={() => onChapterSelect(chapter)}
                          className="flex-1 text-left text-sm hover:bg-muted rounded px-2 py-1"
                        >
                          <div className="font-medium">
                            Chapter {chapter.chapterNumber}: {chapter.title || 'Untitled'}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>Page {chapter.currentPageCount} of {chapter.targetPageCount}</span>
                            <span>•</span>
                            <span>{chapter.wordCount} / {chapter.targetWordCount} words</span>
                            {chapter.actTag && (
                              <>
                                <span>•</span>
                                <span className="italic">{chapter.actTag}</span>
                              </>
                            )}
                          </div>
                          {/* Progress Bar */}
                          <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </button>
                      </div>

                      {/* Pages */}
                      {isChapterExpanded && (
                        <div className="pl-8 pr-2 pb-2 space-y-1">
                          {chapterPages.map(page => {
                            const isPageSelected = currentPageId === page.id;
                            return (
                              <button
                                key={page.id}
                                onClick={() => onPageSelect(page)}
                                className={`w-full text-left text-xs p-2 rounded flex items-center gap-2 ${
                                  isPageSelected
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                                }`}
                              >
                                <FileText className="h-3 w-3" />
                                <span>Page {page.pageNumber}</span>
                                <span className="ml-auto">{page.wordCount} words</span>
                                {page.locked && (
                                  <span className="text-xs opacity-70">🔒</span>
                                )}
                              </button>
                            );
                          })}

                          {/* Generate Next Page Button */}
                          {chapter.currentPageCount < chapter.targetPageCount && (
                            <button
                              onClick={() => onGeneratePage(chapter.id, chapter.currentPageCount + 1)}
                              className="w-full text-left text-xs p-2 rounded flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium"
                            >
                              <Zap className="h-3 w-3" />
                              <span>Generate Page {chapter.currentPageCount + 1}</span>
                            </button>
                          )}

                          {/* Chapter Complete - Generate Next Chapter */}
                          {chapter.currentPageCount >= chapter.targetPageCount && (
                            <div className="text-xs text-center py-2 text-green-600 font-medium">
                              ✓ Chapter Complete ({chapter.wordCount} words)
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Generate Next Chapter Button (if last chapter is complete) */}
                {volumeChapters.length > 0 && 
                 volumeChapters[volumeChapters.length - 1].currentPageCount >= volumeChapters[volumeChapters.length - 1].targetPageCount && (
                  <button
                    onClick={() => onAddChapter(volume.id)}
                    className="w-full text-left text-sm p-2 rounded flex items-center gap-2 bg-green-600/10 hover:bg-green-600/20 text-green-600 font-medium"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Generate Next Chapter</span>
                  </button>
                )}

                {/* Add Chapter Button (if no chapters or last chapter incomplete) */}
                {(volumeChapters.length === 0 || 
                  volumeChapters[volumeChapters.length - 1].currentPageCount < volumeChapters[volumeChapters.length - 1].targetPageCount) && (
                  <button
                    onClick={() => onAddChapter(volume.id)}
                    className="w-full text-left text-sm p-2 rounded flex items-center gap-2 hover:bg-muted text-muted-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Chapter</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
