import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const user = await requireAuth();
    const { chapterId } = params;

    console.log('📖 GET /api/chapters/[chapterId]');
    console.log('Chapter ID:', chapterId);

    // Get chapter with authorization check
    const chapterResult = await sql`
      SELECT c.*, b.user_id
      FROM chapters c
      JOIN books b ON c.book_id = b.id
      WHERE c.id = ${chapterId}
    `;

    if (chapterResult.length === 0) {
      console.log('❌ Chapter not found');
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    if (String(chapterResult[0].user_id) !== String(user.id)) {
      console.log('❌ Unauthorized');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const chapter = chapterResult[0];

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
    console.error('❌ Error fetching chapter:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chapter' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const user = await requireAuth();
    const { chapterId } = params;

    console.log('🗑️ DELETE /api/chapters/[chapterId]');
    console.log('Chapter ID:', chapterId);

    // Verify chapter belongs to user's book
    const chapterCheck = await sql`
      SELECT c.id, c.book_id, c.volume_id, c.chapter_number, c.chapter_order, b.user_id 
      FROM chapters c
      JOIN books b ON c.book_id = b.id
      WHERE c.id = ${chapterId}
    `;

    if (chapterCheck.length === 0) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    if (String(chapterCheck[0].user_id) !== String(user.id)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const chapter = chapterCheck[0];
    const volumeId = chapter.volume_id;
    const deletedChapterNumber = chapter.chapter_number;

    console.log('✅ Authorization passed');
    console.log('Deleting chapter:', deletedChapterNumber, 'from volume:', volumeId);

    // Delete all pages in this chapter (cascade)
    const deletedPages = await sql`
      DELETE FROM pages WHERE chapter_id = ${chapterId}
      RETURNING id
    `;

    console.log(`🗑️ Deleted ${deletedPages.length} pages`);

    // Delete the chapter
    await sql`DELETE FROM chapters WHERE id = ${chapterId}`;

    console.log('🗑️ Chapter deleted');

    // Re-index remaining chapters in the volume
    // Get all remaining chapters ordered by chapter_order
    const remainingChapters = await sql`
      SELECT id, chapter_number, chapter_order
      FROM chapters
      WHERE volume_id = ${volumeId}
      ORDER BY chapter_order ASC
    `;

    console.log(`📊 Re-indexing ${remainingChapters.length} remaining chapters`);

    // Update chapter numbers sequentially
    for (let i = 0; i < remainingChapters.length; i++) {
      const newChapterNumber = i + 1;
      const newChapterOrder = i + 1;
      
      await sql`
        UPDATE chapters
        SET chapter_number = ${newChapterNumber},
            chapter_order = ${newChapterOrder},
            updated_at = NOW()
        WHERE id = ${remainingChapters[i].id}
      `;
    }

    console.log('✅ Chapter re-indexing complete');

    // Update volume's target chapter count
    await sql`
      UPDATE volumes
      SET target_chapter_count = ${remainingChapters.length},
          updated_at = NOW()
      WHERE id = ${volumeId}
    `;

    return NextResponse.json({
      success: true,
      deletedChapterId: chapterId,
      deletedPageCount: deletedPages.length,
      remainingChapterCount: remainingChapters.length,
      message: `Chapter ${deletedChapterNumber} and ${deletedPages.length} pages deleted successfully`,
    });

  } catch (error: any) {
    console.error('❌ Error deleting chapter:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete chapter' },
      { status: 500 }
    );
  }
}
