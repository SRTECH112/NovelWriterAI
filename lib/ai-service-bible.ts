/**
 * AI Service for Story Bible Generation
 * Uses centralized StoryCanonInput to aggregate ALL user inputs
 */

import OpenAI from 'openai';
import { StoryCanonInput, formatStoryCanonForAI } from './story-canon-aggregator';
import { parseCharacters } from './parse-characters';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedStoryBible {
  core_premise: string;
  themes: string[];
  character_profiles: Array<{
    full_name: string;
    short_name?: string;
    personality: string;
    traits: string[];
    relationships: string;
    arc: string;
    source: 'characters_input';
  }>;
  world_settings: Array<{
    location: string;
    description: string;
    atmosphere: string;
    social_rules?: string;
    source: 'settings_input';
  }>;
  world_rules: string[];
  factions?: Array<{
    name: string;
    description: string;
    goals: string;
    members?: string;
  }>;
  timeline?: Array<{
    period: string;
    event: string;
  }>;
  hard_constraints: string[];
  soft_guidelines: string[];
  narrative_intent: {
    pacing: string;
    emotional_journey: string;
    structure?: string;
  };
  technology_magic_rules?: string[];
}

/**
 * Validate that generated Story Bible properly incorporates all inputs
 */
export function validateGeneratedBible(
  bible: GeneratedStoryBible,
  input: StoryCanonInput
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate structure exists
  if (!bible || typeof bible !== 'object') {
    errors.push('Generated Story Bible is invalid or missing');
    return { valid: false, errors, warnings };
  }

  // Validate characters
  const inputCharacters = parseCharacters(input.characters_input);
  const bibleCharacterNames = (bible.character_profiles || [])
    .filter(c => c && c.full_name)
    .map(c => c.full_name.toLowerCase());
  
  for (const inputChar of inputCharacters) {
    const found = bibleCharacterNames.some(name => 
      name.includes(inputChar.fullName.toLowerCase()) || 
      inputChar.fullName.toLowerCase().includes(name)
    );
    if (!found) {
      errors.push(`Character "${inputChar.fullName}" from Characters input is missing in Story Bible`);
    }
  }

  // Check for invented characters
  if ((bible.character_profiles?.length || 0) > inputCharacters.length + 2) {
    warnings.push('Story Bible contains significantly more characters than provided in Characters input');
  }

  // Validate settings
  if (!bible.world_settings || bible.world_settings.length === 0) {
    errors.push('No world settings found in Story Bible despite Settings input being provided');
  }

  // Validate themes
  if (!bible.themes || bible.themes.length === 0) {
    errors.push('No themes extracted in Story Bible');
  }

  // Check genre alignment
  if (input.metadata?.genre) {
    const genreLower = input.metadata.genre.toLowerCase();
    const bibleText = JSON.stringify(bible).toLowerCase();
    if (!bibleText.includes(genreLower) && genreLower !== 'other') {
      warnings.push(`Genre "${input.metadata.genre}" not clearly reflected in Story Bible`);
    }
  }

  // Validate core sections exist
  if (!bible.core_premise?.trim()) {
    errors.push('Core premise is missing');
  }

  if (!bible.hard_constraints || bible.hard_constraints.length === 0) {
    warnings.push('No hard constraints defined - consider adding story rules');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate Story Bible from complete StoryCanonInput
 * This is the ONLY way to generate a Story Bible
 */
export async function generateStoryBible(
  input: StoryCanonInput
): Promise<{
  bible: GeneratedStoryBible;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}> {
  const systemPrompt = `You are a Story Bible Generator for a novel writing AI system.

Your task is to create a comprehensive, canonical Story Bible that incorporates ALL user inputs.

CRITICAL RULES:
1. You MUST use character names EXACTLY as provided in Characters input
2. You MUST use settings EXACTLY as provided in Settings input
3. You MUST synthesize all input categories into a cohesive Bible
4. Whitepaper fills gaps ONLY - it does not override Characters or Settings
5. If conflicts exist, document them in hard_constraints

OUTPUT: Valid JSON matching the GeneratedStoryBible interface.
Include ALL required sections.
Be thorough but concise.`;

  const userPrompt = formatStoryCanonForAI(input);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    const bible = JSON.parse(content) as GeneratedStoryBible;

    // Validate the generated Bible
    const validation = validateGeneratedBible(bible, input);

    // If validation fails critically, throw error
    if (!validation.valid && validation.errors.length > 0) {
      console.error('Story Bible validation failed:', validation.errors);
      // Allow it to proceed but log the errors
      // In production, you might want to retry or ask user to fix
    }

    return {
      bible,
      validation,
    };
  } catch (error: any) {
    console.error('Error generating Story Bible:', error);
    throw new Error(`Failed to generate Story Bible: ${error.message}`);
  }
}

/**
 * Convert GeneratedStoryBible to database-compatible format
 */
export function convertBibleToDBFormat(bible: GeneratedStoryBible, input: StoryCanonInput) {
  return {
    raw_whitepaper: input.core_whitepaper,
    characters: input.characters_input,
    settings: input.settings_input,
    structured_sections: {
      corePremise: bible.core_premise,
      themes: bible.themes,
      characterProfiles: bible.character_profiles,
      worldSettings: bible.world_settings,
      worldRules: bible.world_rules,
      factions: bible.factions || [],
      loreTimeline: bible.timeline || [],
      hardConstraints: bible.hard_constraints,
      softGuidelines: bible.soft_guidelines,
      narrativeIntent: bible.narrative_intent,
      technologyMagicRules: bible.technology_magic_rules || [],
      themesTone: bible.themes,
    },
    metadata: {
      genre: input.metadata.genre,
      tone: input.metadata.tone,
      pov: input.metadata.pov,
      targetLength: input.metadata.targetWordCount,
    },
    locked: true,
  };
}
