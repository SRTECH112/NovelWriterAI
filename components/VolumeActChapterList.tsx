'use client';

import { Volume, Act, Chapter } from '@/lib/types';
import { ChevronDown, ChevronRight, FileText, Plus } from 'lucide-react';
import { useState } from 'react';

interface VolumeActChapterListProps {
  volumes: Volume[];
  acts: Record<string, Act[]>; // volumeId -> acts
  chapters: Record<string, Chapter[]>; // actId -> chapters
  currentChapterId: string | null;
  onChapterSelect: (chapter: Chapter) => void;
  onGenerateChapter: (actId: string, chapterNumber: number) => void;
}

export default function VolumeActChapterList({
  volumes,
  acts,
  chapters,
  currentChapterId,
  onChapterSelect,
  onGenerateChapter,
}: VolumeActChapterListProps) {
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set());
  const [expandedActs, setExpandedActs] = useState<Set<string>>(new Set());

  const toggleVolume = (volumeId: string) => {
    const newExpanded = new Set(expandedVolumes);
    if (newExpanded.has(volumeId)) {
      newExpanded.delete(volumeId);
    } else {
      newExpanded.add(volumeId);
    }
    setExpandedVolumes(newExpanded);
  };

  const toggleAct = (actId: string) => {
    const newExpanded = new Set(expandedActs);
    if (newExpanded.has(actId)) {
      newExpanded.delete(actId);
    } else {
      newExpanded.add(actId);
    }
    setExpandedActs(newExpanded);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-sm text-gray-900">Story Structure</h3>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {volumes.map((volume) => {
          const volumeActs = acts[volume.id] || [];
          const isVolumeExpanded = expandedVolumes.has(volume.id);

          return (
            <div key={volume.id} className="border-b border-gray-100">
              {/* Volume Header */}
              <button
                onClick={() => toggleVolume(volume.id)}
                className="w-full px-4 py-3 flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                {isVolumeExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-600 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-600 flex-shrink-0" />
                )}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Volume {volume.volumeNumber}</span>
                    <span className="text-xs text-gray-500">({volumeActs.length} acts)</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{volume.title}</p>
                </div>
              </button>

              {/* Acts */}
              {isVolumeExpanded && (
                <div className="bg-gray-50">
                  {volumeActs.map((act) => {
                    const actChapters = chapters[act.id] || [];
                    const isActExpanded = expandedActs.has(act.id);

                    return (
                      <div key={act.id} className="border-t border-gray-200">
                        {/* Act Header */}
                        <button
                          onClick={() => toggleAct(act.id)}
                          className="w-full px-8 py-2 flex items-center gap-2 hover:bg-gray-100 transition-colors"
                        >
                          {isActExpanded ? (
                            <ChevronDown className="h-3 w-3 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-gray-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">Act {act.actNumber}</span>
                              <span className="text-xs text-gray-500">
                                ({actChapters.length} chapters)
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">{act.narrativePurpose}</p>
                          </div>
                        </button>

                        {/* Chapters */}
                        {isActExpanded && (
                          <div className="bg-white">
                            {actChapters.map((chapter) => (
                              <button
                                key={chapter.id}
                                onClick={() => onChapterSelect(chapter)}
                                className={`w-full px-12 py-2 flex items-center gap-2 hover:bg-blue-50 transition-colors ${
                                  chapter.id === currentChapterId ? 'bg-blue-100' : ''
                                }`}
                              >
                                <FileText className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                <div className="flex-1 text-left">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">
                                      Ch {chapter.chapterNumber}
                                    </span>
                                    {chapter.title && (
                                      <span className="text-xs text-gray-600">{chapter.title}</span>
                                    )}
                                  </div>
                                  {chapter.wordCount > 0 && (
                                    <span className="text-xs text-gray-400">
                                      {chapter.wordCount} words
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}

                            {/* Add Chapter Button */}
                            <button
                              onClick={() => onGenerateChapter(act.id, actChapters.length + 1)}
                              className="w-full px-12 py-2 flex items-center gap-2 hover:bg-green-50 transition-colors text-green-600"
                            >
                              <Plus className="h-3 w-3 flex-shrink-0" />
                              <span className="text-xs font-medium">Generate Next Chapter</span>
                            </button>
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
  );
}
