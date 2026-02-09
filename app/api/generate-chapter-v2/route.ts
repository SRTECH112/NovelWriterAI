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

    // Check if this chapter has outline metadata (from parsed outline)
    const existingChapter = await sql`
      SELECT character_states FROM chapters 
      WHERE act_id = ${actId} AND chapter_number = ${chapterNumber}
      LIMIT 1
    `;

    let outlineMetadata;
    if (existingChapter.length > 0 && existingChapter[0].character_states) {
      const characterStates = existingChapter[0].character_states;
      if (characterStates.outlineMetadata) {
        outlineMetadata = characterStates.outlineMetadata;
        console.log('📝 Found outline metadata for chapter:', outlineMetadata);
      }
    }

    // Calculate structure context for anti-early-ending rules
    const totalVolumesResult = await sql`
      SELECT COUNT(DISTINCT volume_number) as count FROM volumes WHERE book_id = ${bookId}
    `;
    const totalVolumes = totalVolumesResult[0]?.count || 1;

    const totalActsResult = await sql`
      SELECT COUNT(*) as count FROM acts WHERE volume_id = ${volumeId}
    `;
    const totalActsInVolume = totalActsResult[0]?.count || 1;

    const totalChaptersResult = await sql`
      SELECT COUNT(*) as count FROM chapters WHERE act_id = ${actId}
    `;
    const totalChaptersInAct = totalChaptersResult[0]?.count || act.targetChapterCount || 5;

    const structureContext = {
      currentActNumber: act.actNumber,
      totalActsInVolume,
      currentVolumeNumber: volume.volumeNumber,
      totalVolumes,
      totalChaptersInAct,
      isLastChapter: chapterNumber >= totalChaptersInAct,
      isLastAct: act.actNumber >= totalActsInVolume,
      isLastVolume: volume.volumeNumber >= totalVolumes,
    };

    console.log('📊 Structure context:', structureContext);

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
      },
      outlineMetadata,
      structureContext,
      volume.outline // Pass volume outline for strict enforcement
    );

    // Validate word count meets minimum requirement
    const wordCount = result.content.split(/\s+/).length;
    console.log(`📊 Generated chapter word count: ${wordCount}`);
    
    if (wordCount < 600) {
      console.warn(`⚠️ Chapter too short (${wordCount} words). Minimum is 600 words.`);
      return NextResponse.json(
        { 
          error: `Chapter generation failed: Only ${wordCount} words generated (minimum 600 required). The AI may have stopped early. Please try again.`,
          wordCount,
          minRequired: 600
        },
        { status: 400 }
      );
    }

    const canonCheck = await checkCanonCompliance(result.content, storyBible);
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
      chapterNumber: savedChapter.chapter_number,
      chapterOrder: savedChapter.chapter_order || savedChapter.chapter_number,
      globalChapterNumber: savedChapter.global_chapter_number,
      title: savedChapter.title,
      content: savedChapter.content,
      summary: savedChapter.summary,
      outline: savedChapter.outline || '',
      wordCount: savedChapter.word_count,
      targetWordCount: savedChapter.target_word_count || 2750,
      targetPageCount: savedChapter.target_page_count || 4,
      currentPageCount: savedChapter.current_page_count || 0,
      actTag: savedChapter.act_id?.toString(),
      emotionalBeat: savedChapter.emotional_beat,
      relationshipShift: savedChapter.relationship_shift,
      sceneGoal: savedChapter.scene_goal,
      characterStates: result.stateDelta.characterStates,
      worldChanges: result.stateDelta.worldChanges,
      plotProgression: result.stateDelta.plotProgression,
      emotionalState: result.stateDelta.emotionalState,
      unresolvedThreads: result.stateDelta.unresolvedThreads,
      canonWarnings: canonCheck.passed ? [] : canonCheck.violations,
      proseQualityScore: result.proseValidation.score,
      proseQualityIssues: result.proseValidation.issues,
      proseQualityWarnings: result.proseValidation.warnings,
      regenerationCount: savedChapter.regeneration_count,
      createdAt: savedChapter.created_at.toISOString(),
      updatedAt: savedChapter.updated_at.toISOString(),
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
