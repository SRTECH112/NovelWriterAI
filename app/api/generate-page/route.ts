import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { generatePage } from '@/lib/ai-service-page';
import { StoryBible, Volume, Act, Chapter, Page } from '@/lib/types';

export const maxDuration = 60; // Set max duration to 60 seconds for Vercel

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 Starting page generation request');
    const user = await requireAuth();
    console.log('✅ User authenticated:', user.id);
    
    const body = await request.json();
    const { chapterId, pageNumber } = body;
    console.log('📝 Request params:', { chapterId, pageNumber });

    if (!chapterId || !pageNumber) {
      console.error('❌ Missing required parameters');
      return NextResponse.json(
        { error: 'Missing chapterId or pageNumber' },
        { status: 400 }
      );
    }

    // Get chapter with authorization check
    const chapterResult = await sql`
      SELECT c.*, b.user_id
      FROM chapters c
      JOIN books b ON c.book_id = b.id
      WHERE c.id = ${chapterId}
    `;

    if (chapterResult.length === 0) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    if (String(chapterResult[0].user_id) !== String(user.id)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const chapter = chapterResult[0];

    // Validate page number
    if (pageNumber < 1 || pageNumber > chapter.target_page_count) {
      return NextResponse.json(
        { error: `Invalid page number. Chapter has ${chapter.target_page_count} pages.` },
        { status: 400 }
      );
    }

    // Check if page already exists
    const existingPage = await sql`
      SELECT * FROM pages
      WHERE chapter_id = ${chapterId} AND page_number = ${pageNumber}
    `;

    if (existingPage.length > 0 && existingPage[0].locked) {
      return NextResponse.json(
        { error: 'This page is locked and cannot be regenerated' },
        { status: 400 }
      );
    }

    // Get previous pages (AI will use last 17 for deep memory context)
    // Load all previous pages in chapter, AI service will slice to last 17
    const previousPages = await sql`
      SELECT * FROM pages
      WHERE chapter_id = ${chapterId} AND page_number < ${pageNumber}
      ORDER BY page_number ASC
    `;

    // Get story bible
    const bibleResult = await sql`
      SELECT * FROM story_bibles WHERE book_id = ${chapter.book_id}
    `;
    const storyBible = bibleResult[0] as StoryBible;

    // Get volume
    const volumeResult = await sql`
      SELECT * FROM volumes WHERE id = ${chapter.volume_id}
    `;
    const volume = volumeResult[0] as Volume;

    // Calculate structure context (no acts)
    const allVolumes = await sql`
      SELECT * FROM volumes WHERE book_id = ${chapter.book_id} ORDER BY volume_number
    `;
    const chaptersInVolume = await sql`
      SELECT * FROM chapters WHERE volume_id = ${chapter.volume_id} ORDER BY chapter_order
    `;

    const structureContext = {
      currentVolumeNumber: volume.volumeNumber,
      totalVolumes: allVolumes.length,
      currentChapterNumber: chapter.chapter_number,
      totalChaptersInVolume: chaptersInVolume.length,
      isLastChapter: chapter.chapter_number === chaptersInVolume.length,
      isLastVolume: volume.volumeNumber === allVolumes.length,
    };

    console.log(`🔵 Generating page ${pageNumber} of ${chapter.target_page_count} for chapter ${chapter.id}`);

    // Generate page (no act needed - chapters are direct children of volumes)
    const result = await generatePage(
      storyBible,
      volume,
      {
        ...chapter,
        targetWordCount: chapter.target_word_count,
        targetPageCount: chapter.target_page_count,
        currentPageCount: chapter.current_page_count,
      } as Chapter,
      pageNumber,
      previousPages.map(p => ({
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
      })) as Page[],
      chapter.outline,
      volume.outline,
      structureContext
    );

    console.log(`📊 Generated page: ${result.wordCount} words`);

    // Save or update page
    let pageResult;
    if (existingPage.length > 0) {
      // Update existing page
      pageResult = await sql`
        UPDATE pages
        SET content = ${result.content},
            word_count = ${result.wordCount},
            beat_coverage = ${result.beatCoverage},
            narrative_momentum = ${result.narrativeMomentum},
            updated_at = NOW()
        WHERE chapter_id = ${chapterId} AND page_number = ${pageNumber}
        RETURNING *
      `;
    } else {
      // Insert new page
      pageResult = await sql`
        INSERT INTO pages (
          chapter_id, page_number, content, word_count,
          beat_coverage, narrative_momentum, locked
        )
        VALUES (
          ${chapterId}, ${pageNumber}, ${result.content}, ${result.wordCount},
          ${result.beatCoverage}, ${result.narrativeMomentum}, false
        )
        RETURNING *
      `;
    }

    // Update chapter page count and word count
    const allPages = await sql`
      SELECT * FROM pages WHERE chapter_id = ${chapterId} ORDER BY page_number
    `;
    
    const totalWordCount = allPages.reduce((sum, p) => sum + p.word_count, 0);
    const currentPageCount = allPages.length;

    await sql`
      UPDATE chapters
      SET current_page_count = ${currentPageCount},
          word_count = ${totalWordCount},
          updated_at = NOW()
      WHERE id = ${chapterId}
    `;

    // Lock previous pages if this is not page 1
    if (pageNumber > 1) {
      await sql`
        UPDATE pages
        SET locked = true
        WHERE chapter_id = ${chapterId} AND page_number < ${pageNumber}
      `;
    }

    return NextResponse.json({
      page: {
        id: pageResult[0].id,
        chapterId: pageResult[0].chapter_id,
        pageNumber: pageResult[0].page_number,
        content: pageResult[0].content,
        wordCount: pageResult[0].word_count,
        beatCoverage: pageResult[0].beat_coverage,
        narrativeMomentum: pageResult[0].narrative_momentum,
        locked: pageResult[0].locked,
        createdAt: pageResult[0].created_at,
        updatedAt: pageResult[0].updated_at,
      },
      chapterProgress: {
        currentPageCount,
        targetPageCount: chapter.target_page_count,
        totalWordCount,
        targetWordCount: chapter.target_word_count,
        percentComplete: Math.round((currentPageCount / chapter.target_page_count) * 100),
      },
    });
  } catch (error: any) {
    console.error('Error generating page:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate page' },
      { status: 500 }
    );
  }
}
