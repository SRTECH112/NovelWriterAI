import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getBook } from '@/lib/db/queries';
import { getAct } from '@/lib/db/volume-queries';
import { sql } from '@/lib/db';
import { Chapter } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string; actId: string } }
) {
  try {
    const user = await requireAuth();
    const { bookId, actId } = params;

    const book = await getBook(bookId, user.id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const act = await getAct(actId);
    if (!act) {
      return NextResponse.json({ error: 'Act not found' }, { status: 404 });
    }

    const result = await sql`
      SELECT * FROM chapters 
      WHERE act_id = ${actId}
      ORDER BY chapter_number ASC
    `;

    const chapters: Chapter[] = result.map((row: any) => ({
      id: row.id.toString(),
      bookId: row.book_id.toString(),
      volumeId: row.volume_id.toString(),
      actId: row.act_id.toString(),
      chapterNumber: row.chapter_number,
      chapterOrder: row.chapter_order || row.chapter_number,
      globalChapterNumber: row.global_chapter_number,
      title: row.title,
      content: row.content,
      summary: row.summary,
      outline: row.outline || '',
      wordCount: row.word_count,
      targetWordCount: row.target_word_count || 2750,
      targetPageCount: row.target_page_count || 4,
      currentPageCount: row.current_page_count || 0,
      emotionalBeat: row.emotional_beat,
      relationshipShift: row.relationship_shift,
      sceneGoal: row.scene_goal,
      hookToNext: row.hook_to_next,
      stateDelta: {
        characterStates: row.character_states || {},
        worldChanges: row.world_changes || [],
        plotProgression: row.plot_progression || [],
        emotionalState: row.emotional_state,
        unresolvedThreads: row.unresolved_threads || [],
      },
      canonWarnings: row.canon_warnings || [],
      proseQuality: {
        score: row.prose_quality_score || 0,
        issues: row.prose_quality_issues || [],
        warnings: row.prose_quality_warnings || [],
      },
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      lastGeneratedAt: row.last_generated_at.toISOString(),
      regenerationCount: row.regeneration_count,
    }));

    return NextResponse.json({ chapters });
  } catch (error: any) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chapters' },
      { status: 500 }
    );
  }
}
