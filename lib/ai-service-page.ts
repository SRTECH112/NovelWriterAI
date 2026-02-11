import OpenAI from 'openai';
import { StoryBible, Chapter, Volume, Act, Page } from '@/lib/types';
import { formatProse } from '@/lib/format-prose';
import { parseCharacters, formatCharacterCanonForAI } from '@/lib/parse-characters';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Intelligently truncate volume outline to keep it within token limits
 * while preserving the most relevant context for the current chapter
 */
function truncateVolumeOutlineForContext(
  volumeOutline: string,
  currentChapterNumber: number,
  totalChapters: number
): string {
  const maxLength = 3000; // Max characters for volume outline
  
  if (volumeOutline.length <= maxLength) {
    return volumeOutline;
  }

  // Split outline into sections (by chapter if possible)
  const lines = volumeOutline.split('\n');
  
  // Calculate which portion of the outline is most relevant
  const progressRatio = currentChapterNumber / totalChapters;
  
  // Keep beginning (setup), relevant middle section, and end (destination)
  const keepStart = Math.floor(lines.length * 0.2); // First 20%
  const keepEnd = Math.floor(lines.length * 0.1); // Last 10%
  
  // Calculate middle section around current position
  const middleStart = Math.max(keepStart, Math.floor(lines.length * progressRatio) - 10);
  const middleEnd = Math.min(lines.length - keepEnd, Math.floor(lines.length * progressRatio) + 10);
  
  const relevantLines = [
    ...lines.slice(0, keepStart),
    '\n[... earlier chapters omitted for brevity ...]\n',
    ...lines.slice(middleStart, middleEnd),
    '\n[... later chapters omitted for brevity ...]\n',
    ...lines.slice(-keepEnd)
  ];
  
  let truncated = relevantLines.join('\n');
  
  // If still too long, do a hard truncate
  if (truncated.length > maxLength) {
    truncated = truncated.substring(0, maxLength) + '\n\n[... outline truncated due to length ...]';
  }
  
  return truncated;
}

/**
 * Generate a single page (600-900 words, 1-2 micro-beats only)
 * CRITICAL: Pages are the ONLY writable unit. Never generate full chapters.
 * Structure: Volume → Chapter → Page (no Acts)
 */
export async function generatePage(
  storyBible: StoryBible,
  volume: Volume,
  chapter: Chapter,
  pageNumber: number,
  previousPages: Page[],
  chapterOutline?: string,
  volumeOutline?: string,
  structureContext?: {
    currentVolumeNumber: number;
    totalVolumes: number;
    currentChapterNumber: number;
    totalChaptersInVolume: number;
    isLastChapter: boolean;
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
- Chapter ${structureContext?.currentChapterNumber || chapter.chapterNumber} of ${structureContext?.totalChaptersInVolume || '?'} chapters in this volume
- Chapter Title: "${chapter.title || 'Untitled'}"
- Page ${pageNumber} of ${totalPages} pages
- Target chapter length: ${chapter.targetWordCount} words (${totalPages} pages × 700 words avg)
${chapter.actTag ? `- Act Tag: ${chapter.actTag} (metadata only)` : ''}

${volumeOutline ? `
🚨 VOLUME OUTLINE (HARD BOUNDARY - NON-NEGOTIABLE) 🚨
${truncateVolumeOutlineForContext(volumeOutline, chapter.chapterNumber, structureContext?.totalChaptersInVolume || 10)}

⚠️ OUTLINE AUTHORITY HIERARCHY (MANDATORY) ⚠️
1. Story Bible (themes, rules, tone) - CANONICAL
2. Volume Outline (HARD CONSTRAINT) - YOU ARE HERE
3. Chapter Outline (tactical guidance)
4. Page Context (last 17 pages)

🔒 HARD VOLUME CONSTRAINT RULES:
✅ The volume outline is a HARD BOUNDARY, not a suggestion
✅ You may ONLY write what the volume outline permits
✅ You may NOT invent new arcs, conflicts, or resolutions outside this outline
✅ You may NOT expand the story beyond the final outlined chapter
✅ This is Volume ${structureContext?.currentVolumeNumber || volume.volumeNumber} of ${structureContext?.totalVolumes || '?'} - treat it as ONE PART of a larger story

❌ FORBIDDEN:
❌ Treating this volume as the complete story
❌ Introducing new long-term arcs not in the outline
❌ Resolving story-wide conflicts prematurely
❌ Expanding beyond outlined scope "for completeness"
❌ Assuming no future volumes exist

IF THE OUTLINE ENDS, YOU STOP. NO EXCEPTIONS.
` : ''}

${chapterOutline ? `
📋 CHAPTER OUTLINE (BINDING) 📋
${chapterOutline}

BREAK THIS OUTLINE INTO ${totalPages} PAGES:
${isFirstPage ? '- Page 1: Opening beats' : ''}
` : ''}

${previousPages.length > 0 ? `
📖 PREVIOUS PAGES IN THIS CHAPTER (LAST ${Math.min(previousPages.length, 17)} PAGES):
${previousPages.slice(-17).map(p => `
--- Page ${p.pageNumber} (${p.wordCount} words) ---
${p.content}

Beat Coverage: ${p.beatCoverage || 'N/A'}
Narrative Momentum: ${p.narrativeMomentum || 'N/A'}
`).join('\n')}

🔗 PAGE-TO-PAGE CONTINUITY ENFORCEMENT (CRITICAL)
Page ${pageNumber} MUST:
✅ Begin EXACTLY where Page ${pageNumber - 1} ended
✅ Continue the same scene, beat, thought, or action
✅ Maintain scene location, emotional tone, ongoing dialogue
✅ Reference the immediate aftermath of the previous page's ending
✅ Treat this as a hard line break, NOT a chapter break

FORBIDDEN ACTIONS:
❌ Time skips (unless outline explicitly requires)
❌ Scene resets or location changes without transition
❌ Re-explaining the premise or re-describing the setting
❌ Reintroducing characters as if they just appeared
❌ Using "Later that day..." or "Meanwhile..." without outline permission
❌ Forgetting actions or dialogue from the last 2-3 pages
❌ Abruptly changing tone or pacing

✍️ CONTINUATION RULES:
First paragraph of Page ${pageNumber} must:
- Reference the immediate aftermath of Page ${pageNumber - 1}'s ending
- Continue the same beat, thought, or action
- Use soft transitions, ongoing internal monologue, or dialogue continuation
- Feel like a natural continuation, not a new section

Page ending should:
- Slightly hook forward to the next page
- Never fully resolve the scene (unless this is the final page)
- Leave dialogue, thoughts, or actions mid-flow when appropriate
` : 'This is the FIRST page of the chapter. Set the opening scene and establish the initial situation.'}

🎭 PACING RULES (CRITICAL)
${!structureContext?.isLastChapter ? `
✅ Slow burn pacing
✅ Gradual emotional buildup
✅ Leave major conflicts unresolved
✅ End with forward momentum
✅ Tease future developments

❌ No major resolutions
❌ No relationship breakthroughs (save for later volumes)
❌ No "happily ever after" moments
❌ No premature climaxes
❌ Resolving act-level arcs
❌ Using "happily ever after" language
` : `
🚨 FINAL CHAPTER OF VOLUME ${structureContext?.currentVolumeNumber || volume.volumeNumber} 🚨

✅ Resolve ONLY what the volume outline specifies for this chapter
✅ Create emotional pause or soft cliff
✅ Provide thematic closure for THIS VOLUME ONLY
✅ Maintain tension for future volumes
✅ End with forward momentum toward next volume

❌ DO NOT resolve the entire story
❌ DO NOT introduce endgame themes
❌ DO NOT wrap up story-wide conflicts
❌ DO NOT time-skip to endings
❌ DO NOT provide confession payoffs unless outlined
❌ DO NOT write marriage/final resolution unless explicitly stated in outline
❌ DO NOT treat this as the story's conclusion

🔒 VOLUME COMPLETION RULES:
This is the FINAL CHAPTER of Volume ${structureContext?.currentVolumeNumber || volume.volumeNumber}, NOT the final chapter of the story.
- Focus on emotional containment and transition
- The volume should feel complete but NOT final
- Leave room for future volumes to continue the story
- End intentionally, not abruptly
`}

⚠️ PARAGRAPH FORMATTING (MANDATORY) ⚠️
✅ Blank line between EVERY paragraph (use \\n\\n)
✅ Dialogue ALWAYS starts a new paragraph
✅ NO paragraph longer than 4-5 sentences
✅ Each dialogue exchange gets its own paragraph

📏 WORD COUNT REQUIREMENT 📏
CRITICAL: This page MUST be between 600-1200 words.
- Target: ~1000 words
- Minimum: 600 words (HARD FLOOR)
- Maximum: 1200 words (HARD CEILING)
- Count every word carefully
- If you're under 600 words, you MUST expand with more detail, dialogue, or internal monologue
- If you're over 1200 words, you MUST cut content or split into next page

✍️ WRITING STYLE ✍️
- Wattpad romance pacing
- Light-novel introspection
- Anime-style scene progression
- Slow emotional buildup
- Internal thoughts and reactions
- Sensory details and atmosphere
- Pages feel like continuous flow, not stitched segments

FORBIDDEN:
❌ Speed-running plots
❌ One-page emotional resolutions
❌ "The End" style closures
❌ Summary-style narration
❌ Standalone pages that don't flow from previous content
❌ Repeating exposition already stated in prior pages

🎯 MICRO-BEAT COVERAGE 🎯
Each page should cover 1-2 micro-beats:
- A micro-beat is a small story moment (dialogue exchange, action, realization)
- Expand each micro-beat with: dialogue, internal monologue, sensory details, emotional reactions
- Take 500-600 words per micro-beat
- Do NOT rush through beats
- Beats should flow naturally from the previous page's momentum

✅ SUCCESS INDICATORS:
- Page ${pageNumber} reads like a natural continuation of Page ${pageNumber - 1}
- Dialogue can span multiple pages without reset
- Emotional arcs build gradually across pages
- The chapter feels like a continuous novella, not fragments

STORY BIBLE CONTEXT:
${storyBible.characters ? formatCharacterCanonForAI(parseCharacters(storyBible.characters)) : ''}
${storyBible.settings ? `
🌍 SETTINGS & WORLD (CANONICAL):
${storyBible.settings}
` : ''}
World Rules: ${sections.worldRules?.slice(0, 3).join('; ') || 'Not specified'}
Themes: ${sections.themesTone?.slice(0, 3).join(', ') || 'Not specified'}

OUTPUT FORMAT (strict JSON):
{
  "content": "The actual page content (600-1200 words, properly formatted with \\n\\n between paragraphs)",
  "beatCoverage": "Brief description of which micro-beats this page covers",
  "narrativeMomentum": "How this page ends and what tension it creates for the next page",
  "wordCount": 1000
}`;

  const userPrompt = `Write Page ${pageNumber} of ${totalPages} for Chapter ${chapter.chapterNumber}.

${isFirstPage ? `🎬 FIRST PAGE INSTRUCTIONS:
- Set the scene and establish the opening situation
- Introduce characters naturally in their environment
- Begin the chapter's emotional journey
- Create forward momentum for the next pages` : ''}

${!isFirstPage && !isLastPage ? `🔗 CONTINUATION PAGE INSTRUCTIONS:
- Begin EXACTLY where Page ${pageNumber - 1} ended
- DO NOT reset the scene or reintroduce characters
- Continue ongoing dialogue, thoughts, or actions seamlessly
- Maintain the same emotional tone and scene location
- Advance 1-2 micro-beats while preserving narrative flow
- The reader should NOT feel a break between pages` : ''}

${isLastPage && structureContext?.isLastChapter ? `🎯 FINAL PAGE OF VOLUME ${structureContext?.currentVolumeNumber || volume.volumeNumber} INSTRUCTIONS:
- Continue seamlessly from Page ${pageNumber - 1}
- Deliver the chapter's emotional climax AS OUTLINED
- Resolve ONLY the chapter-level tension specified in the outline
- End with emotional pause, soft cliff, or thematic closure
- Create forward momentum toward the NEXT VOLUME

🚨 CRITICAL VOLUME BOUNDARY ENFORCEMENT:
❌ DO NOT resolve the entire story
❌ DO NOT resolve volume-level arcs beyond what the outline specifies
❌ DO NOT introduce endgame themes or final resolutions
❌ DO NOT write as if this is the story's conclusion
❌ DO NOT time-skip to endings or "happily ever after"
❌ DO NOT provide major confessions/breakthroughs unless explicitly outlined

✅ This volume should feel complete but NOT final
✅ Leave major story threads open for future volumes
✅ Focus on emotional containment and transition
✅ End intentionally, not abruptly` : isLastPage ? `🎯 FINAL PAGE INSTRUCTIONS:
- Continue seamlessly from Page ${pageNumber - 1}
- Deliver the chapter's emotional climax
- Resolve the chapter-level tension
- Create a hook for the next chapter
- DO NOT resolve volume-level arcs
- Maintain forward momentum` : ''}

Chapter: ${chapter.title || `Chapter ${chapter.chapterNumber}`}
${chapter.emotionalBeat ? `Emotional Beat: ${chapter.emotionalBeat}` : ''}
${chapter.sceneGoal ? `Scene Goal: ${chapter.sceneGoal}` : ''}

${previousPages.length > 0 ? `
🔗 CRITICAL REMINDER:
Your first sentence must flow directly from the last sentence of Page ${pageNumber - 1}.
The reader should experience this as ONE continuous story, not separate segments.
` : ''}

TARGET: ~1000 words
STRICT LIMITS: 600 minimum, 1200 maximum

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
