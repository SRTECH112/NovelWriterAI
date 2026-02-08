import OpenAI from 'openai';
import { StoryBible, Chapter, Volume, Act, Page } from '@/lib/types';
import { formatProse } from '@/lib/format-prose';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a single page (600-900 words, 1-2 micro-beats only)
 * CRITICAL: Pages are the ONLY writable unit. Never generate full chapters.
 */
export async function generatePage(
  storyBible: StoryBible,
  volume: Volume,
  act: Act,
  chapter: Chapter,
  pageNumber: number,
  previousPages: Page[],
  chapterOutline?: string,
  volumeOutline?: string,
  structureContext?: {
    currentActNumber: number;
    totalActsInVolume: number;
    currentVolumeNumber: number;
    totalVolumes: number;
    isLastChapter: boolean;
    isLastAct: boolean;
    isLastVolume: boolean;
  }
): Promise<{
  content: string;
  beatCoverage: string;
  narrativeMomentum: string;
  wordCount: number;
}> {
  const sections = storyBible?.structured_sections ?? {
    worldRules: [],
    loreTimeline: [],
    factions: [],
    technologyMagicRules: [],
    themesTone: [],
    hardConstraints: [],
    characterProfiles: [],
    relationshipDynamics: [],
  };

  const isFirstPage = pageNumber === 1;
  const isLastPage = pageNumber === chapter.targetPageCount;
  const totalPages = chapter.targetPageCount;

  const systemPrompt = `You are a Page Writer for SERIALIZED, MULTI-VOLUME web novels.

🚨 CRITICAL RULES (NON-NEGOTIABLE) 🚨

1. YOU ARE WRITING PAGE ${pageNumber} OF ${totalPages}
2. EACH PAGE IS 600-900 WORDS (STRICT)
3. EACH PAGE COVERS 1-2 MICRO-BEATS ONLY
4. YOU MUST NEVER FINISH THE CHAPTER EARLY
5. PAGES ARE THE ONLY WRITABLE UNIT

⚠️ STRUCTURE AWARENESS ⚠️
- Volume ${structureContext?.currentVolumeNumber || volume.volumeNumber} of ${structureContext?.totalVolumes || '?'} total volumes
- Act ${structureContext?.currentActNumber || act.actNumber} of ${structureContext?.totalActsInVolume || '?'} acts
- Chapter ${chapter.chapterNumber}: "${chapter.title || 'Untitled'}"
- Page ${pageNumber} of ${totalPages} pages
- Target chapter length: ${chapter.targetWordCount} words (${totalPages} pages × 700 words avg)

${volumeOutline ? `
🚨 VOLUME OUTLINE (BINDING) 🚨
${volumeOutline}

YOU MUST FOLLOW THE VOLUME OUTLINE STRICTLY.
` : ''}

${chapterOutline ? `
📋 CHAPTER OUTLINE (BINDING) 📋
${chapterOutline}

BREAK THIS OUTLINE INTO ${totalPages} PAGES:
${isFirstPage ? '- Page 1: Opening beats' : ''}
${pageNumber === 2 && totalPages >= 3 ? '- Page 2: Escalation beats' : ''}
${pageNumber === 3 && totalPages >= 4 ? '- Page 3: Turning beat' : ''}
${pageNumber === totalPages - 1 && totalPages >= 4 ? `- Page ${totalPages - 1}: Pre-climax tension` : ''}
${isLastPage ? `- Page ${totalPages}: Climax (final page only)` : ''}

YOU ARE WRITING PAGE ${pageNumber}.
COVER ONLY THE BEATS ASSIGNED TO THIS PAGE.
` : ''}

${previousPages.length > 0 ? `
📖 PREVIOUS PAGE CONTEXT 📖
Last page ended with:
${previousPages[previousPages.length - 1].content.slice(-500)}

Beat coverage so far: ${previousPages.map(p => p.beatCoverage).filter(Boolean).join(', ')}

YOU MUST CONTINUE SEAMLESSLY FROM THE LAST PAGE.
NO TIME JUMPS. NO SCENE SKIPS.
` : ''}

🚫 HARD FAIL CONDITIONS (WILL BLOCK GENERATION) 🚫

YOU WILL TRIGGER AN ERROR IF YOU:
❌ Write more than 900 words (page too long)
❌ Write less than 600 words (page too short)
❌ Try to finish the chapter early (unless page ${totalPages})
❌ Introduce events from the next chapter
❌ Resolve volume-level arcs (unless final volume)
❌ Skip outlined beats
❌ Jump ahead in time
❌ Resolve relationship turning points prematurely

${!isLastPage ? `
⚠️ THIS IS NOT THE FINAL PAGE ⚠️
YOU ARE FORBIDDEN FROM:
❌ Resolving the chapter climax
❌ Providing emotional closure
❌ Using conclusive language
❌ Wrapping up the scene

YOU MUST:
✅ End with narrative momentum
✅ Leave tension unresolved
✅ Create anticipation for next page
✅ Stop at a natural micro-beat boundary
` : `
✅ THIS IS THE FINAL PAGE (${totalPages}) ✅
YOU MAY:
✅ Resolve the chapter climax
✅ Complete the chapter arc
✅ Deliver emotional payoff for THIS chapter only

BUT STILL FORBIDDEN:
❌ Resolving volume-level conflicts
❌ Resolving act-level arcs
❌ Using "happily ever after" language
`}

⚠️ PARAGRAPH FORMATTING (MANDATORY) ⚠️
✅ Blank line between EVERY paragraph (use \\n\\n)
✅ Dialogue ALWAYS starts a new paragraph
✅ NO paragraph longer than 4-5 sentences
✅ Each dialogue exchange gets its own paragraph

📏 PAGE LENGTH REQUIREMENTS 📏
MINIMUM: 600 words (STRICT)
TARGET: 700-800 words
MAXIMUM: 900 words (STRICT)

WORD COUNT ENFORCEMENT:
- Count words as you write
- Stop at 700-900 words
- Do NOT exceed 900 words
- Do NOT stop before 600 words

✍️ WRITING STYLE ✍️
- Wattpad romance pacing
- Light-novel introspection
- Anime-style scene progression
- Slow emotional buildup
- Internal thoughts and reactions
- Sensory details and atmosphere

FORBIDDEN:
❌ Speed-running plots
❌ One-page emotional resolutions
❌ "The End" style closures
❌ Summary-style narration

🎯 MICRO-BEAT COVERAGE 🎯
Each page should cover 1-2 micro-beats:
- A micro-beat is a small story moment (dialogue exchange, action, realization)
- Expand each micro-beat with: dialogue, internal monologue, sensory details, emotional reactions
- Take 300-450 words per micro-beat
- Do NOT rush through beats

STORY BIBLE CONTEXT:
World Rules: ${sections.worldRules?.slice(0, 3).join('; ') || 'Not specified'}
Themes: ${sections.themesTone?.slice(0, 3).join(', ') || 'Not specified'}
Characters: ${sections.characterProfiles?.map((c: any) => c.name).slice(0, 3).join(', ') || 'Not specified'}

OUTPUT FORMAT (strict JSON):
{
  "content": "The actual page content (600-900 words, properly formatted with \\n\\n between paragraphs)",
  "beatCoverage": "Brief description of which micro-beats this page covers",
  "narrativeMomentum": "How this page ends and what tension it creates for the next page",
  "wordCount": 750
}`;

  const userPrompt = `Write Page ${pageNumber} of ${totalPages} for Chapter ${chapter.chapterNumber}.

${isFirstPage ? 'This is the FIRST page. Set the scene and introduce the opening beats.' : ''}
${isLastPage ? 'This is the FINAL page. Deliver the chapter climax and resolution.' : ''}
${!isFirstPage && !isLastPage ? `This is a MIDDLE page. Continue the story from the previous page and advance 1-2 micro-beats.` : ''}

Chapter: ${chapter.title || `Chapter ${chapter.chapterNumber}`}
${chapter.emotionalBeat ? `Emotional Beat: ${chapter.emotionalBeat}` : ''}
${chapter.sceneGoal ? `Scene Goal: ${chapter.sceneGoal}` : ''}

TARGET: 700-800 words
STRICT LIMITS: 600 minimum, 900 maximum

Write the page now as valid JSON.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.8,
    max_completion_tokens: 4000, // Enough for 900 words + JSON overhead
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

  // Validate word count
  const wordCount = result.content.split(/\s+/).length;
  
  if (wordCount < 600) {
    throw new Error(`Page too short: ${wordCount} words (minimum 600 required)`);
  }
  
  if (wordCount > 900) {
    throw new Error(`Page too long: ${wordCount} words (maximum 900 allowed)`);
  }

  // Apply automatic paragraph formatting
  const formattedContent = formatProse(result.content);

  return {
    content: formattedContent,
    beatCoverage: result.beatCoverage || `Page ${pageNumber} beats`,
    narrativeMomentum: result.narrativeMomentum || 'Continues to next page',
    wordCount,
  };
}
