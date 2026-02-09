import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { parseStoryOutline } from '@/lib/ai-service';
import { getStoryBible } from '@/lib/db/queries';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { bookId, rawOutline } = body;

    if (!bookId) {
      return NextResponse.json(
        { error: 'bookId is required' },
        { status: 400 }
      );
    }

    // Get Story Bible for context
    const storyBible = await getStoryBible(bookId);
    if (!storyBible) {
      return NextResponse.json(
        { error: 'Story Bible not found. Generate one first.' },
        { status: 404 }
      );
    }

    // Auto-generate structure with AI (works with or without user outline)
    const parsedStructure = await parseStoryOutline(rawOutline || '', storyBible);

    // Create Volume 1 if it doesn't exist
    let volumeResult = await sql`
      SELECT id FROM volumes WHERE book_id = ${bookId} AND volume_number = 1
    `;

    let volumeId: string;
    if (volumeResult.length === 0) {
      const totalChapters = parsedStructure.acts.reduce((sum, act) => sum + act.targetChapterCount, 0);
      const newVolume = await sql`
        INSERT INTO volumes (book_id, volume_number, title, target_chapter_count)
        VALUES (${bookId}, 1, 'Volume 1', ${totalChapters})
        RETURNING id
      `;
      volumeId = newVolume[0].id.toString();
    } else {
      volumeId = volumeResult[0].id.toString();
    }

    // Create Chapters directly under volume (Acts are now just metadata tags)
    const createdChapters = [];
    let globalChapterNumber = 1;
    let chapterOrder = 1;

    for (const actData of parsedStructure.acts) {
      // Use act title as metadata tag for chapters
      const actTag = (actData.title || `Act ${actData.actNumber}`).slice(0, 200);
      
      console.log(`Processing Act ${actData.actNumber}: "${actTag}" with ${actData.chapters.length} chapters`);

      // Create Chapter placeholders with outline metadata
      for (const chapterData of actData.chapters) {
        // Truncate long values to fit database constraints
        const chapterTitle = (chapterData.title || `Chapter ${globalChapterNumber}`).slice(0, 200);
        const chapterSummary = (chapterData.summary || '').slice(0, 1000);
        const emotionalIntent = (chapterData.emotionalIntent || '').slice(0, 500);
        const sceneGoal = (chapterData.plotBeats?.join('; ') || '').slice(0, 1000);
        const outlineText = `[OUTLINE PLACEHOLDER]\n\nOriginal Outline:\n${chapterData.rawOutlineText}\n\nPlot Beats:\n${chapterData.plotBeats.join('\n- ')}\n\nEmotional Intent: ${chapterData.emotionalIntent}\nCharacter Focus: ${chapterData.characterFocus.join(', ')}\nPacing: ${chapterData.pacingHint}`;
        
        await sql`
          INSERT INTO chapters (
            book_id, volume_id, chapter_number, chapter_order, global_chapter_number,
            title, summary, content, word_count,
            target_word_count, target_page_count, current_page_count,
            outline, act_tag,
            emotional_beat, scene_goal,
            character_states, world_changes, plot_progression,
            canon_warnings, prose_quality_score, prose_quality_issues,
            prose_quality_warnings, regeneration_count
          )
          VALUES (
            ${bookId}, ${volumeId}, ${globalChapterNumber}, ${chapterOrder}, ${globalChapterNumber},
            ${chapterTitle}, ${chapterSummary},
            ${outlineText},
            0,
            2750, 4, 0,
            ${outlineText}, ${actTag},
            ${emotionalIntent}, ${sceneGoal},
            ${JSON.stringify({ outlineMetadata: chapterData })},
            ${JSON.stringify([])},
            ${JSON.stringify(chapterData.plotBeats)},
            ${JSON.stringify([])}, 0, ${JSON.stringify([])},
            ${JSON.stringify([])}, 0
          )
          ON CONFLICT (volume_id, chapter_number)
          DO UPDATE SET
            title = EXCLUDED.title,
            summary = EXCLUDED.summary,
            outline = EXCLUDED.outline,
            act_tag = EXCLUDED.act_tag,
            emotional_beat = EXCLUDED.emotional_beat,
            scene_goal = EXCLUDED.scene_goal,
            character_states = EXCLUDED.character_states,
            plot_progression = EXCLUDED.plot_progression
        `;

        createdChapters.push({
          chapterNumber: globalChapterNumber,
          title: chapterTitle,
          actTag: actTag,
        });

        globalChapterNumber++;
        chapterOrder++;
      }
    }

    return NextResponse.json({
      success: true,
      volumeId,
      chapters: createdChapters,
      totalChapters: globalChapterNumber - 1,
      message: 'Outline parsed and structure created successfully (Volume → Chapter hierarchy)',
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error parsing outline:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse outline' },
      { status: 500 }
    );
  }
}
