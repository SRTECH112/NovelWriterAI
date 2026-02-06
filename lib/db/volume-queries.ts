import { sql } from '@/lib/db';
import { Volume, Act, VolumeMemory, ActMemory } from '@/lib/types';

// Volume queries
export async function createVolume(bookId: string, data: {
  volumeNumber: number;
  title: string;
  theme?: string;
  emotionalPromise?: string;
  relationshipStateStart?: string;
  relationshipStateEnd?: string;
  majorTurningPoint?: string;
  targetChapterCount?: number;
}) {
  const result = await sql`
    INSERT INTO volumes (
      book_id, volume_number, title, theme, emotional_promise,
      relationship_state_start, relationship_state_end, major_turning_point,
      target_chapter_count
    )
    VALUES (
      ${bookId}, ${data.volumeNumber}, ${data.title}, ${data.theme || null},
      ${data.emotionalPromise || null}, ${data.relationshipStateStart || null},
      ${data.relationshipStateEnd || null}, ${data.majorTurningPoint || null},
      ${data.targetChapterCount || 20}
    )
    RETURNING *
  `;
  return result[0];
}

export async function getVolumesByBook(bookId: string): Promise<Volume[]> {
  const result = await sql`
    SELECT * FROM volumes 
    WHERE book_id = ${bookId}
    ORDER BY volume_number ASC
  `;
  
  return result.map((row: any) => ({
    id: row.id.toString(),
    bookId: row.book_id.toString(),
    volumeNumber: row.volume_number,
    title: row.title,
    theme: row.theme,
    emotionalPromise: row.emotional_promise,
    relationshipStateStart: row.relationship_state_start,
    relationshipStateEnd: row.relationship_state_end,
    majorTurningPoint: row.major_turning_point,
    targetChapterCount: row.target_chapter_count,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }));
}

export async function getVolume(volumeId: string): Promise<Volume | null> {
  const result = await sql`
    SELECT * FROM volumes WHERE id = ${volumeId}
  `;
  
  if (result.length === 0) return null;
  
  const row = result[0];
  return {
    id: row.id.toString(),
    bookId: row.book_id.toString(),
    volumeNumber: row.volume_number,
    title: row.title,
    theme: row.theme,
    emotionalPromise: row.emotional_promise,
    relationshipStateStart: row.relationship_state_start,
    relationshipStateEnd: row.relationship_state_end,
    majorTurningPoint: row.major_turning_point,
    targetChapterCount: row.target_chapter_count,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function updateVolume(volumeId: string, updates: Partial<Volume>) {
  const result = await sql`
    UPDATE volumes 
    SET 
      title = COALESCE(${updates.title}, title),
      theme = COALESCE(${updates.theme}, theme),
      emotional_promise = COALESCE(${updates.emotionalPromise}, emotional_promise),
      relationship_state_start = COALESCE(${updates.relationshipStateStart}, relationship_state_start),
      relationship_state_end = COALESCE(${updates.relationshipStateEnd}, relationship_state_end),
      major_turning_point = COALESCE(${updates.majorTurningPoint}, major_turning_point),
      target_chapter_count = COALESCE(${updates.targetChapterCount}, target_chapter_count),
      status = COALESCE(${updates.status}, status)
    WHERE id = ${volumeId}
    RETURNING *
  `;
  return result[0];
}

export async function deleteVolume(volumeId: string) {
  await sql`DELETE FROM volumes WHERE id = ${volumeId}`;
}

// Act queries
export async function createAct(volumeId: string, data: {
  actNumber: number;
  title?: string;
  narrativePurpose: 'setup' | 'rising-tension' | 'fracture' | 'crisis' | 'resolution' | 'payoff';
  pacing?: 'slow' | 'medium' | 'fast';
  emotionalPressure?: number;
  characterDevelopmentFocus?: string;
  targetChapterCount?: number;
}) {
  const result = await sql`
    INSERT INTO acts (
      volume_id, act_number, title, narrative_purpose, pacing,
      emotional_pressure, character_development_focus, target_chapter_count
    )
    VALUES (
      ${volumeId}, ${data.actNumber}, ${data.title || null}, ${data.narrativePurpose},
      ${data.pacing || 'medium'}, ${data.emotionalPressure || 5},
      ${data.characterDevelopmentFocus || null}, ${data.targetChapterCount || 5}
    )
    RETURNING *
  `;
  return result[0];
}

export async function getActsByVolume(volumeId: string): Promise<Act[]> {
  const result = await sql`
    SELECT * FROM acts 
    WHERE volume_id = ${volumeId}
    ORDER BY act_number ASC
  `;
  
  return result.map((row: any) => ({
    id: row.id.toString(),
    volumeId: row.volume_id.toString(),
    actNumber: row.act_number,
    title: row.title,
    narrativePurpose: row.narrative_purpose,
    pacing: row.pacing,
    emotionalPressure: row.emotional_pressure,
    characterDevelopmentFocus: row.character_development_focus,
    targetChapterCount: row.target_chapter_count,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }));
}

export async function getAct(actId: string): Promise<Act | null> {
  const result = await sql`
    SELECT * FROM acts WHERE id = ${actId}
  `;
  
  if (result.length === 0) return null;
  
  const row = result[0];
  return {
    id: row.id.toString(),
    volumeId: row.volume_id.toString(),
    actNumber: row.act_number,
    title: row.title,
    narrativePurpose: row.narrative_purpose,
    pacing: row.pacing,
    emotionalPressure: row.emotional_pressure,
    characterDevelopmentFocus: row.character_development_focus,
    targetChapterCount: row.target_chapter_count,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function updateAct(actId: string, updates: Partial<Act>) {
  const result = await sql`
    UPDATE acts 
    SET 
      title = COALESCE(${updates.title}, title),
      narrative_purpose = COALESCE(${updates.narrativePurpose}, narrative_purpose),
      pacing = COALESCE(${updates.pacing}, pacing),
      emotional_pressure = COALESCE(${updates.emotionalPressure}, emotional_pressure),
      character_development_focus = COALESCE(${updates.characterDevelopmentFocus}, character_development_focus),
      target_chapter_count = COALESCE(${updates.targetChapterCount}, target_chapter_count)
    WHERE id = ${actId}
    RETURNING *
  `;
  return result[0];
}

export async function deleteAct(actId: string) {
  await sql`DELETE FROM acts WHERE id = ${actId}`;
}

// Volume Memory queries
export async function saveVolumeMemory(volumeId: string, memory: Partial<VolumeMemory>) {
  const result = await sql`
    INSERT INTO volume_memory (
      volume_id, unresolved_arcs, character_progression, relationship_evolution,
      thematic_threads, promises_made, promises_fulfilled
    )
    VALUES (
      ${volumeId}, ${JSON.stringify(memory.unresolvedArcs || [])},
      ${JSON.stringify(memory.characterProgression || {})}, ${memory.relationshipEvolution || null},
      ${JSON.stringify(memory.thematicThreads || [])}, ${JSON.stringify(memory.promisesMade || [])},
      ${JSON.stringify(memory.promisesFulfilled || [])}
    )
    ON CONFLICT (volume_id)
    DO UPDATE SET
      unresolved_arcs = EXCLUDED.unresolved_arcs,
      character_progression = EXCLUDED.character_progression,
      relationship_evolution = EXCLUDED.relationship_evolution,
      thematic_threads = EXCLUDED.thematic_threads,
      promises_made = EXCLUDED.promises_made,
      promises_fulfilled = EXCLUDED.promises_fulfilled,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  return result[0];
}

export async function getVolumeMemory(volumeId: string): Promise<VolumeMemory | null> {
  const result = await sql`
    SELECT * FROM volume_memory WHERE volume_id = ${volumeId}
  `;
  
  if (result.length === 0) return null;
  
  const row = result[0];
  return {
    id: row.id.toString(),
    volumeId: row.volume_id.toString(),
    unresolvedArcs: row.unresolved_arcs,
    characterProgression: row.character_progression,
    relationshipEvolution: row.relationship_evolution,
    thematicThreads: row.thematic_threads,
    promisesMade: row.promises_made,
    promisesFulfilled: row.promises_fulfilled,
    updatedAt: row.updated_at.toISOString(),
  };
}

// Act Memory queries
export async function saveActMemory(actId: string, memory: Partial<ActMemory>) {
  const result = await sql`
    INSERT INTO act_memory (
      act_id, current_tension_level, emotional_direction, active_conflicts,
      proximity_events, misunderstandings
    )
    VALUES (
      ${actId}, ${memory.currentTensionLevel || 5}, ${memory.emotionalDirection || null},
      ${JSON.stringify(memory.activeConflicts || [])}, ${JSON.stringify(memory.proximityEvents || [])},
      ${JSON.stringify(memory.misunderstandings || [])}
    )
    ON CONFLICT (act_id)
    DO UPDATE SET
      current_tension_level = EXCLUDED.current_tension_level,
      emotional_direction = EXCLUDED.emotional_direction,
      active_conflicts = EXCLUDED.active_conflicts,
      proximity_events = EXCLUDED.proximity_events,
      misunderstandings = EXCLUDED.misunderstandings,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  return result[0];
}

export async function getActMemory(actId: string): Promise<ActMemory | null> {
  const result = await sql`
    SELECT * FROM act_memory WHERE act_id = ${actId}
  `;
  
  if (result.length === 0) return null;
  
  const row = result[0];
  return {
    id: row.id.toString(),
    actId: row.act_id.toString(),
    currentTensionLevel: row.current_tension_level,
    emotionalDirection: row.emotional_direction,
    activeConflicts: row.active_conflicts,
    proximityEvents: row.proximity_events,
    misunderstandings: row.misunderstandings,
    updatedAt: row.updated_at.toISOString(),
  };
}
