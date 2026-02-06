'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface CreateVolumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (volumeData: {
    volumeNumber: number;
    title: string;
    theme?: string;
    emotionalPromise?: string;
    relationshipStateStart?: string;
    relationshipStateEnd?: string;
    majorTurningPoint?: string;
    targetChapterCount?: number;
  }) => void;
  nextVolumeNumber: number;
}

export default function CreateVolumeModal({
  isOpen,
  onClose,
  onSubmit,
  nextVolumeNumber,
}: CreateVolumeModalProps) {
  const [formData, setFormData] = useState({
    volumeNumber: nextVolumeNumber,
    title: '',
    theme: '',
    emotionalPromise: '',
    relationshipStateStart: '',
    relationshipStateEnd: '',
    majorTurningPoint: '',
    targetChapterCount: 20,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      theme: formData.theme || undefined,
      emotionalPromise: formData.emotionalPromise || undefined,
      relationshipStateStart: formData.relationshipStateStart || undefined,
      relationshipStateEnd: formData.relationshipStateEnd || undefined,
      majorTurningPoint: formData.majorTurningPoint || undefined,
      targetChapterCount: formData.targetChapterCount || 20,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Create New Volume</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Volume Number
            </label>
            <input
              type="number"
              value={formData.volumeNumber}
              onChange={(e) => setFormData({ ...formData, volumeNumber: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., First Encounter"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Theme
            </label>
            <input
              type="text"
              value={formData.theme}
              onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              placeholder="e.g., Enemies to Awareness"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Core theme of this volume</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emotional Promise
            </label>
            <textarea
              value={formData.emotionalPromise}
              onChange={(e) => setFormData({ ...formData, emotionalPromise: e.target.value })}
              placeholder="e.g., From rivalry to reluctant respect"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">What emotional payoff this volume delivers</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship State (Start)
              </label>
              <input
                type="text"
                value={formData.relationshipStateStart}
                onChange={(e) => setFormData({ ...formData, relationshipStateStart: e.target.value })}
                placeholder="e.g., Hostile rivals"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship State (End)
              </label>
              <input
                type="text"
                value={formData.relationshipStateEnd}
                onChange={(e) => setFormData({ ...formData, relationshipStateEnd: e.target.value })}
                placeholder="e.g., Grudging allies"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Major Turning Point
            </label>
            <textarea
              value={formData.majorTurningPoint}
              onChange={(e) => setFormData({ ...formData, majorTurningPoint: e.target.value })}
              placeholder="e.g., Forced to work together on crucial project"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">Key event that defines this volume</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Chapter Count
            </label>
            <input
              type="number"
              value={formData.targetChapterCount}
              onChange={(e) => setFormData({ ...formData, targetChapterCount: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min={1}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Volume
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
