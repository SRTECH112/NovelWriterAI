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

    if (!bookId || !rawOutline) {
      return NextResponse.json(
        { error: 'bookId and rawOutline are required' },
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

    // Parse outline with AI
    const parsedStructure = await parseStoryOutline(rawOutline, storyBible);

    // Create Volume 1 if it doesn't exist
    let volumeResult = await sql`
      SELECT id FROM volumes WHERE book_id = ${bookId} AND volume_number = 1
    `;

    let volumeId: string;
    if (volumeResult.length === 0) {
      const newVolume = await sql`
        INSERT INTO volumes (book_id, volume_number, title, description, target_chapters)
        VALUES (${bookId}, 1, 'Volume 1', 'Main story volume', ${parsedStructure.acts.reduce((sum, act) => sum + act.targetChapterCount, 0)})
        RETURNING id
      `;
      volumeId = newVolume[0].id.toString();
    } else {
      volumeId = volumeResult[0].id.toString();
    }

    // Create Acts and Chapters
    const createdActs = [];
    let globalChapterNumber = 1;

    for (const actData of parsedStructure.acts) {
      // Create Act
      const actResult = await sql`
        INSERT INTO acts (
          book_id, volume_id, act_number, title, narrative_purpose,
          emotional_pressure, pacing, target_chapters
        )
        VALUES (
          ${bookId}, ${volumeId}, ${actData.actNumber}, ${actData.title || `Act ${actData.actNumber}`},
          ${actData.narrativePurpose}, ${actData.emotionalPressure}, ${actData.pacing},
          ${actData.targetChapterCount}
        )
        ON CONFLICT (volume_id, act_number)
        DO UPDATE SET
          title = EXCLUDED.title,
          narrative_purpose = EXCLUDED.narrative_purpose,
          emotional_pressure = EXCLUDED.emotional_pressure,
          pacing = EXCLUDED.pacing,
          target_chapters = EXCLUDED.target_chapters
        RETURNING id
      `;

      const actId = actResult[0].id.toString();

      // Create Chapter placeholders with outline metadata
      for (const chapterData of actData.chapters) {
        await sql`
          INSERT INTO chapters (
            book_id, volume_id, act_id, chapter_number, global_chapter_number,
            title, summary, content, word_count,
            emotional_beat, scene_goal,
            character_states, world_changes, plot_progression,
            canon_warnings, prose_quality_score, prose_quality_issues,
            prose_quality_warnings, regeneration_count
          )
          VALUES (
            ${bookId}, ${volumeId}, ${actId}, ${chapterData.chapterNumber}, ${globalChapterNumber},
            ${chapterData.title}, ${chapterData.summary},
            ${`[OUTLINE PLACEHOLDER]\n\nOriginal Outline:\n${chapterData.rawOutlineText}\n\nPlot Beats:\n${chapterData.plotBeats.join('\n- ')}\n\nEmotional Intent: ${chapterData.emotionalIntent}\nCharacter Focus: ${chapterData.characterFocus.join(', ')}\nPacing: ${chapterData.pacingHint}`},
            0,
            ${chapterData.emotionalIntent}, ${chapterData.plotBeats.join('; ')},
            ${JSON.stringify({ outlineMetadata: chapterData })},
            ${JSON.stringify([])},
            ${JSON.stringify(chapterData.plotBeats)},
            ${JSON.stringify([])}, 0, ${JSON.stringify([])},
            ${JSON.stringify([])}, 0
          )
          ON CONFLICT (act_id, chapter_number)
          DO UPDATE SET
            title = EXCLUDED.title,
            summary = EXCLUDED.summary,
            emotional_beat = EXCLUDED.emotional_beat,
            scene_goal = EXCLUDED.scene_goal,
            character_states = EXCLUDED.character_states,
            plot_progression = EXCLUDED.plot_progression
        `;

        globalChapterNumber++;
      }

      createdActs.push({
        actId,
        actNumber: actData.actNumber,
        title: actData.title,
        chapterCount: actData.chapters.length,
      });
    }

    return NextResponse.json({
      success: true,
      volumeId,
      acts: createdActs,
      totalChapters: globalChapterNumber - 1,
      message: 'Outline parsed and structure created successfully',
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
