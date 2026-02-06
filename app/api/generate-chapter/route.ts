import { NextRequest, NextResponse } from 'next/server';
import { generateChapter, checkCanonCompliance } from '@/lib/ai-service';
import { StoryBible, Chapter } from '@/lib/types';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { storyBible, outline, chapterNumber, previousChapters } = body;

    if (!storyBible || !outline || chapterNumber === undefined) {
      return NextResponse.json(
        { error: 'Story Bible, Outline, and chapter number are required. Note: This route is deprecated, use /api/generate-chapter-v2 for volume/act-aware generation.' },
        { status: 400 }
      );
    }

    const result = await generateChapter(
      storyBible as StoryBible,
      outline as any, // Legacy outline format
      chapterNumber,
      (previousChapters || []) as Chapter[]
    );

    const canonCheck = await checkCanonCompliance(result.content, storyBible as StoryBible);

    // Return legacy format for backward compatibility
    return NextResponse.json({
      chapter: {
        id: `chapter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
      },
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
