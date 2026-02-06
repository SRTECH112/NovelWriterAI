import { sql } from '@/lib/db';
import { StoryBible, Outline, Chapter } from '@/lib/types';

// Book queries
export async function createBook(userId: string, data: {
  title: string;
  genre: string;
  pov: string;
  tone: string;
  targetWordCount: number;
  status: string;
}) {
  const result = await sql`
    INSERT INTO books (user_id, title, genre, pov, tone, target_word_count, status)
    VALUES (${userId}, ${data.title}, ${data.genre}, ${data.pov}, ${data.tone}, ${data.targetWordCount}, ${data.status})
    RETURNING *
  `;
  return result[0];
}

export async function getUserBooks(userId: string) {
  return await sql`
    SELECT * FROM books 
    WHERE user_id = ${userId}
    ORDER BY last_edited_at DESC
  `;
}

export async function getBook(bookId: string, userId: string) {
  const result = await sql`
    SELECT * FROM books 
    WHERE id = ${bookId} AND user_id = ${userId}
  `;
  return result[0] || null;
}

export async function updateBook(bookId: string, userId: string, updates: any) {
  const result = await sql`
    UPDATE books 
    SET 
      title = COALESCE(${updates.title}, title),
      status = COALESCE(${updates.status}, status),
      current_chapter = COALESCE(${updates.currentChapter}, current_chapter),
      total_chapters = COALESCE(${updates.totalChapters}, total_chapters),
      progress = COALESCE(${updates.progress}, progress),
      last_edited_at = CURRENT_TIMESTAMP
    WHERE id = ${bookId} AND user_id = ${userId}
    RETURNING *
  `;
  return result[0] || null;
}

export async function deleteBook(bookId: string, userId: string) {
  await sql`
    DELETE FROM books 
    WHERE id = ${bookId} AND user_id = ${userId}
  `;
}

// Story Bible queries
export async function saveStoryBible(bookId: string, bible: StoryBible) {
  const result = await sql`
    INSERT INTO story_bibles (
      book_id, raw_whitepaper, world_rules, lore_timeline, factions,
      technology_magic_rules, themes_tone, hard_constraints, soft_guidelines,
      locked, genre, tone, target_length, pov
    )
    VALUES (
      ${bookId}, ${bible.raw_whitepaper}, ${JSON.stringify(bible.structured_sections.worldRules)},
      ${JSON.stringify(bible.structured_sections.loreTimeline)}, ${JSON.stringify(bible.structured_sections.factions)},
      ${JSON.stringify(bible.structured_sections.technologyMagicRules)}, ${JSON.stringify(bible.structured_sections.themesTone)},
      ${JSON.stringify(bible.structured_sections.hardConstraints)}, ${JSON.stringify(bible.structured_sections.softGuidelines)},
      ${bible.locked}, ${bible.metadata.genre}, ${bible.metadata.tone}, ${bible.metadata.targetLength}, ${bible.metadata.pov}
    )
    ON CONFLICT (book_id) 
    DO UPDATE SET
      raw_whitepaper = EXCLUDED.raw_whitepaper,
      world_rules = EXCLUDED.world_rules,
      lore_timeline = EXCLUDED.lore_timeline,
      factions = EXCLUDED.factions,
      technology_magic_rules = EXCLUDED.technology_magic_rules,
      themes_tone = EXCLUDED.themes_tone,
      hard_constraints = EXCLUDED.hard_constraints,
      soft_guidelines = EXCLUDED.soft_guidelines,
      locked = EXCLUDED.locked,
      genre = EXCLUDED.genre,
      tone = EXCLUDED.tone,
      target_length = EXCLUDED.target_length,
      pov = EXCLUDED.pov,
      version = story_bibles.version + 1,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  return result[0];
}

export async function getStoryBible(bookId: string): Promise<StoryBible | null> {
  const result = await sql`
    SELECT * FROM story_bibles WHERE book_id = ${bookId}
  `;
  
  if (result.length === 0) return null;
  
  const row = result[0];
  return {
    id: row.id.toString(),
    raw_whitepaper: row.raw_whitepaper,
    structured_sections: {
      worldRules: row.world_rules || [],
      loreTimeline: row.lore_timeline || [],
      factions: row.factions || [],
      technologyMagicRules: row.technology_magic_rules || [],
      themesTone: row.themes_tone || [],
      hardConstraints: row.hard_constraints || [],
      softGuidelines: row.soft_guidelines || [],
    },
    locked: row.locked,
    metadata: {
      genre: row.genre,
      tone: row.tone,
      targetLength: row.target_length,
      pov: row.pov,
    },
    createdAt: row.created_at,
  };
}

// Outline queries
export async function saveOutline(bookId: string, outline: Outline) {
  const result = await sql`
    INSERT INTO outlines (book_id, act_structure, midpoint, climax)
    VALUES (${bookId}, ${outline.actStructure}, ${outline.keyMilestones?.midpoint}, ${outline.keyMilestones?.climax})
    ON CONFLICT (book_id)
    DO UPDATE SET
      act_structure = EXCLUDED.act_structure,
      midpoint = EXCLUDED.midpoint,
      climax = EXCLUDED.climax,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  
  const outlineId = result[0].id;
  
  // Delete existing chapter outlines
  await sql`DELETE FROM chapter_outlines WHERE outline_id = ${outlineId}`;
  
  // Insert new chapter outlines
  for (const chapter of outline.chapters) {
    await sql`
      INSERT INTO chapter_outlines (
        outline_id, chapter_number, title, summary, act, bible_citations,
        character_arcs, beats, pov, setting, canon_citations, emotional_goal,
        conflict, relationship_movement, hook_for_next
      )
      VALUES (
        ${outlineId}, ${chapter.number}, ${chapter.title}, ${chapter.summary}, ${chapter.act},
        ${JSON.stringify(chapter.bibleCitations || [])}, ${JSON.stringify(chapter.characterArcs || [])},
        ${JSON.stringify(chapter.beats || [])}, ${chapter.pov}, ${chapter.setting},
        ${JSON.stringify(chapter.canonCitations || [])}, ${chapter.emotionalGoal},
        ${chapter.conflict}, ${chapter.relationshipMovement}, ${chapter.hookForNext}
      )
    `;
  }
  
  return outlineId;
}

export async function getOutline(bookId: string): Promise<Outline | null> {
  const outlineResult = await sql`
    SELECT * FROM outlines WHERE book_id = ${bookId}
  `;
  
  if (outlineResult.length === 0) return null;
  
  const outline = outlineResult[0];
  const chaptersResult = await sql`
    SELECT * FROM chapter_outlines 
    WHERE outline_id = ${outline.id}
    ORDER BY chapter_number
  `;
  
  return {
    id: outline.id.toString(),
    storyBibleId: outline.story_bible_id?.toString() || '',
    actStructure: outline.act_structure,
    chapters: chaptersResult.map((ch: any) => ({
      number: ch.chapter_number,
      title: ch.title,
      summary: ch.summary,
      act: ch.act,
      bibleCitations: ch.bible_citations || [],
      characterArcs: ch.character_arcs || [],
      beats: ch.beats || [],
      pov: ch.pov,
      setting: ch.setting,
      canonCitations: ch.canon_citations || [],
      emotionalGoal: ch.emotional_goal,
      conflict: ch.conflict,
      relationshipMovement: ch.relationship_movement,
      hookForNext: ch.hook_for_next,
    })),
    keyMilestones: {
      midpoint: outline.midpoint,
      climax: outline.climax,
    },
    createdAt: outline.created_at,
  };
}

// Chapter queries
export async function saveChapter(bookId: string, chapter: Chapter) {
  const result = await sql`
    INSERT INTO chapters (
      book_id, chapter_number, title, content, summary, word_count,
      character_states, world_changes, plot_progression, emotional_state,
      unresolved_threads, canon_warnings, prose_quality_score,
      prose_quality_issues, prose_quality_warnings, regeneration_count
    )
    VALUES (
      ${bookId}, ${chapter.number}, ${chapter.summary}, ${chapter.content}, ${chapter.summary},
      ${chapter.content.split(/\s+/).length}, ${JSON.stringify(chapter.stateDelta.characterStates)},
      ${JSON.stringify(chapter.stateDelta.worldChanges)}, ${JSON.stringify(chapter.stateDelta.plotProgression)},
      ${chapter.stateDelta.emotionalState}, ${JSON.stringify(chapter.stateDelta.unresolvedThreads || [])},
      ${JSON.stringify(chapter.canonWarnings)}, ${chapter.proseQuality?.score},
      ${JSON.stringify(chapter.proseQuality?.issues || [])}, ${JSON.stringify(chapter.proseQuality?.warnings || [])},
      ${chapter.regenerationCount}
    )
    ON CONFLICT (book_id, chapter_number)
    DO UPDATE SET
      content = EXCLUDED.content,
      summary = EXCLUDED.summary,
      word_count = EXCLUDED.word_count,
      character_states = EXCLUDED.character_states,
      world_changes = EXCLUDED.world_changes,
      plot_progression = EXCLUDED.plot_progression,
      emotional_state = EXCLUDED.emotional_state,
      unresolved_threads = EXCLUDED.unresolved_threads,
      canon_warnings = EXCLUDED.canon_warnings,
      prose_quality_score = EXCLUDED.prose_quality_score,
      prose_quality_issues = EXCLUDED.prose_quality_issues,
      prose_quality_warnings = EXCLUDED.prose_quality_warnings,
      regeneration_count = EXCLUDED.regeneration_count,
      last_generated_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  return result[0];
}

export async function getChapters(bookId: string): Promise<Chapter[]> {
  const result = await sql`
    SELECT * FROM chapters 
    WHERE book_id = ${bookId}
    ORDER BY chapter_number
  `;
  
  return result.map((row: any) => ({
    id: row.id.toString(),
    outlineId: row.outline_id?.toString() || '',
    number: row.chapter_number,
    content: row.content,
    summary: row.summary,
    stateDelta: {
      characterStates: row.character_states || {},
      worldChanges: row.world_changes || [],
      plotProgression: row.plot_progression || [],
      emotionalState: row.emotional_state,
      unresolvedThreads: row.unresolved_threads || [],
    },
    canonWarnings: row.canon_warnings || [],
    proseQuality: row.prose_quality_score ? {
      score: row.prose_quality_score,
      issues: row.prose_quality_issues || [],
      warnings: row.prose_quality_warnings || [],
    } : undefined,
    createdAt: row.created_at,
    regenerationCount: row.regeneration_count,
  }));
}
