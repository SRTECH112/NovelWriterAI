'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Volume, Chapter, Page, StoryBible, VolumeMemory } from '@/lib/types';
import PremiumStudioEditor from '@/components/PremiumStudioEditor';
import { Loader2 } from 'lucide-react';

export default function PremiumEditorPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const bookId = params.bookId as string;

  const [bookTitle, setBookTitle] = useState<string>('Untitled Novel');
  const [storyBible, setStoryBible] = useState<StoryBible | null>(null);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [currentVolumeId, setCurrentVolumeId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Record<string, Chapter[]>>({});
  const [pages, setPages] = useState<Record<string, Page[]>>({});
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [volumeMemory, setVolumeMemory] = useState<VolumeMemory | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

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

  const loadBookData = async () => {
    try {
      const [bookRes, bibleRes, volumesRes] = await Promise.all([
        fetch(`/api/books/${bookId}`),
        fetch(`/api/books/${bookId}/story-bible`),
        fetch(`/api/books/${bookId}/volumes`)
      ]);

      if (bookRes.ok) {
        const bookData = await bookRes.json();
        setBookTitle(bookData.book?.title || 'Untitled Novel');
      }

      if (bibleRes.ok) {
        const bibleData = await bibleRes.json();
        setStoryBible(bibleData.storyBible);
      }

      if (volumesRes.ok) {
        const volumesData = await volumesRes.json();
        setVolumes(volumesData.volumes || []);
        
        if (volumesData.volumes && volumesData.volumes.length > 0) {
          setCurrentVolumeId(volumesData.volumes[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading book data:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadVolume = async (volumeId: string) => {
    try {
      const [chaptersRes, memoryRes] = await Promise.all([
        fetch(`/api/volumes/${volumeId}/chapters`),
        fetch(`/api/volumes/${volumeId}/memory`)
      ]);

      if (chaptersRes.ok) {
        const chaptersData = await chaptersRes.json();
        const volumeChapters = chaptersData.chapters || [];
        
        setChapters(prev => ({
          ...prev,
          [volumeId]: volumeChapters
        }));

        if (volumeChapters.length > 0) {
          const allPagesPromises = volumeChapters.map((chapter: Chapter) =>
            fetch(`/api/chapters/${chapter.id}/pages`).then(res => res.json())
          );

          const allPagesResults = await Promise.all(allPagesPromises);
          
          const newPages: Record<string, Page[]> = {};
          volumeChapters.forEach((chapter: Chapter, index: number) => {
            if (allPagesResults[index].pages) {
              newPages[chapter.id] = allPagesResults[index].pages;
            }
          });

          setPages(prev => ({ ...prev, ...newPages }));

          if (!currentChapter) {
            setCurrentChapter(volumeChapters[0]);
            const firstChapterPages = newPages[volumeChapters[0].id] || [];
            if (firstChapterPages.length > 0) {
              setCurrentPage(firstChapterPages[0]);
            }
          }
        }
      }

      if (memoryRes.ok) {
        const memoryData = await memoryRes.json();
        setVolumeMemory(memoryData.memory);
      }
    } catch (err) {
      console.error('Error loading volume:', err);
    }
  };

  const handleChapterSelect = (chapter: Chapter) => {
    setCurrentChapter(chapter);
    const chapterPages = pages[chapter.id] || [];
    if (chapterPages.length > 0) {
      setCurrentPage(chapterPages[0]);
    } else {
      setCurrentPage(null);
    }
  };

  const handlePageSelect = (page: Page) => {
    setCurrentPage(page);
  };

  const handleRemovePage = async (pageId: string, chapterId: string) => {
    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete page');
      }

      // Remove page from state
      setPages(prev => ({
        ...prev,
        [chapterId]: (prev[chapterId] || []).filter(p => p.id !== pageId)
      }));

      // Update chapter stats
      const remainingPages = (pages[chapterId] || []).filter(p => p.id !== pageId);
      const newWordCount = remainingPages.reduce((sum, p) => sum + p.wordCount, 0);
      const newPageCount = remainingPages.length;

      setChapters(prev => ({
        ...prev,
        [currentChapter?.volumeId || '']: (prev[currentChapter?.volumeId || ''] || []).map(c =>
          c.id === chapterId
            ? { ...c, currentPageCount: newPageCount, wordCount: newWordCount }
            : c
        )
      }));

      if (currentChapter?.id === chapterId) {
        setCurrentChapter(prev => prev ? {
          ...prev,
          currentPageCount: newPageCount,
          wordCount: newWordCount
        } : null);
      }

      // If deleted page was current, select another page
      if (currentPage?.id === pageId) {
        if (remainingPages.length > 0) {
          setCurrentPage(remainingPages[remainingPages.length - 1]);
        } else {
          setCurrentPage(null);
        }
      }
    } catch (err: any) {
      console.error('Error removing page:', err);
      alert('Failed to remove page: ' + err.message);
    }
  };

  const handleGeneratePage = async (chapterId: string, pageNumber: number) => {
    setLoading(true);

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

      setPages(prev => ({
        ...prev,
        [chapterId]: [...(prev[chapterId] || []), result.page].sort((a, b) => a.pageNumber - b.pageNumber)
      }));

      setCurrentPage(result.page);

      if (currentChapter?.id === chapterId) {
        const updatedChapter = {
          ...currentChapter,
          currentPageCount: result.chapterProgress.currentPageCount,
          wordCount: result.chapterProgress.totalWordCount,
        };

        setCurrentChapter(updatedChapter as Chapter);

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
      }
    } catch (err: any) {
      console.error('Error generating page:', err);
      alert('Failed to generate page: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="studio-background" />
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  const currentVolume = volumes.find(v => v.id === currentVolumeId);

  return (
    <PremiumStudioEditor
      volumes={volumes}
      chapters={chapters}
      pages={pages}
      currentChapter={currentChapter}
      currentPage={currentPage}
      bookTitle={bookTitle}
      loading={loading}
      onChapterSelect={handleChapterSelect}
      onPageSelect={handlePageSelect}
      onGeneratePage={handleGeneratePage}
      onRemovePage={handleRemovePage}
      volumeOutline={currentVolume?.outline}
      chapterOutline={currentChapter?.outline}
    />
  );
}
