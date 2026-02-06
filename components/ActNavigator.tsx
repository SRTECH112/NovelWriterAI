'use client';

import { Act } from '@/lib/types';
import { Zap, ChevronRight } from 'lucide-react';

interface ActNavigatorProps {
  acts: Act[];
  currentActId: string | null;
  onActSelect: (actId: string) => void;
}

export default function ActNavigator({
  acts,
  currentActId,
  onActSelect,
}: ActNavigatorProps) {
  const getPurposeColor = (purpose: string) => {
    switch (purpose) {
      case 'setup': return 'bg-blue-100 text-blue-700';
      case 'rising-tension': return 'bg-yellow-100 text-yellow-700';
      case 'fracture': return 'bg-orange-100 text-orange-700';
      case 'crisis': return 'bg-red-100 text-red-700';
      case 'resolution': return 'bg-green-100 text-green-700';
      case 'payoff': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPacingIcon = (pacing: string) => {
    switch (pacing) {
      case 'slow': return '🐢';
      case 'medium': return '🚶';
      case 'fast': return '🏃';
      default: return '•';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-5 w-5 text-gray-600" />
        <h3 className="font-semibold text-sm text-gray-900">Acts</h3>
      </div>

      <div className="space-y-2">
        {acts.map((act) => (
          <button
            key={act.id}
            onClick={() => onActSelect(act.id)}
            className={`w-full text-left p-3 rounded-lg transition-all ${
              act.id === currentActId
                ? 'bg-blue-50 border-2 border-blue-500'
                : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">Act {act.actNumber}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${getPurposeColor(act.narrativePurpose)}`}>
                    {act.narrativePurpose}
                  </span>
                </div>
                
                {act.title && (
                  <p className="text-sm text-gray-700 mb-2">{act.title}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    {getPacingIcon(act.pacing)} {act.pacing}
                  </span>
                  <span className="flex items-center gap-1">
                    🔥 {act.emotionalPressure}/10
                  </span>
                </div>

                {act.characterDevelopmentFocus && (
                  <p className="text-xs text-gray-500 mt-2 italic">
                    {act.characterDevelopmentFocus}
                  </p>
                )}
              </div>

              {act.id === currentActId && (
                <ChevronRight className="h-5 w-5 text-blue-500 flex-shrink-0" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
