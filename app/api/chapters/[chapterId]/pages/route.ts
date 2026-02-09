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

    // Verify chapter belongs to user's book
    const chapterCheck = await sql`
      SELECT c.id, c.book_id, b.user_id 
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

    // Get pages for this chapter
    const pages = await sql`
      SELECT * FROM pages
      WHERE chapter_id = ${chapterId}
      ORDER BY page_number ASC
    `;

    return NextResponse.json({ 
      pages: pages.map(p => ({
        id: p.id,
        chapterId: p.chapter_id,
        pageNumber: p.page_number,
        content: p.content,
        wordCount: p.word_count,
        beatCoverage: p.beat_coverage,
        narrativeMomentum: p.narrative_momentum,
        locked: p.locked,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }))
    });
  } catch (error: any) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}
