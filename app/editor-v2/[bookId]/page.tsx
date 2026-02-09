'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Plus, Loader2, AlertTriangle, BookOpen, Zap } from 'lucide-react';
import VolumeSelector from '@/components/VolumeSelector';
import VolumeChapterPageList from '@/components/VolumeChapterPageList';
import CreateVolumeModal from '@/components/CreateVolumeModal';
import DeleteChapterModal from '@/components/DeleteChapterModal';
import { Volume, Chapter, Page, StoryBible, VolumeMemory } from '@/lib/types';

export default function EditorV2Page() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const bookId = params.bookId as string;

  const [storyBible, setStoryBible] = useState<StoryBible | null>(null);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [currentVolumeId, setCurrentVolumeId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Record<string, Chapter[]>>({});
  const [pages, setPages] = useState<Record<string, Page[]>>({});
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [volumeMemory, setVolumeMemory] = useState<VolumeMemory | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateVolume, setShowCreateVolume] = useState(false);
  const [volumeOutlineBuffer, setVolumeOutlineBuffer] = useState<Record<string, string>>({});
  const [deleteChapterModal, setDeleteChapterModal] = useState<{
    chapterId: string;
    chapterNumber: number;
    chapterTitle: string;
    pageCount: number;
  } | null>(null);

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
    if (currentChapter) {
      loadPages(currentChapter.id);
    }
  }, [currentChapter?.id]);

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
      // Load Chapters (direct children of volume, no acts)
      const chaptersRes = await fetch(`/api/volumes/${volumeId}/chapters`);
      if (chaptersRes.ok) {
        const chaptersData = await chaptersRes.json();
        setChapters(prev => ({ ...prev, [volumeId]: chaptersData.chapters }));
        
        // Load pages for all chapters in this volume
        const loadedPages: Record<string, Page[]> = {};
        for (const chapter of chaptersData.chapters) {
          try {
            const pagesRes = await fetch(`/api/chapters/${chapter.id}/pages`);
            if (pagesRes.ok) {
              const pagesData = await pagesRes.json();
              loadedPages[chapter.id] = pagesData.pages;
            }
          } catch (err) {
            console.error(`Error loading pages for chapter ${chapter.id}:`, err);
            loadedPages[chapter.id] = [];
          }
        }
        setPages(prev => ({ ...prev, ...loadedPages }));
        
        if (chaptersData.chapters.length > 0) {
          setCurrentChapter(chaptersData.chapters[0]);
          // Set first page of first chapter as current if it exists
          if (loadedPages[chaptersData.chapters[0].id]?.length > 0) {
            setCurrentPage(loadedPages[chaptersData.chapters[0].id][0]);
          }
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

  const loadPages = async (chapterId: string) => {
    try {
      const pagesRes = await fetch(`/api/chapters/${chapterId}/pages`);
      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        setPages(prev => ({ ...prev, [chapterId]: pagesData.pages }));
        if (pagesData.pages.length > 0) {
          setCurrentPage(pagesData.pages[0]);
        }
      }
    } catch (err: any) {
      console.error('Error loading pages:', err);
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

  const handleAddChapter = async (volumeId: string) => {
    try {
      const res = await fetch(`/api/volumes/${volumeId}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Chapter ${(chapters[volumeId]?.length || 0) + 1}`,
          targetWordCount: 2750,
          targetPageCount: 4,
        }),
      });

      if (!res.ok) throw new Error('Failed to create chapter');

      const data = await res.json();
      setChapters(prev => ({
        ...prev,
        [volumeId]: [...(prev[volumeId] || []), data.chapter]
      }));
      setCurrentChapter(data.chapter);
    } catch (err: any) {
      setError(err.message);
      alert('Failed to create chapter: ' + err.message);
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

  const handleGeneratePage = async (chapterId: string, pageNumber: number) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/generate-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId, pageNumber }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate page');
      }

      const result = await res.json();
      
      // Update pages in state
      setPages(prev => ({
        ...prev,
        [chapterId]: [...(prev[chapterId] || []).filter(p => p.pageNumber !== pageNumber), result.page]
          .sort((a, b) => a.pageNumber - b.pageNumber)
      }));
      
      // Update chapter progress in both currentChapter and chapters list
      const updatedChapter = {
        ...currentChapter,
        currentPageCount: result.chapterProgress.currentPageCount,
        wordCount: result.chapterProgress.totalWordCount,
      };
      
      setCurrentChapter(updatedChapter as Chapter);
      
      // Update chapters state to reflect the new word count and page count
      if (currentChapter?.volumeId) {
        setChapters(prev => ({
          ...prev,
          [currentChapter.volumeId]: (prev[currentChapter.volumeId] || []).map(c =>
            c.id === chapterId
              ? { ...c, currentPageCount: result.chapterProgress.currentPageCount, wordCount: result.chapterProgress.totalWordCount }
              : c
          )
        }));
      }
      
      setCurrentPage(result.page);
      alert(`Page ${pageNumber} generated successfully! (${result.page.wordCount} words)`);
    } catch (err: any) {
      setError(err.message);
      alert('Failed to generate page: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePage = async (pageId: string, chapterId: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete page');
      }

      const result = await res.json();

      // Remove page from state
      setPages(prev => ({
        ...prev,
        [chapterId]: (prev[chapterId] || []).filter(p => p.id !== pageId)
      }));

      // Update chapter progress
      const updatedChapter = {
        ...currentChapter,
        currentPageCount: result.chapterProgress.currentPageCount,
        wordCount: result.chapterProgress.totalWordCount,
      };

      setCurrentChapter(updatedChapter as Chapter);

      // Update chapters state
      if (currentChapter?.volumeId) {
        setChapters(prev => ({
          ...prev,
          [currentChapter.volumeId]: (prev[currentChapter.volumeId] || []).map(c =>
            c.id === chapterId
              ? { ...c, currentPageCount: result.chapterProgress.currentPageCount, wordCount: result.chapterProgress.totalWordCount }
              : c
          )
        }));
      }

      // Clear current page if it was deleted
      if (currentPage?.id === pageId) {
        setCurrentPage(null);
      }

      alert('Page deleted successfully!');
    } catch (err: any) {
      setError(err.message);
      alert('Failed to delete page: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveChapter = (chapterId: string, chapterNumber: number, chapterTitle: string, pageCount: number) => {
    setDeleteChapterModal({ chapterId, chapterNumber, chapterTitle, pageCount });
  };

  const confirmDeleteChapter = async () => {
    if (!deleteChapterModal) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/chapters/${deleteChapterModal.chapterId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete chapter');
      }

      const result = await res.json();

      // Remove chapter and its pages from state
      if (currentVolumeId) {
        setChapters(prev => ({
          ...prev,
          [currentVolumeId]: (prev[currentVolumeId] || []).filter(c => c.id !== deleteChapterModal.chapterId)
        }));
      }

      setPages(prev => {
        const newPages = { ...prev };
        delete newPages[deleteChapterModal.chapterId];
        return newPages;
      });

      // Navigation safety: if current chapter was deleted, navigate to first available chapter
      if (currentChapter?.id === deleteChapterModal.chapterId) {
        const remainingChapters = currentVolumeId ? chapters[currentVolumeId]?.filter(c => c.id !== deleteChapterModal.chapterId) : [];
        if (remainingChapters && remainingChapters.length > 0) {
          setCurrentChapter(remainingChapters[0]);
          const firstChapterPages = pages[remainingChapters[0].id] || [];
          setCurrentPage(firstChapterPages.length > 0 ? firstChapterPages[0] : null);
        } else {
          setCurrentChapter(null);
          setCurrentPage(null);
        }
      }

      setDeleteChapterModal(null);
      alert(`Chapter ${deleteChapterModal.chapterNumber} deleted successfully! ${result.remainingChapterCount} chapters remaining.`);
    } catch (err: any) {
      setError(err.message);
      alert('Failed to delete chapter: ' + err.message);
    } finally {
      setLoading(false);
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
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </div>
            )}
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
        {/* LEFT SIDEBAR - Volume → Chapter → Page List */}
        <div className="w-80 border-r bg-card overflow-y-auto p-4">
          <VolumeChapterPageList
            volumes={volumes}
            chapters={chapters}
            pages={pages}
            currentChapterId={currentChapter?.id || null}
            currentPageId={currentPage?.id || null}
            onChapterSelect={setCurrentChapter}
            onPageSelect={setCurrentPage}
            onAddChapter={handleAddChapter}
            onGeneratePage={handleGeneratePage}
            onRemovePage={handleRemovePage}
            onRemoveChapter={handleRemoveChapter}
          />
        </div>

        {/* CENTER - Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentPage ? (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-2">
                    Chapter {currentChapter?.chapterNumber}: {currentChapter?.title || 'Untitled'}
                  </h1>
                  <div className="text-lg font-semibold text-primary mb-2">
                    Page {currentPage.pageNumber} of {currentChapter?.targetPageCount}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{currentPage.wordCount} words</span>
                    <span>•</span>
                    <span>Chapter: {currentChapter?.wordCount} / {currentChapter?.targetWordCount} words</span>
                    {currentPage.locked && (
                      <>
                        <span>•</span>
                        <span className="text-yellow-600">🔒 Locked</span>
                      </>
                    )}
                  </div>
                  {currentPage.beatCoverage && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <strong>Beats:</strong> {currentPage.beatCoverage}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleGeneratePage(currentChapter!.id, currentPage.pageNumber)}
                  disabled={loading || currentPage.locked}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={currentPage.locked ? "Page is locked" : "Regenerate this page"}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Regenerate Page
                    </>
                  )}
                </button>
              </div>

              <div className="prose prose-lg max-w-none">
                <div className="whitespace-pre-wrap">{currentPage.content}</div>
              </div>

              {currentPage.narrativeMomentum && (
                <div className="mt-8 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Narrative Momentum</h3>
                  <p className="text-sm">{currentPage.narrativeMomentum}</p>
                </div>
              )}

              {/* Generate Next Page Button */}
              {currentChapter && currentPage.pageNumber < currentChapter.targetPageCount && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => handleGeneratePage(currentChapter.id, currentPage.pageNumber + 1)}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5" />
                        Generate Page {currentPage.pageNumber + 1}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : currentChapter ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No pages generated yet for this chapter</p>
                <button
                  onClick={() => handleGeneratePage(currentChapter.id, 1)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 mx-auto"
                >
                  <Zap className="h-4 w-4" />
                  Generate Page 1
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a chapter to view its pages</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR - Volume Outline & Chapter Outline */}
        <div className="w-96 border-l bg-card overflow-y-auto p-4 space-y-4">
          {currentVolume ? (
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

              {/* Chapter Progress */}
              {currentChapter && (
                <div className="border rounded-lg p-4 bg-background">
                  <h3 className="font-semibold mb-2">Chapter Progress</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Pages:</span>
                      <span className="font-mono">{currentChapter.currentPageCount} / {currentChapter.targetPageCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Words:</span>
                      <span className="font-mono">{currentChapter.wordCount} / {currentChapter.targetWordCount}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.round((currentChapter.currentPageCount / currentChapter.targetPageCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Create a volume to get started</p>
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

      {deleteChapterModal && (
        <DeleteChapterModal
          chapterNumber={deleteChapterModal.chapterNumber}
          chapterTitle={deleteChapterModal.chapterTitle}
          pageCount={deleteChapterModal.pageCount}
          onConfirm={confirmDeleteChapter}
          onCancel={() => setDeleteChapterModal(null)}
        />
      )}
    </div>
  );
}
