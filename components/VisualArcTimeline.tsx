'use client';

import { Volume, Act, Chapter } from '@/lib/types';
import { TrendingUp, Circle } from 'lucide-react';

interface VisualArcTimelineProps {
  volumes: Volume[];
  acts: Record<string, Act[]>; // volumeId -> acts
  chapters: Record<string, Chapter[]>; // actId -> chapters
  currentChapterId?: string | null;
  onChapterClick?: (chapter: Chapter) => void;
}

export default function VisualArcTimeline({
  volumes,
  acts,
  chapters,
  currentChapterId,
  onChapterClick,
}: VisualArcTimelineProps) {
  const getPurposeColor = (purpose: string) => {
    switch (purpose) {
      case 'setup': return '#3b82f6';
      case 'rising-tension': return '#eab308';
      case 'fracture': return '#f97316';
      case 'crisis': return '#ef4444';
      case 'resolution': return '#22c55e';
      case 'payoff': return '#a855f7';
      default: return '#6b7280';
    }
  };

  const getPressureHeight = (pressure: number) => {
    return `${(pressure / 10) * 100}%`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5 text-gray-600" />
        <h3 className="font-semibold text-lg">Emotional Arc Timeline</h3>
      </div>

      <div className="space-y-8">
        {volumes.map((volume) => {
          const volumeActs = acts[volume.id] || [];
          
          return (
            <div key={volume.id} className="border-l-4 border-blue-500 pl-4">
              {/* Volume Header */}
              <div className="mb-4">
                <h4 className="font-semibold text-base">
                  Volume {volume.volumeNumber}: {volume.title}
                </h4>
                {volume.theme && (
                  <p className="text-sm text-gray-600 mt-1">{volume.theme}</p>
                )}
              </div>

              {/* Acts Timeline */}
              <div className="space-y-4">
                {volumeActs.map((act, actIndex) => {
                  const actChapters = chapters[act.id] || [];
                  const color = getPurposeColor(act.narrativePurpose);

                  return (
                    <div key={act.id} className="relative">
                      {/* Act Bar */}
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-2 h-16 rounded"
                          style={{ 
                            backgroundColor: color,
                            height: getPressureHeight(act.emotionalPressure)
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              Act {act.actNumber}
                            </span>
                            <span 
                              className="text-xs px-2 py-0.5 rounded"
                              style={{ 
                                backgroundColor: `${color}20`,
                                color: color
                              }}
                            >
                              {act.narrativePurpose}
                            </span>
                            <span className="text-xs text-gray-500">
                              Pressure: {act.emotionalPressure}/10
                            </span>
                          </div>
                          {act.title && (
                            <p className="text-xs text-gray-600 mt-1">{act.title}</p>
                          )}
                        </div>
                      </div>

                      {/* Chapters */}
                      <div className="ml-5 flex gap-1 flex-wrap">
                        {actChapters.map((chapter) => (
                          <button
                            key={chapter.id}
                            onClick={() => onChapterClick?.(chapter)}
                            className={`relative group ${
                              chapter.id === currentChapterId
                                ? 'ring-2 ring-blue-500'
                                : ''
                            }`}
                            title={`Chapter ${chapter.chapterNumber}${chapter.title ? `: ${chapter.title}` : ''}`}
                          >
                            <Circle
                              className="h-3 w-3"
                              fill={color}
                              stroke={color}
                            />
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                              <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                Ch {chapter.chapterNumber}
                                {chapter.emotionalBeat && `: ${chapter.emotionalBeat}`}
                              </div>
                            </div>
                          </button>
                        ))}
                        {actChapters.length === 0 && (
                          <span className="text-xs text-gray-400 italic">No chapters yet</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-600 mb-2">Act Purposes:</p>
        <div className="flex flex-wrap gap-2">
          {[
            { purpose: 'setup', label: 'Setup' },
            { purpose: 'rising-tension', label: 'Rising Tension' },
            { purpose: 'fracture', label: 'Fracture' },
            { purpose: 'crisis', label: 'Crisis' },
            { purpose: 'resolution', label: 'Resolution' },
            { purpose: 'payoff', label: 'Payoff' },
          ].map(({ purpose, label }) => (
            <div key={purpose} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: getPurposeColor(purpose) }}
              />
              <span className="text-xs text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
