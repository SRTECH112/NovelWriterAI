'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface CreateActModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (actData: {
    actNumber: number;
    title?: string;
    narrativePurpose: 'setup' | 'rising-tension' | 'fracture' | 'crisis' | 'resolution' | 'payoff';
    pacing?: 'slow' | 'medium' | 'fast';
    emotionalPressure?: number;
    characterDevelopmentFocus?: string;
    targetChapterCount?: number;
  }) => void;
  nextActNumber: number;
}

export default function CreateActModal({
  isOpen,
  onClose,
  onSubmit,
  nextActNumber,
}: CreateActModalProps) {
  const [formData, setFormData] = useState({
    actNumber: nextActNumber,
    title: '',
    narrativePurpose: 'setup' as const,
    pacing: 'medium' as const,
    emotionalPressure: 5,
    characterDevelopmentFocus: '',
    targetChapterCount: 5,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      title: formData.title || undefined,
      pacing: formData.pacing || 'medium',
      emotionalPressure: formData.emotionalPressure || 5,
      characterDevelopmentFocus: formData.characterDevelopmentFocus || undefined,
      targetChapterCount: formData.targetChapterCount || 5,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Create New Act</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="actNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Act Number
            </label>
            <input
              id="actNumber"
              type="number"
              value={formData.actNumber}
              onChange={(e) => setFormData({ ...formData, actNumber: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label htmlFor="actTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Title (Optional)
            </label>
            <input
              id="actTitle"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., The Meeting"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="narrativePurpose" className="block text-sm font-medium text-gray-700 mb-1">
              Narrative Purpose <span className="text-red-500">*</span>
            </label>
            <select
              id="narrativePurpose"
              value={formData.narrativePurpose}
              onChange={(e) => setFormData({ ...formData, narrativePurpose: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="setup">Setup - Establish dynamics</option>
              <option value="rising-tension">Rising Tension - Build conflict</option>
              <option value="fracture">Fracture - Relationship strain</option>
              <option value="crisis">Crisis - Peak emotional conflict</option>
              <option value="resolution">Resolution - Reconciliation</option>
              <option value="payoff">Payoff - Emotional closure</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Defines the structural goal of this act</p>
          </div>

          <div>
            <label htmlFor="pacing" className="block text-sm font-medium text-gray-700 mb-1">
              Pacing
            </label>
            <select
              id="pacing"
              value={formData.pacing}
              onChange={(e) => setFormData({ ...formData, pacing: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="slow">Slow - Character moments</option>
              <option value="medium">Medium - Balanced</option>
              <option value="fast">Fast - Action/revelation</option>
            </select>
          </div>

          <div>
            <label htmlFor="emotionalPressure" className="block text-sm font-medium text-gray-700 mb-1">
              Emotional Pressure: {formData.emotionalPressure}/10
            </label>
            <input
              id="emotionalPressure"
              type="range"
              min="1"
              max="10"
              value={formData.emotionalPressure}
              onChange={(e) => setFormData({ ...formData, emotionalPressure: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 - Calm</span>
              <span>5 - Moderate</span>
              <span>10 - Crisis</span>
            </div>
          </div>

          <div>
            <label htmlFor="characterFocus" className="block text-sm font-medium text-gray-700 mb-1">
              Character Development Focus
            </label>
            <textarea
              id="characterFocus"
              value={formData.characterDevelopmentFocus}
              onChange={(e) => setFormData({ ...formData, characterDevelopmentFocus: e.target.value })}
              placeholder="e.g., Protagonist learns to trust others"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={2}
            />
          </div>

          <div>
            <label htmlFor="targetChapterCount" className="block text-sm font-medium text-gray-700 mb-1">
              Target Chapter Count
            </label>
            <input
              id="targetChapterCount"
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
              Create Act
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
