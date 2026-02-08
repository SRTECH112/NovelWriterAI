'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Plus, Loader2, AlertTriangle, BookOpen, Zap } from 'lucide-react';
import VolumeSelector from '@/components/VolumeSelector';
import ActNavigator from '@/components/ActNavigator';
import VolumeActChapterList from '@/components/VolumeActChapterList';
import VolumeActContext from '@/components/VolumeActContext';
import CreateVolumeModal from '@/components/CreateVolumeModal';
import CreateActModal from '@/components/CreateActModal';
import { Volume, Act, Chapter, StoryBible, VolumeMemory, ActMemory } from '@/lib/types';

export default function EditorV2Page() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const bookId = params.bookId as string;

  const [storyBible, setStoryBible] = useState<StoryBible | null>(null);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [currentVolumeId, setCurrentVolumeId] = useState<string | null>(null);
  const [acts, setActs] = useState<Act[]>([]);
  const [currentActId, setCurrentActId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Record<string, Chapter[]>>({});
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [volumeMemory, setVolumeMemory] = useState<VolumeMemory | null>(null);
  const [actMemory, setActMemory] = useState<ActMemory | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateVolume, setShowCreateVolume] = useState(false);
  const [showCreateAct, setShowCreateAct] = useState(false);
  const [volumeOutlineBuffer, setVolumeOutlineBuffer] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      loadBookData();
    }
  }, [status, bookId]);

  useEffect(() => {
    if (currentVolumeId) {
      loadVolume(currentVolumeId);
    }
  }, [currentVolumeId]);

  useEffect(() => {
    if (currentActId) {
      loadAct(currentActId);
    }
  }, [currentActId]);

  const loadBookData = async () => {
    try {
      // Load Story Bible
      const bibleRes = await fetch(`/api/books/${bookId}/bible`);
      if (bibleRes.ok) {
        const bibleData = await bibleRes.json();
        setStoryBible(bibleData.storyBible);
      }

      // Load Volumes (should already exist from auto-generation)
      const volumesRes = await fetch(`/api/books/${bookId}/volumes`);
      if (volumesRes.ok) {
        const volumesData = await volumesRes.json();
        setVolumes(volumesData.volumes);
        if (volumesData.volumes.length > 0) {
          setCurrentVolumeId(volumesData.volumes[0].id);
        } else {
          setError('No volumes found. Story structure may not have been generated properly.');
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadVolume = async (volumeId: string) => {
    try {
      // Load Acts
      const actsRes = await fetch(`/api/books/${bookId}/volumes/${volumeId}/acts`);
      if (actsRes.ok) {
        const actsData = await actsRes.json();
        setActs(actsData.acts);
        if (actsData.acts.length > 0) {
          setCurrentActId(actsData.acts[0].id);
        }
      }

      // Load Volume Memory
      const memoryRes = await fetch(`/api/books/${bookId}/volumes/${volumeId}/memory`);
      if (memoryRes.ok) {
        const memoryData = await memoryRes.json();
        setVolumeMemory(memoryData.memory);
      }
    } catch (err: any) {
      console.error('Error loading volume:', err);
    }
  };

  const loadAct = async (actId: string) => {
    try {
      // Load Chapters for this act
      const chaptersRes = await fetch(`/api/books/${bookId}/acts/${actId}/chapters`);
      if (chaptersRes.ok) {
        const chaptersData = await chaptersRes.json();
        setChapters(prev => ({ ...prev, [actId]: chaptersData.chapters }));
      }

      // Load Act Memory
      const memoryRes = await fetch(`/api/books/${bookId}/acts/${actId}/memory`);
      if (memoryRes.ok) {
        const memoryData = await memoryRes.json();
        setActMemory(memoryData.memory);
      }
    } catch (err: any) {
      console.error('Error loading act:', err);
    }
  };

  const handleCreateVolume = async (volumeData: any) => {
    try {
      const res = await fetch(`/api/books/${bookId}/volumes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(volumeData),
      });

      if (!res.ok) throw new Error('Failed to create volume');

      const data = await res.json();
      setVolumes([...volumes, data.volume]);
      setCurrentVolumeId(data.volume.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateAct = async (actData: any) => {
    if (!currentVolumeId) return;

    try {
      const res = await fetch(`/api/books/${bookId}/volumes/${currentVolumeId}/acts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actData),
      });

      if (!res.ok) throw new Error('Failed to create act');

      const data = await res.json();
      setActs([...acts, data.act]);
      setCurrentActId(data.act.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateVolumeOutline = (volumeId: string, outline: string) => {
    // Update local buffer
    setVolumeOutlineBuffer(prev => ({ ...prev, [volumeId]: outline }));
    
    // Update volumes state optimistically
    setVolumes(prev => prev.map(v => 
      v.id === volumeId ? { ...v, outline } : v
    ));
  };

  const handleSaveVolumeOutline = async (volumeId: string) => {
    const outline = volumeOutlineBuffer[volumeId] || volumes.find(v => v.id === volumeId)?.outline || '';
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/volumes/${volumeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outline }),
      });

      if (!res.ok) {
        throw new Error('Failed to save volume outline');
      }

      // Clear buffer for this volume
      setVolumeOutlineBuffer(prev => {
        const newBuffer = { ...prev };
        delete newBuffer[volumeId];
        return newBuffer;
      });

      alert('Volume outline saved successfully!');
    } catch (err: any) {
      setError(err.message);
      alert('Failed to save outline: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateChapterContent = async (chapter: Chapter) => {
    if (!currentVolumeId || !chapter.actId) return;

    // Check if chapter already has content
    const hasContent = chapter.content && chapter.content.trim().length > 100 && !chapter.content.includes('[OUTLINE PLACEHOLDER]');
    
    if (hasContent) {
      const confirmed = window.confirm(
        'This chapter already has content. Do you want to regenerate it?\n\n' +
        'Click OK to overwrite the existing content.\n' +
        'Click Cancel to keep the current content.'
      );
      
      if (!confirmed) return;
    }

    setLoading(true);
    setError('');

    try {
      const actChapters = chapters[chapter.actId] || [];
      const previousChapters = actChapters.filter(c => c.chapterNumber < chapter.chapterNumber);

      const res = await fetch('/api/generate-chapter-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          volumeId: currentVolumeId,
          actId: chapter.actId,
          chapterNumber: chapter.chapterNumber,
          globalChapterNumber: chapter.globalChapterNumber,
          previousChapters,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate chapter');
      }

      const result = await res.json();
      
      // Update chapters in state
      setChapters(prev => ({
        ...prev,
        [chapter.actId]: (prev[chapter.actId] || []).map(c => 
          c.id === chapter.id ? result.chapter : c
        ),
      }));
      
      setCurrentChapter(result.chapter);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateChapter = async (actId: string, chapterNumber: number) => {
    if (!currentVolumeId || !storyBible) return;

    setLoading(true);
    setError('');

    try {
      const actChapters = chapters[actId] || [];
      const globalChapterNumber = Object.values(chapters).flat().length + 1;

      const res = await fetch('/api/generate-chapter-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          volumeId: currentVolumeId,
          actId,
          chapterNumber,
          globalChapterNumber,
          previousChapters: actChapters,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate chapter');
      }

      const result = await res.json();
      
      // Update chapters
      setChapters(prev => ({
        ...prev,
        [actId]: [...(prev[actId] || []), result.chapter],
      }));
      
      setCurrentChapter(result.chapter);

      // Auto-update memory
      await updateMemoryAfterChapter(result.chapter);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateMemoryAfterChapter = async (chapter: Chapter) => {
    // Auto-update act memory with new conflicts and emotional state
    if (currentActId && chapter.stateDelta) {
      const newConflicts = chapter.stateDelta.plotProgression || [];
      const newTension = actMemory ? Math.min(actMemory.currentTensionLevel + 1, 10) : 5;

      try {
        await fetch(`/api/books/${bookId}/acts/${currentActId}/memory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentTensionLevel: newTension,
            emotionalDirection: chapter.stateDelta.emotionalState,
            activeConflicts: [...(actMemory?.activeConflicts || []), ...newConflicts],
            proximityEvents: actMemory?.proximityEvents || [],
            misunderstandings: actMemory?.misunderstandings || [],
          }),
        });

        // Reload act memory
        if (currentActId) {
          loadAct(currentActId);
        }
      } catch (err) {
        console.error('Failed to update act memory:', err);
      }
    }

    // Auto-update volume memory with unresolved threads
    if (currentVolumeId && chapter.stateDelta?.unresolvedThreads) {
      try {
        await fetch(`/api/books/${bookId}/volumes/${currentVolumeId}/memory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            unresolvedArcs: [...(volumeMemory?.unresolvedArcs || []), ...(chapter.stateDelta.unresolvedThreads || [])],
            characterProgression: volumeMemory?.characterProgression || {},
            thematicThreads: volumeMemory?.thematicThreads || [],
            promisesMade: volumeMemory?.promisesMade || [],
            promisesFulfilled: volumeMemory?.promisesFulfilled || [],
          }),
        });

        // Reload volume memory
        if (currentVolumeId) {
          loadVolume(currentVolumeId);
        }
      } catch (err) {
        console.error('Failed to update volume memory:', err);
      }
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const currentVolume = volumes.find(v => v.id === currentVolumeId);
  const currentAct = acts.find(a => a.id === currentActId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-sm hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
            <div className="border-l pl-4">
              <VolumeSelector
                volumes={volumes}
                currentVolumeId={currentVolumeId}
                onVolumeSelect={setCurrentVolumeId}
                onCreateVolume={() => setShowCreateVolume(true)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateAct(true)}
              disabled={!currentVolumeId}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              title="Add additional act (structure is auto-generated)"
            >
              <Plus className="h-4 w-4" />
              Add Act
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="container mx-auto px-4 pt-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR - Chapter List */}
        <div className="w-80 border-r bg-card overflow-y-auto">
          <VolumeActChapterList
            volumes={volumes}
            acts={volumes.reduce((acc, vol) => {
              acc[vol.id] = acts.filter(a => a.volumeId === vol.id);
              return acc;
            }, {} as Record<string, Act[]>)}
            chapters={chapters}
            currentChapterId={currentChapter?.id || null}
            onChapterSelect={setCurrentChapter}
            onGenerateChapter={handleGenerateChapter}
          />
        </div>

        {/* CENTER - Chapter Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentChapter ? (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-2">
                    Chapter {currentChapter.chapterNumber}
                    {currentChapter.title && `: ${currentChapter.title}`}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{currentChapter.wordCount} words</span>
                    {currentChapter.emotionalBeat && (
                      <>
                        <span>•</span>
                        <span>{currentChapter.emotionalBeat}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleGenerateChapterContent(currentChapter)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Generate chapter content using AI"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Generate Chapter
                    </>
                  )}
                </button>
              </div>

              <div className="prose prose-lg max-w-none">
                {currentChapter.content.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>

              {currentChapter.summary && (
                <div className="mt-8 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-sm">{currentChapter.summary}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a chapter to view its content</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR - Context & Memory */}
        <div className="w-96 border-l bg-card overflow-y-auto p-4 space-y-4">
          {currentVolume && currentAct ? (
            <>
              {/* Volume Outline Input */}
              <div className="border rounded-lg p-4 bg-background">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Volume Outline (Binding)
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Define chapter-by-chapter beats for this volume. AI will strictly follow this outline.
                </p>
                <textarea
                  value={currentVolume.outline || ''}
                  onChange={(e) => handleUpdateVolumeOutline(currentVolume.id, e.target.value)}
                  placeholder={`Example:\nChapter 1: Kate meets Marvin at school\n- First glimpse in hallway\n- Overhears whispers about him\n- Feels curious\n\nChapter 2: Adrian confronts Kate\n- Jealousy surfaces\n- Tense conversation\n- Kate confused about feelings`}
                  className="w-full h-64 p-3 text-sm border rounded-md resize-none font-mono"
                  disabled={loading}
                />
                <button
                  onClick={() => handleSaveVolumeOutline(currentVolume.id)}
                  disabled={loading}
                  className="mt-2 w-full px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  Save Outline
                </button>
              </div>

              <VolumeActContext
                volume={currentVolume}
                act={currentAct}
                volumeMemory={volumeMemory || undefined}
                actMemory={actMemory || undefined}
              />

              <ActNavigator
                acts={acts}
                currentActId={currentActId}
                onActSelect={setCurrentActId}
              />
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Create a volume and act to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateVolumeModal
        isOpen={showCreateVolume}
        onClose={() => setShowCreateVolume(false)}
        onSubmit={handleCreateVolume}
        nextVolumeNumber={volumes.length + 1}
      />

      <CreateActModal
        isOpen={showCreateAct}
        onClose={() => setShowCreateAct(false)}
        onSubmit={handleCreateAct}
        nextActNumber={acts.length + 1}
      />
    </div>
  );
}
