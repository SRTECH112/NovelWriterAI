import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const user = await requireAuth();
    const { pageId } = params;

    // Get page with authorization check
    const pageResult = await sql`
      SELECT p.*, c.book_id, b.user_id
      FROM pages p
      JOIN chapters c ON p.chapter_id = c.id
      JOIN books b ON c.book_id = b.id
      WHERE p.id = ${pageId}
    `;

    if (pageResult.length === 0) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    if (String(pageResult[0].user_id) !== String(user.id)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const page = pageResult[0];
    const chapterId = page.chapter_id;

    // Delete the page
    await sql`DELETE FROM pages WHERE id = ${pageId}`;

    // Recalculate chapter stats
    const remainingPages = await sql`
      SELECT * FROM pages WHERE chapter_id = ${chapterId} ORDER BY page_number
    `;

    const totalWordCount = remainingPages.reduce((sum: number, p: any) => sum + (p.word_count || 0), 0);
    const pageCount = remainingPages.length;

    // Update chapter
    await sql`
      UPDATE chapters
      SET word_count = ${totalWordCount},
          current_page_count = ${pageCount},
          updated_at = NOW()
      WHERE id = ${chapterId}
    `;

    return NextResponse.json({
      success: true,
      chapterProgress: {
        currentPageCount: pageCount,
        totalWordCount: totalWordCount,
      }
    });

  } catch (error: any) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete page' },
      { status: 500 }
    );
  }
}
