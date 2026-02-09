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

    console.log('📄 GET /api/chapters/[chapterId]/pages');
    console.log('Chapter ID:', chapterId);
    console.log('User ID:', user.id, 'Type:', typeof user.id);

    // Verify chapter belongs to user's book
    const chapterCheck = await sql`
      SELECT c.id, c.book_id, b.user_id 
      FROM chapters c
      JOIN books b ON c.book_id = b.id
      WHERE c.id = ${chapterId}
    `;

    console.log('Chapter check result:', chapterCheck);

    if (chapterCheck.length === 0) {
      console.log('❌ Chapter not found');
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    console.log('DB user_id:', chapterCheck[0].user_id, 'Type:', typeof chapterCheck[0].user_id);
    console.log('Auth user.id:', user.id, 'Type:', typeof user.id);
    console.log('String comparison:', String(chapterCheck[0].user_id), '===', String(user.id));
    console.log('Match:', String(chapterCheck[0].user_id) === String(user.id));

    if (String(chapterCheck[0].user_id) !== String(user.id)) {
      console.log('❌ Unauthorized - user mismatch');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    console.log('✅ Authorization passed');

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
