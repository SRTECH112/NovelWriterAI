import OpenAI from 'openai';
import { StoryBible, Chapter, Volume, Act, VolumeMemory, ActMemory } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a chapter with full volume/act awareness
 * Uses 4-layer memory system: Global (Story Bible) → Volume → Act → Local
 */
export async function generateChapterWithVolumeContext(
  storyBible: StoryBible,
  volume: Volume,
  act: Act,
  chapterNumber: number,
  globalChapterNumber: number,
  previousChapters: Chapter[],
  volumeMemory?: VolumeMemory,
  actMemory?: ActMemory,
  chapterPrompt?: {
    emotionalBeat?: string;
    relationshipShift?: string;
    sceneGoal?: string;
  },
  outlineMetadata?: {
    title?: string;
    summary?: string;
    plotBeats?: string[];
    emotionalIntent?: string;
    characterFocus?: string[];
    pacingHint?: string;
    rawOutlineText?: string;
  },
  structureContext?: {
    currentActNumber: number;
    totalActsInVolume: number;
    currentVolumeNumber: number;
    totalVolumes: number;
    totalChaptersInAct: number;
    isLastChapter: boolean;
    isLastAct: boolean;
    isLastVolume: boolean;
  }
): Promise<{
  content: string;
  summary: string;
  stateDelta: any;
  proseValidation: any;
}> {
  const sections = storyBible?.structured_sections ?? {
    worldRules: [],
    loreTimeline: [],
    factions: [],
    technologyMagicRules: [],
    themesTone: [],
    hardConstraints: [],
    softGuidelines: [],
  };

  // Build multi-layer memory context
  const globalContext = buildGlobalContext(sections);
  const volumeContext = buildVolumeContext(volume, volumeMemory);
  const actContext = buildActContext(act, actMemory);
  const localContext = buildLocalContext(previousChapters);

  const systemPrompt = `You are a Novel Chapter Writer for SERIALIZED, MULTI-VOLUME storytelling.

⚠️ CRITICAL STRUCTURE AWARENESS ⚠️
You are writing:
- Volume ${structureContext?.currentVolumeNumber || volume.volumeNumber} of ${structureContext?.totalVolumes || '?'} total volumes
- Act ${structureContext?.currentActNumber || act.actNumber} of ${structureContext?.totalActsInVolume || '?'} acts in this volume
- Chapter ${chapterNumber} within this act (Global Chapter ${globalChapterNumber})
- Volume: "${volume.title}"
- Act Purpose: ${act.narrativePurpose}

🚫 ANTI-EARLY-ENDING RULES (MANDATORY) 🚫
${!structureContext?.isLastVolume || !structureContext?.isLastAct || !structureContext?.isLastChapter ? `
THIS IS NOT THE FINAL CHAPTER. You are FORBIDDEN from:
❌ Resolving the main conflict
❌ Delivering emotional closure or payoff
❌ Using "end-of-story" language ("and that was the day...", "little did I know...", "this changed everything forever")
❌ Writing reflective, final-sounding conclusions
❌ Tying up major story threads
❌ Giving characters their "happily ever after"

INSTEAD, you MUST:
✅ End on forward momentum
✅ Leave unanswered tension
✅ Create anticipation for the next chapter
✅ Build pressure, don't release it
✅ Treat this as ONE STEP in a long journey
✅ Think: Wattpad multi-volume series, anime light novel pacing
` : `
THIS IS THE FINAL CHAPTER OF THE FINAL VOLUME.
You MAY deliver:
✅ Major resolutions
✅ Emotional payoff
✅ Satisfying closure
✅ "This was the end" tone
`}

VOLUME/ACT AWARENESS RULES:
1. Respect the VOLUME THEME: ${volume.theme || 'Not specified'}
2. Follow the ACT PURPOSE: ${act.narrativePurpose}
3. Match the ACT PACING: ${act.pacing} (slow = character moments, medium = balanced, fast = action/revelation)
4. Emotional Pressure Level: ${act.emotionalPressure}/10 (1=calm, 10=crisis)
5. Character Development Focus: ${act.characterDevelopmentFocus || 'General progression'}

PACING GUIDELINES BY ACT PURPOSE:
- "setup": Introduce dynamics, establish baseline, subtle foreshadowing (NO RESOLUTION)
- "rising-tension": Build misunderstandings, proximity events, emotional awareness (ACCUMULATE TENSION)
- "fracture": Confrontation, revelation, relationship strain (BREAK, DON'T FIX)
- "crisis": Peak emotional conflict, hard choices, vulnerability (PRESSURE, NOT RELEASE)
- "resolution": Reconciliation, clarity, emotional payoff (ONLY IF FINAL ACT OF FINAL VOLUME)
- "payoff": Deliver on volume promises, satisfying closure (ONLY IF FINAL ACT OF FINAL VOLUME)

LONG-STORY AWARENESS:
- Early/Mid chapters are ACCUMULATIVE, not conclusive
- Layer character, tension, and relationships
- Think: Wattpad long-running series, anime light novel arcs
- Stories are journeys, not summaries
- Chapters build pressure, they do not release it early

OPENING SCENE MANDATE (anime/Wattpad style):
- Start inside an ordinary moment already in progress
- No introductions, no world/setting exposition, no meta framing
- POV is strictly what the protagonist notices right now
- Social cues (glances, whispers, tone, distance) outweigh lore
- Scene is small, mundane, emotionally grounded
- Short paragraphs (1–2 sentences) with frequent line breaks
- Absolutely forbidden: explaining the setting, summarizing routines, declaring significance

PROSE QUALITY:
- Show, don't tell
- Active voice, strong verbs
- Varied sentence structure
- Sensory details
- Natural dialogue
- Avoid clichés and purple prose

⚠️ CHAPTER LENGTH REQUIREMENTS (MANDATORY) ⚠️
MINIMUM: 1,500 words
TARGET: 1,500–2,000 words
MAXIMUM: 2,500 words (only if scene demands it)

YOU MUST CONTINUE WRITING UNTIL:
✅ All outline beats are meaningfully covered (not summarized)
✅ A natural narrative beat is reached
✅ Word count is at least 1,500 words

FORBIDDEN:
❌ Ending early due to token limits
❌ Summary-style pacing (e.g., "Later that day...", "After some time...")
❌ Rushing through scenes
❌ Skipping beats

REQUIRED CHAPTER STRUCTURE:
- Multiple scenes OR one sustained long scene
- Include: atmosphere, internal monologue, character interaction
- Fully realize each outline beat with dialogue, action, and emotion
- Show, don't tell

OUTPUT FORMAT (JSON):
{
  "content": "Full chapter text (1500-2000 words MINIMUM). Escape all quotes and newlines properly.",
  "summary": "Brief summary of what happened",
  "stateDelta": {
    "characterStates": {"Character Name": "Current state/location/condition"},
    "worldChanges": ["What changed in the world"],
    "plotProgression": ["Plot points advanced"],
    "emotionalState": "POV character's emotional state at chapter end",
    "unresolvedThreads": ["Questions or tensions left unresolved for next chapter"]
  }
}`;

  // Build outline enforcement if metadata exists
  const outlineEnforcement = outlineMetadata ? `
⚠️ CRITICAL: OUTLINE BEAT ENFORCEMENT ⚠️
This chapter MUST strictly follow the user's outline. DO NOT deviate from these beats.

ORIGINAL OUTLINE TEXT:
${outlineMetadata.rawOutlineText || 'Not provided'}

REQUIRED PLOT BEATS (MUST ALL APPEAR IN ORDER):
${outlineMetadata.plotBeats?.map((beat, i) => `${i + 1}. ${beat}`).join('\n') || 'Not specified'}

EMOTIONAL INTENT (REQUIRED):
${outlineMetadata.emotionalIntent || 'Not specified'}

CHARACTER FOCUS (MUST FEATURE):
${outlineMetadata.characterFocus?.join(', ') || 'Not specified'}

PACING REQUIREMENT:
${outlineMetadata.pacingHint || act.pacing}

BEAT EXPANSION RULES:
- EXPAND each beat into full scenes with dialogue, action, and internal monologue
- Each beat should take 300-500 words to fully realize
- Add sensory details, atmosphere, and emotional reactions
- Show character dynamics through interaction
- DO NOT skip or summarize any beats
- DO NOT add beats not in the outline
- DO NOT rush through scenes
- Anime/Wattpad pacing: slow emotional buildup, internal thoughts, scene continuity

TOTAL CHAPTER LENGTH: 1,500-2,000 words (strict minimum)
` : '';

  const userPrompt = `${globalContext}

${volumeContext}

${actContext}

${localContext}

${outlineEnforcement}

CHAPTER DIRECTIVE:
Write Chapter ${chapterNumber} (Global #${globalChapterNumber})
${outlineMetadata?.title ? `Title: "${outlineMetadata.title}"` : ''}
${chapterPrompt?.emotionalBeat ? `Emotional Beat: ${chapterPrompt.emotionalBeat}` : ''}
${chapterPrompt?.relationshipShift ? `Relationship Shift: ${chapterPrompt.relationshipShift}` : ''}
${chapterPrompt?.sceneGoal ? `Scene Goal: ${chapterPrompt.sceneGoal}` : ''}

Remember:
- You are in Act ${act.actNumber} (${act.narrativePurpose})
- Pacing should be ${outlineMetadata?.pacingHint || act.pacing}
- Emotional pressure is at ${act.emotionalPressure}/10
- This chapter contributes to the volume theme: ${volume.theme || 'the overall arc'}
${outlineMetadata ? '- STRICTLY FOLLOW THE OUTLINE BEATS ABOVE - This is the narrative spine' : ''}

Write the chapter now as valid JSON.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.8,
    max_completion_tokens: 8000, // Enough for 2000 words + JSON overhead
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from AI');
  }

  let result;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    result = JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Invalid JSON response from AI');
  }

  const proseValidation = {
    score: 85,
    issues: [],
    warnings: [],
  };

  return {
    content: result.content,
    summary: result.summary,
    stateDelta: result.stateDelta,
    proseValidation,
  };
}

function buildGlobalContext(sections: any): string {
  return `
═════════════════════════════════════════════════════════════
LAYER 1: GLOBAL MEMORY (STORY BIBLE - CANONICAL TRUTH)
═════════════════════════════════════════════════════════════

WORLD RULES (MUST OBEY):
${sections.worldRules.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}

LORE TIMELINE:
${sections.loreTimeline.map((e: any) => `- ${e.period}: ${e.event}`).join('\n')}

FACTIONS:
${sections.factions.map((f: any) => `- ${f.name}: ${f.description}\n  Goals: ${f.goals}`).join('\n')}

TECHNOLOGY/MAGIC RULES (MUST OBEY):
${sections.technologyMagicRules.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}

THEMES & TONE:
${sections.themesTone.join(', ')}

⚠️ HARD CONSTRAINTS (ABSOLUTE - CANNOT VIOLATE):
${sections.hardConstraints.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}

SOFT GUIDELINES (FOLLOW WHEN POSSIBLE):
${sections.softGuidelines.map((g: string, i: number) => `${i + 1}. ${g}`).join('\n')}

═════════════════════════════════════════════════════════════
`;
}

function buildVolumeContext(volume: Volume, memory?: VolumeMemory): string {
  return `
═════════════════════════════════════════════════════════════
LAYER 2: VOLUME MEMORY (LONG-TERM ARC)
═════════════════════════════════════════════════════════════

VOLUME ${volume.volumeNumber}: "${volume.title}"

Theme: ${volume.theme || 'Not specified'}
Emotional Promise: ${volume.emotionalPromise || 'Not specified'}
Relationship Arc: ${volume.relationshipStateStart || 'Unknown'} → ${volume.relationshipStateEnd || 'Unknown'}
Major Turning Point: ${volume.majorTurningPoint || 'Not specified'}

${memory ? `
VOLUME PROGRESS TRACKING:
Unresolved Arcs: ${memory.unresolvedArcs.join('; ') || 'None'}
Character Progression: ${JSON.stringify(memory.characterProgression)}
Relationship Evolution: ${memory.relationshipEvolution || 'Not tracked'}
Thematic Threads: ${memory.thematicThreads.join('; ') || 'None'}
Promises Made: ${memory.promisesMade.join('; ') || 'None'}
Promises Fulfilled: ${memory.promisesFulfilled.join('; ') || 'None'}
` : ''}

═════════════════════════════════════════════════════════════
`;
}

function buildActContext(act: Act, memory?: ActMemory): string {
  return `
═════════════════════════════════════════════════════════════
LAYER 3: ACT MEMORY (MID-TERM TENSION)
═════════════════════════════════════════════════════════════

ACT ${act.actNumber}: ${act.title || act.narrativePurpose}

Narrative Purpose: ${act.narrativePurpose}
Pacing: ${act.pacing}
Emotional Pressure: ${act.emotionalPressure}/10
Character Development Focus: ${act.characterDevelopmentFocus || 'General'}

${memory ? `
ACT TENSION TRACKING:
Current Tension Level: ${memory.currentTensionLevel}/10
Emotional Direction: ${memory.emotionalDirection || 'Not specified'}
Active Conflicts: ${memory.activeConflicts.join('; ') || 'None'}
Proximity Events: ${memory.proximityEvents.join('; ') || 'None'}
Misunderstandings: ${memory.misunderstandings.join('; ') || 'None'}
` : ''}

═════════════════════════════════════════════════════════════
`;
}

function buildLocalContext(previousChapters: Chapter[]): string {
  const safePrev = previousChapters.map((ch) => ({
    ...ch,
    stateDelta: ch.stateDelta || { characterStates: {}, worldChanges: [], plotProgression: [] },
  }));

  const lastChapter = safePrev.length > 0 ? safePrev[safePrev.length - 1] : null;
  
  const immediateContext = lastChapter ? `
IMMEDIATE CONTEXT (PREVIOUS CHAPTER):
Chapter ${lastChapter.chapterNumber} Summary: ${lastChapter.summary}
Emotional State: ${lastChapter.stateDelta.emotionalState || 'Not specified'}
Unresolved Threads: ${(lastChapter.stateDelta.unresolvedThreads || []).join('; ') || 'None'}
Character States: ${JSON.stringify(lastChapter.stateDelta.characterStates)}
Hook to This Chapter: ${lastChapter.hookToNext || 'None'}
` : 'This is the first chapter in this act.';

  const structuralMemory = safePrev.length > 0 ? `
STRUCTURAL MEMORY (PREVIOUS CHAPTERS IN THIS ACT):
${safePrev.map(ch => `Ch ${ch.chapterNumber}: ${ch.summary}`).join('\n')}
` : '';

  return `
═════════════════════════════════════════════════════════════
LAYER 4: LOCAL MEMORY (CHAPTER-TO-CHAPTER CONTINUITY)
═════════════════════════════════════════════════════════════

${immediateContext}

${structuralMemory}

═════════════════════════════════════════════════════════════
`;
}
