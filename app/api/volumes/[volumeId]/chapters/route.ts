import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { volumeId: string } }
) {
  try {
    const user = await requireAuth();
    const { volumeId } = params;

    // Verify volume belongs to user's book
    const volumeCheck = await sql`
      SELECT v.id, v.book_id, b.user_id 
      FROM volumes v
      JOIN books b ON v.book_id = b.id
      WHERE v.id = ${volumeId}
    `;

    if (volumeCheck.length === 0) {
      return NextResponse.json(
        { error: 'Volume not found' },
        { status: 404 }
      );
    }

    if (volumeCheck[0].user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get chapters for this volume (no act_id needed)
    const chapters = await sql`
      SELECT * FROM chapters
      WHERE volume_id = ${volumeId}
      ORDER BY chapter_order ASC
    `;

    return NextResponse.json({ 
      chapters: chapters.map(c => ({
        id: c.id,
        bookId: c.book_id,
        volumeId: c.volume_id,
        chapterNumber: c.chapter_number,
        chapterOrder: c.chapter_order,
        globalChapterNumber: c.global_chapter_number,
        title: c.title,
        content: c.content,
        summary: c.summary,
        wordCount: c.word_count,
        targetWordCount: c.target_word_count,
        targetPageCount: c.target_page_count,
        currentPageCount: c.current_page_count,
        outline: c.outline,
        actTag: c.act_tag,
        emotionalBeat: c.emotional_beat,
        relationshipShift: c.relationship_shift,
        sceneGoal: c.scene_goal,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }))
    });
  } catch (error: any) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chapters' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { volumeId: string } }
) {
  try {
    const user = await requireAuth();
    const { volumeId } = params;
    const body = await request.json();

    // Verify volume belongs to user's book
    const volumeCheck = await sql`
      SELECT v.id, v.book_id, b.user_id 
      FROM volumes v
      JOIN books b ON v.book_id = b.id
      WHERE v.id = ${volumeId}
    `;

    if (volumeCheck.length === 0) {
      return NextResponse.json(
        { error: 'Volume not found' },
        { status: 404 }
      );
    }

    if (volumeCheck[0].user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const bookId = volumeCheck[0].book_id;

    // Get next chapter number for this volume
    const existingChapters = await sql`
      SELECT MAX(chapter_number) as max_num, MAX(chapter_order) as max_order
      FROM chapters
      WHERE volume_id = ${volumeId}
    `;

    const nextChapterNumber = (existingChapters[0]?.max_num || 0) + 1;
    const nextChapterOrder = (existingChapters[0]?.max_order || 0) + 1;

    // Get global chapter number
    const allChapters = await sql`
      SELECT MAX(global_chapter_number) as max_global
      FROM chapters
      WHERE book_id = ${bookId}
    `;
    const nextGlobalNumber = (allChapters[0]?.max_global || 0) + 1;

    // Create chapter (no act_id)
    const result = await sql`
      INSERT INTO chapters (
        book_id, volume_id, chapter_number, chapter_order, global_chapter_number,
        title, target_word_count, target_page_count, current_page_count,
        word_count, content, outline, act_tag
      )
      VALUES (
        ${bookId}, ${volumeId}, ${nextChapterNumber}, ${nextChapterOrder}, ${nextGlobalNumber},
        ${body.title || `Chapter ${nextChapterNumber}`},
        ${body.targetWordCount || 2750},
        ${body.targetPageCount || 4},
        0, 0, '', ${body.outline || ''}, ${body.actTag || null}
      )
      RETURNING *
    `;

    const chapter = result[0];

    return NextResponse.json({
      chapter: {
        id: chapter.id,
        bookId: chapter.book_id,
        volumeId: chapter.volume_id,
        chapterNumber: chapter.chapter_number,
        chapterOrder: chapter.chapter_order,
        globalChapterNumber: chapter.global_chapter_number,
        title: chapter.title,
        content: chapter.content,
        summary: chapter.summary,
        wordCount: chapter.word_count,
        targetWordCount: chapter.target_word_count,
        targetPageCount: chapter.target_page_count,
        currentPageCount: chapter.current_page_count,
        outline: chapter.outline,
        actTag: chapter.act_tag,
        emotionalBeat: chapter.emotional_beat,
        relationshipShift: chapter.relationship_shift,
        sceneGoal: chapter.scene_goal,
        createdAt: chapter.created_at,
        updatedAt: chapter.updated_at,
      }
    });
  } catch (error: any) {
    console.error('Error creating chapter:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create chapter' },
      { status: 500 }
    );
  }
}
