'use client';

import { Volume, Act, VolumeMemory, ActMemory } from '@/lib/types';
import { BookOpen, Zap, TrendingUp, AlertCircle } from 'lucide-react';

interface VolumeActContextProps {
  volume: Volume;
  act: Act;
  volumeMemory?: VolumeMemory;
  actMemory?: ActMemory;
}

export default function VolumeActContext({
  volume,
  act,
  volumeMemory,
  actMemory,
}: VolumeActContextProps) {
  const getPressureColor = (pressure: number) => {
    if (pressure <= 3) return 'text-green-600';
    if (pressure <= 6) return 'text-yellow-600';
    if (pressure <= 8) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPressureBar = (pressure: number) => {
    const percentage = (pressure / 10) * 100;
    let color = 'bg-green-500';
    if (pressure > 6) color = 'bg-yellow-500';
    if (pressure > 8) color = 'bg-red-500';
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Volume Context */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-sm">Volume {volume.volumeNumber}: {volume.title}</h3>
        </div>
        
        {volume.theme && (
          <div className="mb-2">
            <span className="text-xs font-medium text-gray-600">Theme:</span>
            <p className="text-sm text-gray-900">{volume.theme}</p>
          </div>
        )}

        {volume.emotionalPromise && (
          <div className="mb-2">
            <span className="text-xs font-medium text-gray-600">Emotional Promise:</span>
            <p className="text-sm text-gray-900">{volume.emotionalPromise}</p>
          </div>
        )}

        {volume.relationshipStateStart && volume.relationshipStateEnd && (
          <div className="mb-2">
            <span className="text-xs font-medium text-gray-600">Relationship Arc:</span>
            <p className="text-sm text-gray-900">
              {volume.relationshipStateStart} → {volume.relationshipStateEnd}
            </p>
          </div>
        )}

        {volumeMemory && volumeMemory.unresolvedArcs.length > 0 && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex items-center gap-1 mb-1">
              <AlertCircle className="h-3 w-3 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-900">Unresolved Arcs:</span>
            </div>
            <ul className="text-xs text-yellow-800 space-y-0.5">
              {volumeMemory.unresolvedArcs.slice(0, 3).map((arc, i) => (
                <li key={i}>• {arc}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Act Context */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-orange-600" />
          <h3 className="font-semibold text-sm">Act {act.actNumber}: {act.narrativePurpose}</h3>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">Emotional Pressure:</span>
              <span className={`text-xs font-bold ${getPressureColor(act.emotionalPressure)}`}>
                {act.emotionalPressure}/10
              </span>
            </div>
            {getPressureBar(act.emotionalPressure)}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-gray-50 rounded">
              <span className="text-xs font-medium text-gray-600">Pacing:</span>
              <p className="text-sm font-medium text-gray-900 capitalize">{act.pacing}</p>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <span className="text-xs font-medium text-gray-600">Purpose:</span>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {act.narrativePurpose.replace('-', ' ')}
              </p>
            </div>
          </div>

          {act.characterDevelopmentFocus && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-900">Character Focus:</span>
              </div>
              <p className="text-xs text-blue-800">{act.characterDevelopmentFocus}</p>
            </div>
          )}

          {actMemory && actMemory.activeConflicts.length > 0 && (
            <div className="p-2 bg-red-50 border border-red-200 rounded">
              <span className="text-xs font-medium text-red-900">Active Conflicts:</span>
              <ul className="text-xs text-red-800 space-y-0.5 mt-1">
                {actMemory.activeConflicts.slice(0, 3).map((conflict, i) => (
                  <li key={i}>• {conflict}</li>
                ))}
              </ul>
            </div>
          )}

          {actMemory && actMemory.misunderstandings.length > 0 && (
            <div className="p-2 bg-purple-50 border border-purple-200 rounded">
              <span className="text-xs font-medium text-purple-900">Misunderstandings:</span>
              <ul className="text-xs text-purple-800 space-y-0.5 mt-1">
                {actMemory.misunderstandings.slice(0, 2).map((misunderstanding, i) => (
                  <li key={i}>• {misunderstanding}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
