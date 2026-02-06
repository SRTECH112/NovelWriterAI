import { NextRequest, NextResponse } from 'next/server';
import { generateChapter, checkCanonCompliance } from '@/lib/ai-service';
import { StoryBible, Outline, Chapter } from '@/lib/types';
import { requireAuth } from '@/lib/auth';
import { saveChapter } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { storyBible, outline, chapterNumber, previousChapters, bookId } = body;

    if (!storyBible || !outline || chapterNumber === undefined) {
      return NextResponse.json(
        { error: 'Story Bible, Outline, and chapter number are required' },
        { status: 400 }
      );
    }

    // Story Bible is automatically locked when approved in the workflow
    // No need to check lock status

    const result = await generateChapter(
      storyBible as StoryBible,
      outline as Outline,
      chapterNumber,
      (previousChapters || []) as Chapter[]
    );

    const canonCheck = await checkCanonCompliance(result.content, storyBible as StoryBible);

    const chapter: Chapter = {
      id: `chapter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      outlineId: outline.id,
      number: chapterNumber,
      content: result.content,
      summary: result.summary,
      stateDelta: result.stateDelta,
      canonWarnings: canonCheck.passed ? [] : canonCheck.violations,
      proseQuality: {
        score: result.proseValidation.score,
        issues: result.proseValidation.issues,
        warnings: result.proseValidation.warnings,
      },
      createdAt: new Date().toISOString(),
      regenerationCount: 0,
    };

    // Save to database if bookId provided
    if (bookId) {
      await saveChapter(bookId, chapter);
    }

    return NextResponse.json({
      chapter,
      canonCheck,
      proseValidation: result.proseValidation,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error generating Chapter:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate Chapter' },
      { status: 500 }
    );
  }
}
