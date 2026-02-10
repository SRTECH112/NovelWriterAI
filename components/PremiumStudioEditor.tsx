'use client';

import { useState } from 'react';
import { Volume, Chapter, Page } from '@/lib/types';
import { ChevronDown, ChevronRight, Sparkles, Save, User, BookOpen, Layers, Trash2 } from 'lucide-react';

interface PremiumStudioEditorProps {
  volumes: Volume[];
  chapters: Record<string, Chapter[]>;
  pages: Record<string, Page[]>;
  currentChapter: Chapter | null;
  currentPage: Page | null;
  bookTitle: string;
  loading: boolean;
  onChapterSelect: (chapter: Chapter) => void;
  onPageSelect: (page: Page) => void;
  onGeneratePage: (chapterId: string, pageNumber: number) => void;
  onRemovePage: (pageId: string, chapterId: string) => void;
  volumeOutline?: string;
  chapterOutline?: string;
}

export default function PremiumStudioEditor({
  volumes,
  chapters,
  pages,
  currentChapter,
  currentPage,
  bookTitle,
  loading,
  onChapterSelect,
  onPageSelect,
  onGeneratePage,
  onRemovePage,
  volumeOutline,
  chapterOutline,
}: PremiumStudioEditorProps) {
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set(volumes.map(v => v.id)));
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [showOutlineCard, setShowOutlineCard] = useState(false);

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

  const currentVolume = volumes.find(v => v.id === currentChapter?.volumeId);

  return (
    <div className="min-h-screen h-screen overflow-y-auto studio-background">
      {/* 🟣 TOP BAR - Floating Glass Command Center */}
      <div className="fixed top-2 md:top-4 left-2 md:left-4 right-2 md:right-4 z-50">
        <div className="glass-panel rounded-xl md:rounded-2xl px-3 md:px-6 py-3 md:py-4 flex items-center justify-between smooth-transition">
          {/* Left: Book Title & Breadcrumb */}
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-white/70 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-white font-serif text-sm md:text-lg font-semibold tracking-wide truncate">
                {bookTitle}
              </h1>
              {currentVolume && currentChapter && (
                <div className="hidden md:flex items-center gap-2 text-xs text-white/60 mt-0.5">
                  <span>{currentVolume.title}</span>
                  <span>→</span>
                  <span>Chapter {currentChapter.chapterNumber}</span>
                  {currentPage && (
                    <>
                      <span>→</span>
                      <span>Page {currentPage.pageNumber}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {/* Context Panel Toggle - Hidden on mobile */}
            <button
              onClick={() => setShowContextPanel(!showContextPanel)}
              className="hidden md:flex px-4 py-2 rounded-xl text-white/80 hover:text-white border border-white/20 hover:border-white/30 smooth-transition"
            >
              <Layers className="h-4 w-4" />
            </button>

            {/* Generate Page Button */}
            {currentChapter && currentChapter.currentPageCount < currentChapter.targetPageCount && (
              <button
                onClick={() => onGeneratePage(currentChapter.id, currentChapter.currentPageCount + 1)}
                disabled={loading}
                className="gradient-button px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-white text-xs md:text-base font-medium flex items-center gap-1 md:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">{loading ? 'Generating...' : `Generate Page ${currentChapter.currentPageCount + 1}`}</span>
                <span className="sm:hidden">Page {currentChapter.currentPageCount + 1}</span>
              </button>
            )}

            {/* Save Status - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 text-white/60 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>Saved</span>
            </div>

            {/* User Avatar - Hidden on mobile */}
            <div className="hidden md:flex w-9 h-9 rounded-full glass-panel items-center justify-center">
              <User className="h-4 w-4 text-white/70" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="pt-20 md:pt-24 px-2 md:px-4 pb-8 flex flex-col md:flex-row gap-4 md:gap-6 max-w-[1800px] mx-auto">
        {/* 🟣 LEFT SIDEBAR - Story Tree */}
        <div className="w-full md:w-80 flex-shrink-0">
          <div className="glass-panel-strong rounded-xl md:rounded-2xl p-3 md:p-4 smooth-transition max-h-64 md:max-h-[calc(100vh-120px)] overflow-y-auto bg-white/95 md:bg-transparent">
            <div className="space-y-2">
              {volumes.map(volume => {
                const isExpanded = expandedVolumes.has(volume.id);
                const volumeChapters = chapters[volume.id] || [];

                return (
                  <div key={volume.id} className="space-y-1">
                    {/* Volume Header */}
                    <button
                      onClick={() => toggleVolume(volume.id)}
                      className="w-full flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-gray-900 md:text-white/90 hover:bg-gray-100 md:hover:bg-white/10 smooth-transition"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-gray-600 md:text-white/60" />
                      ) : (
                        <ChevronRight className="h-3 w-3 md:h-4 md:w-4 text-gray-600 md:text-white/60" />
                      )}
                      <BookOpen className="h-3 w-3 md:h-4 md:w-4 text-violet-500 md:text-violet-400" />
                      <span className="font-medium text-xs md:text-sm truncate">{volume.title}</span>
                      <span className="ml-auto text-xs text-gray-500 md:text-white/40 flex-shrink-0">{volumeChapters.length} ch</span>
                    </button>

                    {/* Chapters */}
                    {isExpanded && (
                      <div className="ml-6 space-y-1">
                        {volumeChapters.map(chapter => {
                          const chapterPages = (pages[chapter.id] || []).sort((a, b) => a.pageNumber - b.pageNumber);
                          const isActive = currentChapter?.id === chapter.id;

                          return (
                            <div key={chapter.id} className="space-y-0.5">
                              {/* Chapter */}
                              <button
                                onClick={() => onChapterSelect(chapter)}
                                className={`w-full text-left px-2 md:px-3 py-1.5 md:py-2 rounded-lg smooth-transition ${
                                  isActive ? 'bg-violet-100 md:bg-white/15 border-l-2 border-violet-500 md:border-violet-400' : 'hover:bg-gray-100 md:hover:bg-white/5'
                                }`}
                              >
                                <div className="text-xs md:text-sm text-gray-900 md:text-white/90 font-medium truncate">
                                  Ch {chapter.chapterNumber}: {chapter.title}
                                </div>
                                <div className="text-xs text-gray-600 md:text-white/50 mt-0.5">
                                  {chapter.currentPageCount} / {chapter.targetPageCount} pages
                                </div>
                              </button>

                              {/* Pages */}
                              {isActive && chapterPages.length > 0 && (
                                <div className="ml-4 space-y-0.5">
                                  {chapterPages.map(page => {
                                    const isPageActive = currentPage?.id === page.id;
                                    return (
                                      <div key={page.id} className="flex items-center gap-1">
                                        <button
                                          onClick={() => onPageSelect(page)}
                                          className={`flex-1 text-left px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs smooth-transition ${
                                            isPageActive 
                                              ? 'bg-violet-50 md:active-page-glow text-violet-900 md:text-white font-medium' 
                                              : 'text-gray-700 md:text-white/60 hover:bg-gray-50 md:hover:bg-white/5 hover:text-gray-900 md:hover:text-white/80'
                                          }`}
                                        >
                                          <span className="truncate block">Page {page.pageNumber} · {page.wordCount}w</span>
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Delete Page ${page.pageNumber}? This cannot be undone.`)) {
                                              onRemovePage(page.id, chapter.id);
                                            }
                                          }}
                                          className="p-1.5 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 smooth-transition"
                                          title="Delete page"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 📝 MAIN EDITOR - The Sacred Writing Space */}
        <div className="flex-1 flex justify-center">
          {currentPage ? (
            <div className="w-full max-w-4xl">
              {/* Outline Card (Collapsible) */}
              {(volumeOutline || chapterOutline) && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowOutlineCard(!showOutlineCard)}
                    className="w-full glass-panel rounded-xl px-6 py-3 text-left flex items-center justify-between smooth-transition hover:bg-white/10"
                  >
                    <span className="text-white/90 font-medium">Volume & Chapter Blueprint</span>
                    <ChevronDown className={`h-4 w-4 text-white/60 smooth-transition ${showOutlineCard ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showOutlineCard && (
                    <div className="mt-2 glass-panel rounded-xl p-6 smooth-slide-in">
                      {volumeOutline && (
                        <div className="mb-4">
                          <h4 className="text-white/70 text-sm font-medium mb-2">Volume Outline</h4>
                          <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{volumeOutline}</p>
                        </div>
                      )}
                      {chapterOutline && (
                        <div>
                          <h4 className="text-white/70 text-sm font-medium mb-2">Chapter Outline</h4>
                          <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{chapterOutline}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Premium Editor Card */}
              <div className="editor-card p-4 md:p-8 lg:p-12">
                {/* Page Header */}
                <div className="mb-6 md:mb-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl md:text-2xl lg:text-3xl font-serif font-bold text-gray-900 mb-1">
                        {currentChapter?.title || 'Untitled Chapter'}
                      </h2>
                      <p className="text-sm md:text-base text-gray-500">
                        Page {currentPage.pageNumber} of {currentChapter?.targetPageCount}
                      </p>
                    </div>
                    <div className="text-left md:text-right text-sm text-gray-500 flex-shrink-0">
                      <div>{currentPage.wordCount} words</div>
                      {currentPage.beatCoverage && (
                        <div className="text-xs mt-1 line-clamp-1">{currentPage.beatCoverage}</div>
                      )}
                    </div>
                  </div>
                  <div className="h-px bg-gradient-to-r from-violet-200 via-pink-200 to-transparent" />
                </div>

                {/* Page Content */}
                <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none">
                  <div className="text-gray-800 leading-relaxed whitespace-pre-wrap font-serif text-base md:text-lg cursor-glow text-fade-in">
                    {currentPage.content}
                  </div>
                </div>

                {/* Narrative Momentum */}
                {currentPage.narrativeMomentum && (
                  <div className="mt-12 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Narrative Momentum</h4>
                    <p className="text-sm text-gray-600 italic">{currentPage.narrativeMomentum}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
              <div className="text-center">
                <Sparkles className="h-16 w-16 mx-auto mb-4 text-white/30" />
                <p className="text-white/60 text-lg">Select a page to begin writing</p>
              </div>
            </div>
          )}
        </div>

        {/* 🧠 RIGHT CONTEXT PANEL - AI Transparency (Slides In) */}
        {showContextPanel && (
          <div className="w-80 flex-shrink-0 smooth-slide-in">
            <div className="glass-panel-strong rounded-2xl p-6 max-h-[calc(100vh-120px)] overflow-y-auto">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                AI Context
              </h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="text-white/70 font-medium mb-2">Memory Depth</h4>
                  <p className="text-white/60">Last 17 pages loaded for continuity</p>
                </div>

                {volumeOutline && (
                  <div>
                    <h4 className="text-white/70 font-medium mb-2">Volume Outline</h4>
                    <p className="text-white/50 text-xs leading-relaxed line-clamp-6">{volumeOutline}</p>
                  </div>
                )}

                {chapterOutline && (
                  <div>
                    <h4 className="text-white/70 font-medium mb-2">Chapter Outline</h4>
                    <p className="text-white/50 text-xs leading-relaxed line-clamp-6">{chapterOutline}</p>
                  </div>
                )}

                {currentChapter && (
                  <div>
                    <h4 className="text-white/70 font-medium mb-2">Chapter Progress</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-white/60">
                        <span>Pages</span>
                        <span>{currentChapter.currentPageCount} / {currentChapter.targetPageCount}</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-400 to-pink-400 smooth-transition"
                          style={{ width: `${(currentChapter.currentPageCount / currentChapter.targetPageCount) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-white/60">
                        <span>Words</span>
                        <span>{currentChapter.wordCount} / {currentChapter.targetWordCount}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ⏳ GENERATION OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="glass-panel-strong rounded-2xl p-8 max-w-md text-center">
            <div className="generation-shimmer h-1 w-full rounded-full mb-6" />
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-violet-400 animate-pulse" />
            <h3 className="text-white text-xl font-semibold mb-2">Crafting your story...</h3>
            <p className="text-white/60 text-sm">The AI is weaving narrative magic</p>
          </div>
        </div>
      )}
    </div>
  );
}
