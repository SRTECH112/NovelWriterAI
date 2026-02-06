import { NextRequest, NextResponse } from 'next/server';
import { generateChapterWithVolumeContext } from '@/lib/ai-service-volume';
import { checkCanonCompliance } from '@/lib/ai-service';
import { StoryBible, Chapter } from '@/lib/types';
import { requireAuth } from '@/lib/auth';
import { getStoryBible } from '@/lib/db/queries';
import { getVolume, getAct, getVolumeMemory, getActMemory } from '@/lib/db/volume-queries';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { 
      bookId, 
      volumeId, 
      actId, 
      chapterNumber, 
      globalChapterNumber,
      emotionalBeat,
      relationshipShift,
      sceneGoal,
      previousChapters 
    } = body;

    if (!bookId || !volumeId || !actId || chapterNumber === undefined) {
      return NextResponse.json(
        { error: 'bookId, volumeId, actId, and chapterNumber are required' },
        { status: 400 }
      );
    }

    // Fetch all required context
    const storyBible = await getStoryBible(bookId);
    if (!storyBible) {
      return NextResponse.json(
        { error: 'Story Bible not found. Generate one first.' },
        { status: 404 }
      );
    }

    const volume = await getVolume(volumeId);
    if (!volume || volume.bookId !== bookId) {
      return NextResponse.json(
        { error: 'Volume not found' },
        { status: 404 }
      );
    }

    const act = await getAct(actId);
    if (!act || act.volumeId !== volumeId) {
      return NextResponse.json(
        { error: 'Act not found' },
        { status: 404 }
      );
    }

    // Fetch memory layers (optional)
    const volumeMemory = await getVolumeMemory(volumeId);
    const actMemory = await getActMemory(actId);

    // Generate chapter with full volume/act context
    const result = await generateChapterWithVolumeContext(
      storyBible,
      volume,
      act,
      chapterNumber,
      globalChapterNumber || chapterNumber,
      (previousChapters || []) as Chapter[],
      volumeMemory || undefined,
      actMemory || undefined,
      {
        emotionalBeat,
        relationshipShift,
        sceneGoal,
      }
    );

    const canonCheck = await checkCanonCompliance(result.content, storyBible);

    // Save chapter to database
    const wordCount = result.content.split(/\s+/).length;
    const chapterResult = await sql`
      INSERT INTO chapters (
        book_id, volume_id, act_id, chapter_number, global_chapter_number,
        content, summary, word_count, emotional_beat, relationship_shift,
        scene_goal, character_states, world_changes, plot_progression,
        emotional_state, unresolved_threads, canon_warnings,
        prose_quality_score, prose_quality_issues, prose_quality_warnings,
        regeneration_count
      )
      VALUES (
        ${bookId}, ${volumeId}, ${actId}, ${chapterNumber}, ${globalChapterNumber || chapterNumber},
        ${result.content}, ${result.summary}, ${wordCount}, ${emotionalBeat || null},
        ${relationshipShift || null}, ${sceneGoal || null},
        ${JSON.stringify(result.stateDelta.characterStates)},
        ${JSON.stringify(result.stateDelta.worldChanges)},
        ${JSON.stringify(result.stateDelta.plotProgression)},
        ${result.stateDelta.emotionalState || null},
        ${JSON.stringify(result.stateDelta.unresolvedThreads || [])},
        ${JSON.stringify(canonCheck.passed ? [] : canonCheck.violations)},
        ${result.proseValidation.score},
        ${JSON.stringify(result.proseValidation.issues)},
        ${JSON.stringify(result.proseValidation.warnings)},
        0
      )
      ON CONFLICT (act_id, chapter_number)
      DO UPDATE SET
        content = EXCLUDED.content,
        summary = EXCLUDED.summary,
        word_count = EXCLUDED.word_count,
        emotional_beat = EXCLUDED.emotional_beat,
        relationship_shift = EXCLUDED.relationship_shift,
        scene_goal = EXCLUDED.scene_goal,
        character_states = EXCLUDED.character_states,
        world_changes = EXCLUDED.world_changes,
        plot_progression = EXCLUDED.plot_progression,
        emotional_state = EXCLUDED.emotional_state,
        unresolved_threads = EXCLUDED.unresolved_threads,
        canon_warnings = EXCLUDED.canon_warnings,
        prose_quality_score = EXCLUDED.prose_quality_score,
        prose_quality_issues = EXCLUDED.prose_quality_issues,
        prose_quality_warnings = EXCLUDED.prose_quality_warnings,
        regeneration_count = chapters.regeneration_count + 1,
        updated_at = CURRENT_TIMESTAMP,
        last_generated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const savedChapter = chapterResult[0];

    const chapter: Chapter = {
      id: savedChapter.id.toString(),
      bookId: savedChapter.book_id.toString(),
      volumeId: savedChapter.volume_id.toString(),
      actId: savedChapter.act_id.toString(),
      chapterNumber: savedChapter.chapter_number,
      globalChapterNumber: savedChapter.global_chapter_number,
      title: savedChapter.title,
      content: savedChapter.content,
      summary: savedChapter.summary,
      wordCount: savedChapter.word_count,
      emotionalBeat: savedChapter.emotional_beat,
      relationshipShift: savedChapter.relationship_shift,
      sceneGoal: savedChapter.scene_goal,
      hookToNext: savedChapter.hook_to_next,
      stateDelta: result.stateDelta,
      canonWarnings: canonCheck.passed ? [] : canonCheck.violations,
      proseQuality: {
        score: result.proseValidation.score,
        issues: result.proseValidation.issues,
        warnings: result.proseValidation.warnings,
      },
      createdAt: savedChapter.created_at.toISOString(),
      updatedAt: savedChapter.updated_at.toISOString(),
      lastGeneratedAt: savedChapter.last_generated_at.toISOString(),
      regenerationCount: savedChapter.regeneration_count,
    };

    return NextResponse.json({
      chapter,
      canonCheck,
      proseValidation: result.proseValidation,
      context: {
        volume: volume.title,
        act: `Act ${act.actNumber} (${act.narrativePurpose})`,
        emotionalPressure: act.emotionalPressure,
        pacing: act.pacing,
      }
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
