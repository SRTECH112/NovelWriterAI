/**
 * Story Canon Aggregator
 * Centralizes ALL user inputs from /new-book setup steps
 * Story Bible generation MUST use this structure, not direct UI fields
 */

export interface StoryCanonInput {
  // Core narrative foundation
  core_whitepaper: string;
  
  // Character canon (immutable)
  characters_input: string;
  
  // World & setting canon
  settings_input: string;
  
  // Story structure
  story_outline?: string;
  
  // Metadata from Step 1
  metadata: {
    title: string;
    genre: string;
    pov: string;
    tone: string;
    targetWordCount: number;
  };
  
  // Optional: User questionnaire answers (future expansion)
  questionnaire_answers?: {
    themes?: string[];
    emotional_beats?: string[];
    ending_type?: string;
    pacing_preference?: string;
    romance_style?: string;
  };
  
  // Optional: Volume & chapter configuration
  volumes_structure?: {
    planned_volumes?: number;
    chapters_per_volume?: number;
    act_structure?: string;
  };
  
  // Optional: Writing style preferences
  writing_style_preferences?: {
    prose_style?: string;
    dialogue_density?: string;
    description_level?: string;
    reference_authors?: string[];
  };
  
  // Optional: Constraints and forbidden elements
  constraints?: {
    forbidden_tropes?: string[];
    hard_constraints?: string[];
    soft_guidelines?: string[];
  };
}

/**
 * Validate that StoryCanonInput has all required fields
 */
export function validateStoryCanonInput(input: StoryCanonInput): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!input.core_whitepaper?.trim()) {
    errors.push('Core whitepaper is required');
  }
  
  if (!input.characters_input?.trim()) {
    errors.push('Characters input is required');
  }
  
  if (!input.settings_input?.trim()) {
    errors.push('Settings input is required');
  }
  
  if (!input.metadata?.title?.trim()) {
    errors.push('Book title is required');
  }
  
  if (!input.metadata?.genre?.trim()) {
    errors.push('Genre is required');
  }

  // Warnings for recommended fields
  if (!input.story_outline?.trim()) {
    warnings.push('Story outline is recommended for better structure');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Build StoryCanonInput from /new-book form data
 */
export function buildStoryCanonInput(formData: {
  title: string;
  genre: string;
  pov: string;
  tone: string;
  targetWordCount: number;
  whitepaper: string;
  characters: string;
  settings: string;
  storyOutline?: string;
}): StoryCanonInput {
  return {
    core_whitepaper: formData.whitepaper,
    characters_input: formData.characters,
    settings_input: formData.settings,
    story_outline: formData.storyOutline,
    metadata: {
      title: formData.title,
      genre: formData.genre,
      pov: formData.pov,
      tone: formData.tone,
      targetWordCount: formData.targetWordCount,
    },
  };
}

/**
 * Format StoryCanonInput for AI Story Bible generation
 * This is the ONLY way the AI should receive user inputs
 */
export function formatStoryCanonForAI(input: StoryCanonInput): string {
  return `
📚 STORY CANON INPUT (COMPLETE USER SPECIFICATION)
═══════════════════════════════════════════════════════════════

⚠️ CRITICAL INSTRUCTIONS:
- You MUST incorporate ALL sections below into the Story Bible
- You are NOT allowed to ignore any input category
- Explicit user inputs OVERRIDE everything else
- Whitepaper fills gaps ONLY
- AI inference is LAST RESORT only

🎯 INPUT PRIORITY RULES:
1. Character Canon (characters_input) - IMMUTABLE, highest priority
2. Settings Canon (settings_input) - IMMUTABLE, second priority
3. Metadata (genre, tone, POV) - Must be reflected in themes
4. Story Outline (if provided) - Structural guidance
5. Core Whitepaper - Fills narrative gaps
6. AI inference - Only for unspecified details

═══════════════════════════════════════════════════════════════

📖 METADATA
────────────────────────────────────────────────────────────────
Title: ${input.metadata.title}
Genre: ${input.metadata.genre}
POV: ${input.metadata.pov}
Tone: ${input.metadata.tone}
Target Length: ${input.metadata.targetWordCount.toLocaleString()} words

═══════════════════════════════════════════════════════════════

👥 CHARACTERS (CANONICAL - DO NOT ALTER)
────────────────────────────────────────────────────────────────
${input.characters_input}

🚨 CHARACTER RULES:
- Use EXACT names as provided above
- Do NOT rename, shorten, or modify character names
- Do NOT add characters not listed here
- Extract personalities, relationships, and traits AS-IS
- If conflicts exist, document under "Author Constraints"

═══════════════════════════════════════════════════════════════

🌍 SETTINGS & WORLD (CANONICAL - DO NOT ALTER)
────────────────────────────────────────────────────────────────
${input.settings_input}

🚨 SETTING RULES:
- Use EXACT locations and world details as provided
- Do NOT invent new locations not mentioned here
- Extract atmosphere, social rules, time period AS-IS
- World-building must derive from this input ONLY

═══════════════════════════════════════════════════════════════

📝 CORE WHITEPAPER (NARRATIVE FOUNDATION)
────────────────────────────────────────────────────────────────
${input.core_whitepaper}

🚨 WHITEPAPER RULES:
- Use to fill narrative gaps NOT covered by other inputs
- Extract themes, magic systems, technology, factions
- Synthesize with Characters and Settings (do not override them)
- If conflicts with Characters/Settings, favor those inputs

═══════════════════════════════════════════════════════════════

${input.story_outline ? `
📋 STORY OUTLINE (STRUCTURAL GUIDANCE)
────────────────────────────────────────────────────────────────
${input.story_outline}

🚨 OUTLINE RULES:
- Use as structural blueprint for volume/chapter intent
- Extract act structure, pacing, major plot points
- Respect the narrative flow described here
` : ''}

═══════════════════════════════════════════════════════════════

🎯 REQUIRED STORY BIBLE SECTIONS

You MUST generate ALL of the following sections:

1. **Core Premise**
   - Synthesize from whitepaper + metadata
   - 2-3 sentence elevator pitch
   - Must reflect genre and tone

2. **Themes & Emotional Core**
   - Extract from whitepaper + tone metadata
   - List 3-5 major themes
   - Emotional journey arc

3. **Character Profiles** (STRICT)
   - ONLY characters from Characters input
   - Full names EXACTLY as provided
   - Personalities, traits, relationships
   - Character arcs and motivations

4. **World & Settings** (STRICT)
   - ONLY locations from Settings input
   - Atmosphere and social rules
   - Time period and world constraints
   - Technology/magic level

5. **World Rules & Constraints**
   - Magic systems (if applicable)
   - Technology level
   - Social hierarchies
   - Physical laws or limitations

6. **Factions & Groups** (if applicable)
   - Organizations, schools, families
   - Power dynamics
   - Goals and conflicts

7. **Timeline & Lore** (if applicable)
   - Historical events
   - World history
   - Backstory elements

8. **Hard Constraints**
   - Non-negotiable story rules
   - Canon that cannot be broken
   - Author-mandated restrictions

9. **Soft Guidelines**
   - Preferred narrative approaches
   - Stylistic preferences
   - Flexible story elements

10. **Narrative Intent**
    - Pacing strategy
    - Emotional beats
    - Story structure (if outline provided)

═══════════════════════════════════════════════════════════════

🚨 VALIDATION REQUIREMENTS

Your generated Story Bible will be REJECTED if:
❌ Characters appear that weren't in Characters input
❌ Character names are altered or shortened
❌ Settings appear that weren't in Settings input
❌ Themes contradict genre/tone metadata
❌ Story Bible only mirrors whitepaper (ignoring other inputs)
❌ Any input category is completely ignored

✅ Your Story Bible will be ACCEPTED if:
✅ All characters from Characters input are included with exact names
✅ All settings from Settings input are represented
✅ Themes align with genre/tone metadata
✅ Whitepaper content is synthesized (not just copied)
✅ Each input source contributed to the final Bible

═══════════════════════════════════════════════════════════════

🎯 OUTPUT FORMAT

Generate a comprehensive Story Bible in JSON format with these sections:
- core_premise
- themes
- character_profiles (array)
- world_settings (array)
- world_rules (array)
- factions (array, if applicable)
- timeline (array, if applicable)
- hard_constraints (array)
- soft_guidelines (array)
- narrative_intent

Each section must be populated based on the inputs above.
`;
}
