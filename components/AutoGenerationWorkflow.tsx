'use client';

import { useState } from 'react';
import { Wand2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface AutoGenerationWorkflowProps {
  bookId: string;
  storyBibleId?: string;
  onComplete: () => void;
}

export default function AutoGenerationWorkflow({
  bookId,
  storyBibleId,
  onComplete,
}: AutoGenerationWorkflowProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [progress, setProgress] = useState<{
    volumeCount: number;
    actCount: number;
    chapterCount: number;
  }>({ volumeCount: 0, actCount: 0, chapterCount: 0 });
  const [error, setError] = useState<string>('');
  const [completed, setCompleted] = useState(false);

  const [config, setConfig] = useState({
    volumeCount: 3,
    chaptersPerVolume: 20,
    actsPerVolume: 5,
    autoGenerateChapters: false,
  });

  const startAutoGeneration = async () => {
    if (!storyBibleId) {
      setError('Story Bible is required. Generate one first.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setCurrentStep('Generating volume outline...');

    try {
      // Step 1: Generate volume/act outline
      const outlineRes = await fetch('/api/generate-volume-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyBible: { id: storyBibleId },
          volumeCount: config.volumeCount,
          chaptersPerVolume: config.chaptersPerVolume,
        }),
      });

      if (!outlineRes.ok) throw new Error('Failed to generate outline');
      const outlineData = await outlineRes.json();
      const volumeOutline = outlineData.volumeOutline;

      // Step 2: Create volumes and acts
      setCurrentStep('Creating volumes and acts...');
      
      for (const volumeData of volumeOutline.volumes) {
        // Create volume
        const volumeRes = await fetch(`/api/books/${bookId}/volumes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            volumeNumber: volumeData.volumeNumber,
            title: volumeData.title,
            theme: volumeData.theme,
            emotionalPromise: volumeData.emotionalPromise,
            relationshipStateStart: volumeData.relationshipStateStart,
            relationshipStateEnd: volumeData.relationshipStateEnd,
            majorTurningPoint: volumeData.majorTurningPoint,
            targetChapterCount: config.chaptersPerVolume,
          }),
        });

        if (!volumeRes.ok) throw new Error(`Failed to create volume ${volumeData.volumeNumber}`);
        const { volume } = await volumeRes.json();

        setProgress(prev => ({ ...prev, volumeCount: prev.volumeCount + 1 }));

        // Create acts for this volume
        for (const actData of volumeData.acts) {
          const actRes = await fetch(`/api/books/${bookId}/volumes/${volume.id}/acts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              actNumber: actData.actNumber,
              title: actData.title,
              narrativePurpose: actData.narrativePurpose,
              pacing: actData.pacing,
              emotionalPressure: actData.emotionalPressure,
              characterDevelopmentFocus: actData.characterDevelopmentFocus,
              targetChapterCount: actData.targetChapterCount,
            }),
          });

          if (!actRes.ok) throw new Error(`Failed to create act ${actData.actNumber}`);
          const { act } = await actRes.json();

          setProgress(prev => ({ ...prev, actCount: prev.actCount + 1 }));

          // Optionally generate chapters
          if (config.autoGenerateChapters && actData.chapterBeats) {
            setCurrentStep(`Generating chapters for Act ${actData.actNumber}...`);
            
            for (let i = 0; i < actData.chapterBeats.length; i++) {
              const beat = actData.chapterBeats[i];
              
              const chapterRes = await fetch('/api/generate-chapter-v2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  bookId,
                  volumeId: volume.id,
                  actId: act.id,
                  chapterNumber: beat.chapterNumber,
                  globalChapterNumber: progress.chapterCount + i + 1,
                  emotionalBeat: beat.emotionalBeat,
                  relationshipShift: beat.relationshipShift,
                  sceneGoal: beat.sceneGoal,
                  previousChapters: [],
                }),
              });

              if (chapterRes.ok) {
                setProgress(prev => ({ ...prev, chapterCount: prev.chapterCount + 1 }));
              }
            }
          }
        }
      }

      setCurrentStep('Complete!');
      setCompleted(true);
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (err: any) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Wand2 className="h-5 w-5 text-purple-600" />
        <h3 className="font-semibold text-lg">Auto-Generation Workflow</h3>
      </div>

      {!isGenerating && !completed && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Volumes
            </label>
            <input
              type="number"
              value={config.volumeCount}
              onChange={(e) => setConfig({ ...config, volumeCount: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min={1}
              max={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chapters per Volume
            </label>
            <input
              type="number"
              value={config.chaptersPerVolume}
              onChange={(e) => setConfig({ ...config, chaptersPerVolume: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min={5}
              max={50}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoGenerateChapters"
              checked={config.autoGenerateChapters}
              onChange={(e) => setConfig({ ...config, autoGenerateChapters: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="autoGenerateChapters" className="text-sm text-gray-700">
              Auto-generate all chapters (may take a long time)
            </label>
          </div>

          <button
            onClick={startAutoGeneration}
            disabled={!storyBibleId}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Start Auto-Generation
          </button>

          {!storyBibleId && (
            <p className="text-sm text-amber-600">
              ⚠️ Generate a Story Bible first before using auto-generation
            </p>
          )}
        </div>
      )}

      {isGenerating && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            <span className="text-sm font-medium">{currentStep}</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Volumes Created:</span>
              <span className="font-medium">{progress.volumeCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Acts Created:</span>
              <span className="font-medium">{progress.actCount}</span>
            </div>
            {config.autoGenerateChapters && (
              <div className="flex justify-between text-sm">
                <span>Chapters Generated:</span>
                <span className="font-medium">{progress.chapterCount}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {completed && (
        <div className="flex items-center gap-3 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Auto-generation complete!</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}
