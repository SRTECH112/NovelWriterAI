'use client';

import { Volume } from '@/lib/types';
import { ChevronDown, Plus, BookOpen } from 'lucide-react';
import { useState } from 'react';

interface VolumeSelectorProps {
  volumes: Volume[];
  currentVolumeId: string | null;
  onVolumeSelect: (volumeId: string) => void;
  onCreateVolume: () => void;
}

export default function VolumeSelector({
  volumes,
  currentVolumeId,
  onVolumeSelect,
  onCreateVolume,
}: VolumeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentVolume = volumes.find(v => v.id === currentVolumeId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in-progress': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <BookOpen className="h-5 w-5 text-gray-600" />
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium">
            {currentVolume ? `Volume ${currentVolume.volumeNumber}` : 'Select Volume'}
          </span>
          {currentVolume && (
            <span className="text-xs text-gray-500">{currentVolume.title}</span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="max-h-96 overflow-y-auto">
            {volumes.map((volume) => (
              <button
                key={volume.id}
                onClick={() => {
                  onVolumeSelect(volume.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                  volume.id === currentVolumeId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">Volume {volume.volumeNumber}</span>
                      <span className={`text-xs ${getStatusColor(volume.status)}`}>
                        {volume.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 mt-1">{volume.title}</p>
                    {volume.theme && (
                      <p className="text-xs text-gray-500 mt-1">Theme: {volume.theme}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              onCreateVolume();
              setIsOpen(false);
            }}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-t border-gray-200 flex items-center gap-2 text-blue-600"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Create New Volume</span>
          </button>
        </div>
      )}
    </div>
  );
}
