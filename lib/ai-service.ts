import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import { HfInference } from '@huggingface/inference';
import { StoryBible, Chapter, CanonEnforcementResult } from './types';
import { validateChapterProse, getProseQualityPrompt, ProseValidationResult } from './prose-validator';

const AI_PROVIDER = process.env.AI_PROVIDER || 'HUGGINGFACE';

let geminiClient: GoogleGenerativeAI | null = null;
let openaiClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;
let groqClient: Groq | null = null;
let hfClient: HfInference | null = null;

if (AI_PROVIDER === 'GEMINI' && process.env.GEMINI_API_KEY) {
  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else if (AI_PROVIDER === 'OPENAI' && process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else if (AI_PROVIDER === 'ANTHROPIC' && process.env.ANTHROPIC_API_KEY) {
  anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
} else if (AI_PROVIDER === 'GROQ' && process.env.GROQ_API_KEY) {
  groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
} else if (AI_PROVIDER === 'HUGGINGFACE' && process.env.HUGGINGFACE_API_KEY) {
  hfClient = new HfInference(process.env.HUGGINGFACE_API_KEY);
}

async function callAI(prompt: string, systemPrompt?: string): Promise<string> {
  if (AI_PROVIDER === 'GEMINI' && geminiClient) {
    try {
      const model = geminiClient.getGenerativeModel({ 
        model: 'gemini-pro',
      });
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('Gemini API Error:', error.message);
      throw new Error(
        'Gemini API Error: Your API key may not have access to Gemini models. ' +
        'Please visit https://aistudio.google.com/app/apikey to create a new API key, ' +
        'or switch to ANTHROPIC by setting AI_PROVIDER=ANTHROPIC in .env.local'
      );
    }
  } else if (AI_PROVIDER === 'OPENAI' && openaiClient) {
    const messages: any[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });
    
    // Try GPT-5.2 first, fallback to GPT-4o if it fails
    let model = 'gpt-5.2';
    let useMaxCompletionTokens = true;
    
    try {
      console.log('🔵 Using OpenAI GPT-5.2');
      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-5.2',
        messages,
        temperature: 0.7,
        max_completion_tokens: 8192,
      });
      
      const content = completion.choices[0]?.message?.content || '';
      console.log('✅ GPT-5.2 response received, length:', content.length);
      
      if (!content || content.trim().length === 0) {
        console.warn('⚠️ GPT-5.2 returned empty response, falling back to GPT-4o');
        throw new Error('Empty response from GPT-5.2');
      }
      
      return content;
    } catch (gpt5Error: any) {
      console.warn('⚠️ GPT-5.2 failed:', gpt5Error.message);
      console.log('🔵 Falling back to GPT-4o');
      
      // Fallback to GPT-4o
      const fallbackCompletion = await openaiClient.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 8192,
      });
      
      const content = fallbackCompletion.choices[0]?.message?.content || '';
      console.log('✅ GPT-4o response received, length:', content.length);
      return content;
    }
  } else if (AI_PROVIDER === 'ANTHROPIC' && anthropicClient) {
    // Try different Sonnet model identifiers
    const anthroModels = [
      { name: 'claude-3-5-sonnet-latest', maxTokens: 8192 },   // Latest alias
      { name: 'claude-3-5-sonnet-20241022', maxTokens: 8192 }, // Specific version
      { name: 'claude-3-5-sonnet-20240620', maxTokens: 8192 }, // Earlier version
      { name: 'claude-3-sonnet-20240229', maxTokens: 4096 },   // Deprecated
      { name: 'claude-3-haiku-20240307', maxTokens: 4096 },    // Fallback
    ];

    let lastError: any = null;
    for (const modelConfig of anthroModels) {
      try {
        console.log(`🔵 Trying Claude model: ${modelConfig.name} (max_tokens: ${modelConfig.maxTokens})`);
        const message = await anthropicClient.messages.create({
          model: modelConfig.name,
      max_tokens: modelConfig.maxTokens,
      temperature: 0.7,
      system: (systemPrompt || 'You are a helpful AI assistant.') + '\n\nCRITICAL: Respond with ONLY JSON wrapped in <json>...</json>. No markdown, no code fences, no HTML, no explanations.',
      messages: [
        {
          role: 'user',
          content: prompt + '\n\nOUTPUT FORMAT: Return ONLY the JSON object wrapped exactly like <json>{...}</json>. No markdown, no code blocks, no explanations, no HTML.',
        },
      ],
    });
    
    const content = message.content[0];
    if (content.type === 'text') {
      console.log(`✅ Successfully used Claude model: ${modelConfig.name}`);
      // Clean up any potential markdown or HTML wrapping
      let text = content.text.trim();
      
      // If wrapped in <json> tags, extract content
      const tagMatch = text.match(/<json>[\s\S]*?<\/json>/i);
      if (tagMatch) {
        text = tagMatch[0].replace(/<\/?json>/gi, '').trim();
      }

      // Remove markdown code blocks if present
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
      }
      
      // Remove HTML if present
      text = text.replace(/<!DOCTYPE[^>]*>/gi, '').replace(/<\/?html[^>]*>/gi, '').trim();
      
      return text;
    }
        throw new Error('Unexpected response format from Claude');
      } catch (err: any) {
        lastError = err;
        // If Anthropic returns model not found, try next model
        if (err?.message?.includes('not_found') || err?.message?.includes('not found')) {
          continue;
        }
        // If API error, rethrow
        throw err;
      }
    }
    throw new Error(`All Claude models failed. Last error: ${lastError?.message || lastError}`);
  } else if (AI_PROVIDER === 'GROQ' && groqClient) {
    const messages: any[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });
    
    const completion = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 8192,
    });
    return completion.choices[0]?.message?.content || '';
  } else if (AI_PROVIDER === 'HUGGINGFACE' && hfClient) {
    // Note: Hugging Face free tier has limitations
    // For best results, use GROQ provider instead
    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\n${prompt}`
      : prompt;
    
    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: fullPrompt,
            parameters: {
              max_new_tokens: 4096,
              temperature: 0.7,
              return_full_text: false,
            },
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data[0]?.generated_text || '';
    } catch (error: any) {
      console.error('Hugging Face error:', error.message);
      throw new Error(`Hugging Face API error: ${error.message}. Recommendation: Switch to GROQ provider in .env.local for better reliability.`);
    }
  }
  
  throw new Error(
    `No AI provider configured. Current provider: ${AI_PROVIDER}. Please check your .env.local file and ensure the API key for ${AI_PROVIDER} is set correctly.`
  );
}

export async function parseStoryOutline(
  rawOutline: string,
  storyBible: StoryBible
): Promise<{
  acts: Array<{
    actNumber: number;
    title: string;
    narrativePurpose: string;
    emotionalPressure: number;
    pacing: string;
    targetChapterCount: number;
    chapters: Array<{
      chapterNumber: number;
      title: string;
      summary: string;
      plotBeats: string[];
      emotionalIntent: string;
      characterFocus: string[];
      pacingHint: string;
      rawOutlineText: string;
    }>;
  }>;
}> {
  const systemPrompt = `You are a Story Structure Architect. Your job is to create a complete Volume/Act/Chapter structure for a novel.

CRITICAL RULES:
1. ALWAYS generate a complete structure, even if the outline is minimal
2. Use Story Bible worldRules, themes, and constraints as context
3. Follow Wattpad/web novel pacing: 1500-2000 words per chapter
4. Acts must follow natural narrative progression (Setup → Disruption → Escalation → Fallout → Resolution)
5. Each act should have 5-15 chapters
6. Total target: 30-50 chapters for a full novel
7. Derive act titles and purposes from the story concept, NOT generic templates

OUTPUT: Complete JSON structure with acts and chapters.`;

  const whitepaper = storyBible.raw_whitepaper || '';
  const sections = storyBible.structured_sections;
  
  const prompt = `Create a complete novel structure from this Story Bible and outline.

STORY BIBLE SUMMARY:
Genre: ${storyBible.metadata.genre || 'Not specified'}
Tone: ${storyBible.metadata.tone || 'Not specified'}
POV: ${storyBible.metadata.pov || 'Not specified'}
Themes: ${sections.themesTone?.join(', ') || 'Not specified'}
World Rules: ${sections.worldRules?.slice(0, 3).join('; ') || 'Not specified'}

WHITEPAPER EXCERPT:
${whitepaper.slice(0, 1000)}

${rawOutline ? `USER OUTLINE:\n${rawOutline}\n` : 'NO EXPLICIT OUTLINE PROVIDED - Generate structure from Story Bible context.'}

INSTRUCTIONS:
${rawOutline 
  ? `- Parse the user's outline and expand it into acts and chapters
- Detect act boundaries (if not explicit, infer from narrative flow)
- Preserve user's chapter descriptions as rawOutlineText`
  : `- Generate a complete story structure based on the Story Bible
- Create 4-6 acts following natural story progression
- Each act should have 5-12 chapters
- Infer plot progression from worldRules, themes, and genre`}

CRITICAL REQUIREMENTS:
- Each act MUST have a unique title derived from the story (NOT "Act 1", "Act 2")
- narrativePurpose MUST be one of: "setup", "rising-tension", "fracture", "crisis", "resolution", "payoff"
  * setup: Introduce world, characters, status quo
  * rising-tension: Build conflict, complications arise
  * fracture: Major disruption, relationships strain
  * crisis: Peak conflict, hard choices
  * resolution: Aftermath, reconciliation
  * payoff: Deliver on promises, closure
- emotionalPressure: 1-10 scale (1=calm, 5=moderate tension, 10=crisis)
- pacing MUST be one of: "slow", "medium", "fast"
- targetChapterCount: how many chapters this act should have
- Each chapter needs: title, summary, plotBeats (3-5 beats), emotionalIntent, characterFocus, pacingHint

WATTPAD PACING RULES:
- Chapters are 1500-2000 words
- Slow emotional buildup, not rushed
- Each chapter = 1-2 scenes max
- End on hooks or emotional beats

OUTPUT FORMAT (strict JSON):
{
  "acts": [
    {
      "actNumber": 1,
      "title": "The New Transfer Student",
      "narrativePurpose": "setup",
      "emotionalPressure": 3,
      "pacing": "slow",
      "targetChapterCount": 8,
      "chapters": [
        {
          "chapterNumber": 1,
          "title": "First Day at Mabini Colleges",
          "summary": "Kate arrives at her elite high school and notices the mysterious new student",
          "plotBeats": ["Kate enters school", "Notices unusual security", "First glimpse of Marvin", "Overhears whispers about him"],
          "emotionalIntent": "Curiosity and intrigue",
          "characterFocus": ["Kate", "Marvin"],
          "pacingHint": "slow",
          "rawOutlineText": "${rawOutline ? 'Ch 1: Kate\'s first day, meets Marvin' : 'Generated from Story Bible'}"
        }
      ]
    }
  ]
}`;

  console.log('🔵 Auto-generating story structure with AI');
  const response = await callAI(prompt, systemPrompt);
  console.log('🔵 AI structure generation response length:', response.length);

  // Extract JSON
  let cleanedResponse = response
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .replace(/<\/?json>/gi, '')
    .trim();

  const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('❌ No JSON found in structure generation response');
    console.error('Response preview:', cleanedResponse.slice(0, 500));
    throw new Error('Failed to generate structure: No valid JSON returned');
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    console.log('✅ Successfully generated structure:', parsed.acts?.length || 0, 'acts,', 
      parsed.acts?.reduce((sum: number, act: any) => sum + (act.chapters?.length || 0), 0) || 0, 'chapters');
    return parsed;
  } catch (parseError: any) {
    console.error('❌ JSON parse error:', parseError.message);
    console.error('Malformed JSON preview:', jsonMatch[0].slice(0, 1000));
    console.error('Full response length:', response.length);
    
    // Try to fix common JSON issues
    try {
      // Remove trailing commas
      let fixedJson = jsonMatch[0]
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      
      const fixedParsed = JSON.parse(fixedJson);
      console.log('✅ Fixed JSON and parsed successfully');
      return fixedParsed;
    } catch (fixError) {
      console.error('❌ Could not auto-fix JSON');
      throw new Error('Failed to generate structure: Invalid JSON structure. Please try again.');
    }
  }
}

export async function generateStoryBible(
  whitepaper: string,
  metadata: StoryBible['metadata']
): Promise<StoryBible['structured_sections']> {
  const fallbackBible = (): StoryBible['structured_sections'] => ({
    worldRules: [],
    loreTimeline: [],
    factions: [],
    technologyMagicRules: [],
    themesTone: [],
    hardConstraints: [],
    softGuidelines: [],
  });
  const systemPrompt = `You are a Story Bible Generator. Extract and structure canonical information from the whitepaper.

RULES:
1. Extract ONLY what's in the whitepaper
2. Be CONCISE - use short phrases, not full sentences
3. Hard Constraints = absolute rules
4. Soft Guidelines = stylistic preferences

OUTPUT: JSON wrapped in <json>...</json>. No markdown, no explanations.
KEEP IT BRIEF - each item should be 5-15 words maximum.
Example: <json>{"worldRules":["Elite school setting","Power hierarchy"],"loreTimeline":[{"period":"High School","event":"Kate meets Marvin"}],"factions":[{"name":"Villaluz Group","description":"Global conglomerate","goals":"Maintain power"}],"technologyMagicRules":[],"themesTone":["Romance","Class conflict"],"hardConstraints":["No magic","Modern setting"],"softGuidelines":["Emotional focus"]}</json>
`;

  const metadataStr = Object.entries(metadata)
    .filter(([_, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  const prompt = `Extract key information from this whitepaper into a concise Story Bible.

METADATA:
${metadataStr}

WHITEPAPER:
${whitepaper}

IMPORTANT: Keep each item SHORT (5-15 words). Focus on essential facts only. Output ONLY the JSON object.`;

  console.log('🔵 Generating Story Bible with AI provider:', AI_PROVIDER);
  const response = await callAI(prompt, systemPrompt);
  console.log('🔵 AI Response received, length:', response.length);
  console.log('🔵 AI Response preview:', response.substring(0, 500));
  
  // Clean up response - remove markdown code blocks, HTML, smart quotes, and trailing commas
  let cleanedResponse = response
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<html[^>]*>/gi, '')
    .replace(/<\/html>/gi, '')
    // normalize smart quotes to standard quotes
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();

  // Extract <json>...</json> if present
  const tagMatch = cleanedResponse.match(/<json>[\s\S]*?<\/json>/i);
  if (tagMatch) {
    cleanedResponse = tagMatch[0].replace(/<\/?json>/gi, '').trim();
  }

  // Remove trailing commas (iterate)
  let prev = '';
  while (prev !== cleanedResponse) {
    prev = cleanedResponse;
    cleanedResponse = cleanedResponse.replace(/,(\s*[}\]])/g, '$1');
  }

  // Strip any leading text before the first '{'
  const firstBrace = cleanedResponse.indexOf('{');
  if (firstBrace > 0) {
    cleanedResponse = cleanedResponse.slice(firstBrace);
  }
  
  // Extract JSON object
  const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('Failed to extract JSON from response:', response.substring(0, 800));
    throw new Error('Failed to parse Story Bible JSON from AI response. The AI returned invalid format.');
  }
  
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    console.log('✅ Successfully parsed Story Bible JSON');
    console.log('📊 Sections:', Object.keys(parsed));
    return parsed;
  } catch (parseError: any) {
    console.error('❌ JSON parse error:', parseError.message);
    console.error('📄 Attempted to parse (truncated):', jsonMatch[0].substring(0, 800));
    console.error('🔍 Raw cleaned response (truncated):', cleanedResponse.substring(0, 800));
    console.error('⚠️ FALLING BACK TO EMPTY BIBLE - This means the AI response was invalid');
    // Fallback to minimal structured bible to avoid blocking the user or extra AI retries
    return fallbackBible();
  }
}

export async function generateOutline(
  storyBible: StoryBible,
  actStructure: 'three-act' | 'five-act',
  targetChapters: number = 40
): Promise<any[]> {
  const fallbackOutline = (): any[] => {
    const chapters: any[] = [];
    for (let i = 1; i <= targetChapters; i++) {
      chapters.push({
        number: i,
        title: `Chapter ${i}`,
        summary: 'Placeholder summary (outline parsing failed)',
        beats: ['Setup', 'Development', 'Climax'],
        canonCitations: [],
        pov: storyBible.metadata.pov || 'Unknown',
        setting: storyBible.metadata.genre || 'Unknown',
      } as any);
    }
    return chapters;
  };
  const bibleContext = `STORY BIBLE (CANONICAL - MUST NOT VIOLATE)
WORLD RULES:
${storyBible.structured_sections.worldRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

LORE TIMELINE:
${storyBible.structured_sections.loreTimeline.map(e => `- ${e.period}: ${e.event}`).join('\n')}

FACTIONS:
${storyBible.structured_sections.factions.map(f => `- ${f.name}: ${f.description} (Goals: ${f.goals})`).join('\n')}

TECHNOLOGY/MAGIC RULES:
${storyBible.structured_sections.technologyMagicRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

THEMES & TONE:
${storyBible.structured_sections.themesTone.join(', ')}

HARD CONSTRAINTS (ABSOLUTE):
${storyBible.structured_sections.hardConstraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}

SOFT GUIDELINES:
${storyBible.structured_sections.softGuidelines.map((g, i) => `${i + 1}. ${g}`).join('\n')}`;

  const systemPrompt = `You are a Novel Outline Generator.
You create detailed chapter-by-chapter outlines that STRICTLY adhere to the Story Bible.

CRITICAL RULES:
1. EVERY plot point must be justified by Story Bible canon
2. Cite specific Story Bible elements for each chapter (canonCitations)
3. Maintain consistency with world rules and constraints
4. Respect hard constraints ABSOLUTELY
5. Follow soft guidelines when possible
6. Character arcs must align with faction goals and lore
7. Outline must be bullet-beat driven, not prose

OUTPUT FORMAT (STRICT):
- Respond with ONLY the JSON array wrapped in <json>...</json>
- No markdown, no code fences, no HTML, no explanations
- No trailing commas anywhere
- Use double quotes for all keys/strings
- Each chapter object MUST have: number, title, summary (1-2 sentences max), beats (3-6 bullet strings), canonCitations, pov, setting, characterArcs, bibleCitations, emotionalGoal, conflict, relationshipMovement, hookForNext
- Example: <json>[{"number":1,"title":"","summary":"","beats":["beat"],"canonCitations":["ref"],"pov":"","setting":"","characterArcs":["arc"],"bibleCitations":["rule 1"],"emotionalGoal":"goal","conflict":"conflict","relationshipMovement":"movement","hookForNext":"hook"}]</json>

${bibleContext}`;

  const prompt = `Create a ${actStructure} outline with ${targetChapters} chapters.

${bibleContext}

METADATA:
Genre: ${storyBible.metadata.genre || 'Not specified'}
Tone: ${storyBible.metadata.tone || 'Not specified'}
POV: ${storyBible.metadata.pov || 'Not specified'}

For EACH chapter include:
- title
- summary (1-2 sentences max, not prose paragraph)
- beats (3-6 bullet beats, not prose)
- canonCitations (specific bible refs used)
- bibleCitations (same as canonCitations if needed)
- pov (character or perspective)
- setting (concise)
- characterArcs
- emotionalGoal (what emotional journey/goal for POV character)
- conflict (main tension/obstacle in this chapter)
- relationshipMovement (how key relationships change)
- hookForNext (cliffhanger or question for next chapter)

This is a Wattpad/anime fanfic style outline. Focus on emotional beats and relationship dynamics.

Output ONLY the JSON array wrapped in <json>...</json>. No extra text.`;

  const response = await callAI(prompt, systemPrompt);
  
  // Clean and extract JSON
  let cleanedResponse = response
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<html[^>]*>/gi, '')
    .replace(/<\/html>/gi, '')
    // normalize smart quotes
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();

  // Extract <json>...</json> if present
  const tagMatch = cleanedResponse.match(/<json>[\s\S]*?<\/json>/i);
  if (tagMatch) {
    cleanedResponse = tagMatch[0].replace(/<\/?json>/gi, '').trim();
  }

  // Remove trailing commas (iterate to clean nested cases)
  let prev = '';
  while (prev !== cleanedResponse) {
    prev = cleanedResponse;
    cleanedResponse = cleanedResponse.replace(/,(\s*[\]\}])/g, '$1');
  }

  // Strip leading text before first '['
  const firstBracket = cleanedResponse.indexOf('[');
  if (firstBracket > 0) {
    cleanedResponse = cleanedResponse.slice(firstBracket);
  }

  const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error('Failed to extract outline JSON. Cleaned (trunc):', cleanedResponse.substring(0, 800));
    throw new Error('Failed to parse Outline JSON from AI response');
  }
  try {
    return JSON.parse(jsonMatch[0]) as any[];
  } catch (err: any) {
    console.error('Outline JSON parse error:', err.message);
    console.error('Attempted outline JSON (trunc):', jsonMatch[0].substring(0, 800));
    console.error('Raw cleaned response (trunc):', cleanedResponse.substring(0, 800));
    // Attempt a repair by truncating to the last complete object and closing the array
    try {
      const data = jsonMatch[0];
      const lastBrace = data.lastIndexOf('}');
      if (lastBrace > 0) {
        const repaired = data.slice(0, lastBrace + 1) + ']';
        const parsed = JSON.parse(repaired) as any[];
        console.error('Outline JSON repaired by truncation.');
        return parsed;
      }
    } catch (repairErr: any) {
      console.error('Outline JSON repair failed:', repairErr.message);
    }
    // Fallback to minimal outline to avoid blocking user and additional AI spend
    return fallbackOutline();
  }
}

export async function generateChapter(
  storyBible: StoryBible,
  outline: any,
  chapterNumber: number,
  previousChapters: Chapter[]
): Promise<{ content: string; summary: string; stateDelta: Chapter['stateDelta']; proseValidation: ProseValidationResult }> {
  const chapterOutline = outline.chapters.find((c: any) => c.number === chapterNumber);
  if (!chapterOutline) {
    throw new Error(`Chapter ${chapterNumber} not found in outline`);
  }

  const sections = storyBible?.structured_sections ?? {
    worldRules: [],
    loreTimeline: [],
    factions: [],
    technologyMagicRules: [],
    themesTone: [],
    hardConstraints: [],
    softGuidelines: [],
  };

  const proseQualityPrompt = getProseQualityPrompt();

  const systemPrompt = `You are a Novel Chapter Writer with ABSOLUTE adherence to canon AND prose quality standards.

CRITICAL RULES - CANON ENFORCEMENT:
1. Story Bible is IMMUTABLE CANON - you CANNOT violate it
2. If creativity conflicts with canon, CANON WINS
3. Every event must be consistent with world rules
4. Hard Constraints are ABSOLUTE - violation is forbidden
5. Maintain consistency with all previous chapters
6. Follow the outline precisely

OPENING SCENE MANDATE (anime fanfic / Wattpad romance style):
- The story starts inside an ordinary moment already in progress
- No introductions, no world/setting exposition, no meta framing
- POV is strictly what the protagonist notices right now; do not explain what feels normal to them
- Social cues (glances, whispers, tone, distance) outweigh lore
- Scene is small, mundane, emotionally grounded; tension is subtle (discomfort, awareness, boredom, pressure)
- Short paragraphs (1–2 sentences) with frequent line breaks; internal thoughts may stand alone; voice is casual
- Absolutely forbidden: explaining the setting/institution, summarizing routines, referencing canon/rules/background, declaring significance/foreshadowing
- If the first 3 paragraphs read like a synopsis, regenerate the opening scene until it feels like a casual lived moment

PROSE QUALITY STANDARDS:
${proseQualityPrompt}

OUTPUT FORMAT (JSON):
{
  "content": "Full chapter text (2000-4000 words). CRITICAL: Escape all quotes and newlines properly. Use \\n for line breaks, \\" for quotes.",
  "summary": "Brief summary of what happened",
  "stateDelta": {
    "characterStates": {"Character Name": "Current state/location/condition"},
    "worldChanges": ["What changed in the world"],
    "plotProgression": ["Plot points advanced"],
    "emotionalState": "POV character's emotional state at chapter end",
    "unresolvedThreads": ["Questions or tensions left unresolved for next chapter"]
  }
}

IMPORTANT JSON RULES:
- Escape ALL quotes in content with backslash: \\"
- Use \\n for line breaks, never actual newlines in JSON strings
- No trailing commas
- Ensure valid JSON syntax`;

  const bibleContext = `
═════════════════════════════════════════════════════════════
STORY BIBLE - CANONICAL SOURCE OF TRUTH (IMMUTABLE)
═════════════════════════════════════════════════════════════

WORLD RULES (MUST OBEY):
${sections.worldRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

LORE TIMELINE:
${sections.loreTimeline.map(e => `- ${e.period}: ${e.event}`).join('\n')}

FACTIONS:
${sections.factions.map(f => `- ${f.name}: ${f.description}\n  Goals: ${f.goals}`).join('\n')}

TECHNOLOGY/MAGIC RULES (MUST OBEY):
${sections.technologyMagicRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

THEMES & TONE:
${sections.themesTone.join(', ')}

⚠️ HARD CONSTRAINTS (ABSOLUTE - CANNOT VIOLATE):
${sections.hardConstraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}

SOFT GUIDELINES (FOLLOW WHEN POSSIBLE):
${sections.softGuidelines.map((g, i) => `${i + 1}. ${g}`).join('\n')}

═════════════════════════════════════════════════════════════
`;

  const safePrev = previousChapters.map((ch) => ({
    ...ch,
    stateDelta: ch.stateDelta || { characterStates: {}, worldChanges: [], plotProgression: [] },
  }));

  // LOCAL MEMORY: Previous chapter context
  const lastChapter = safePrev.length > 0 ? safePrev[safePrev.length - 1] : null;
  const localMemory = lastChapter ? `
LOCAL MEMORY (IMMEDIATE CONTEXT FROM PREVIOUS CHAPTER):
Chapter ${lastChapter.chapterNumber} Summary: ${lastChapter.summary}
Emotional State: ${lastChapter.stateDelta.emotionalState || 'Not specified'}
Unresolved Threads: ${(lastChapter.stateDelta.unresolvedThreads || []).join('; ') || 'None'}
Character States: ${JSON.stringify(lastChapter.stateDelta.characterStates)}
` : 'This is the first chapter.';

  // STRUCTURAL MEMORY: All previous chapters
  const narrativeMemory = safePrev.length > 0 ? `
STRUCTURAL MEMORY (ALL PREVIOUS CHAPTERS):
${safePrev.map((ch: any) => `Ch ${ch.chapterNumber}: ${ch.summary}`).join('\n')}
` : '';

  const basePrompt = `Write Chapter ${chapterNumber}: "${chapterOutline.title}"

⚠️ CRITICAL: STORY BIBLE IS ABSOLUTE CANON ⚠️
You MUST follow the Story Bible EXACTLY. Do NOT contradict any established facts.
- Character roles, relationships, and status are FIXED
- World rules and setting details are IMMUTABLE
- Timeline and events must match the bible
- Any deviation from the Story Bible is a CRITICAL ERROR

${bibleContext}

${localMemory}

${narrativeMemory}

CHAPTER OUTLINE (STRUCTURAL LAYER):
Act: ${chapterOutline.act}
Summary: ${chapterOutline.summary}
POV: ${chapterOutline.pov || storyBible.metadata.pov || 'Third person'}
Setting: ${chapterOutline.setting || 'Not specified'}
Emotional Goal: ${chapterOutline.emotionalGoal || 'Not specified'}
Conflict: ${chapterOutline.conflict || 'Not specified'}
Relationship Movement: ${chapterOutline.relationshipMovement || 'Not specified'}
Key Beats:
${(chapterOutline.beats || []).map((b: any, i: number) => `  ${i + 1}. ${b}`).join('\n')}
Bible Citations: ${(chapterOutline.bibleCitations || []).join(', ')}
Character Arcs: ${(chapterOutline.characterArcs || []).join(', ')}
Hook for Next Chapter: ${chapterOutline.hookForNext || 'Not specified'}

REQUIREMENTS:
- Length: 2000-4000 words
- POV: ${storyBible.metadata.pov || 'Third person'}
- Tone: ${storyBible.metadata.tone || 'Match Story Bible'}
- MUST obey ALL Story Bible rules
- MUST maintain consistency with previous chapters
- MUST follow the outline
- MUST meet all prose quality standards (scene-based, proper rhythm, no canon leakage)

OPENING SCENE ENFORCEMENT (APPLIES TO FIRST 300 WORDS):
- Begin inside an ordinary moment already happening; no exposition
- No worldbuilding, no rules/canon exposition, no meta framing
- POV limited to protagonist’s immediate awareness; do not explain familiar things
- Prioritize social cues over lore; keep tension subtle and grounded
- Short paragraphs (1–2 sentences), frequent line breaks, casual voice; internal thoughts can be standalone lines
- If the first 3 paragraphs read like a synopsis, rewrite them until they feel like overheard real life

WATTPAD / ANIME FANFIC WRITING STYLE (MANDATORY FOR ALL CHAPTERS):
- Voice-first, emotion-first, explanation later
- Casual, diary-like internal voice (first-person or close third-person)
- Short-to-medium paragraphs with frequent line breaks
- Strong focus on romantic tension and emotional beats
- Dialogue reveals character and context naturally
- No info-dumps, no world explanations, no character introductions

CHAPTER 1 / EARLY CHAPTER RULES (CRITICAL):
- MUST begin with a personal, emotional micro-moment already in progress
- Forbidden openings: "I took a deep breath", "This was my first day", "I arrived at", "It all began", "I woke up", "The day started"
- Start in media res with internal monologue showing immediate emotional state
- Reader should feel dropped into the MC's life mid-moment
- No setting explanations, no character introductions, no backstory
- Context emerges through action, dialogue, and social cues only

Output ONLY the JSON object with content, summary, and stateDelta. No additional text.`;

  // Generate with automatic regeneration for quality
  const MAX_ATTEMPTS = 3;
  let attempt = 0;
  let currentPrompt = basePrompt;
  
  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    
    const response = await callAI(currentPrompt, systemPrompt);
    
    // Extract JSON more carefully - find the outermost braces
    let jsonStr = '';
    let braceCount = 0;
    let startIndex = -1;
    
    for (let i = 0; i < response.length; i++) {
      if (response[i] === '{') {
        if (braceCount === 0) startIndex = i;
        braceCount++;
      } else if (response[i] === '}') {
        braceCount--;
        if (braceCount === 0 && startIndex !== -1) {
          jsonStr = response.substring(startIndex, i + 1);
          break;
        }
      }
    }
    
    if (!jsonStr) {
      console.error('No valid JSON found in response');
      if (attempt >= MAX_ATTEMPTS) {
        throw new Error('Failed to parse Chapter JSON from AI response after all attempts');
      }
      continue; // Try again
    }
    
    let result;
    try {
      // Try to parse as-is first
      result = JSON.parse(jsonStr);
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError.message);
      console.error('Error at position:', parseError.message.match(/position (\d+)/)?.[1]);
      
      // Try to fix common JSON issues
      try {
        let fixedJson = jsonStr;
        
        // Remove any trailing commas before closing braces/brackets
        fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
        
        // Try to fix unescaped newlines in strings (common issue)
        // This is a heuristic - find content between quotes and escape newlines
        fixedJson = fixedJson.replace(/"content"\s*:\s*"([\s\S]*?)(?="summary"|"stateDelta"|$)/g, (match, content) => {
          // Escape unescaped quotes and newlines in content
          const escaped = content
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
          return `"content": "${escaped}`;
        });
        
        // Try parsing the fixed version
        result = JSON.parse(fixedJson);
        console.log('Successfully parsed after fixing JSON issues');
      } catch (fixError: any) {
        console.error('Still failed after fixes:', fixError.message);
        
        // Show the problematic area
        const errorPos = parseInt(parseError.message.match(/position (\d+)/)?.[1] || '0');
        const contextStart = Math.max(0, errorPos - 100);
        const contextEnd = Math.min(jsonStr.length, errorPos + 100);
        console.error('Context around error:', jsonStr.substring(contextStart, contextEnd));
        
        if (attempt >= MAX_ATTEMPTS) {
          throw new Error(`Failed to parse Chapter JSON after all attempts: ${parseError.message}. Check server logs for details.`);
        }
        
        // Add instruction to fix JSON formatting in next attempt
        currentPrompt = `${basePrompt}

⚠️ PREVIOUS ATTEMPT HAD INVALID JSON ⚠️
Error: ${parseError.message}

CRITICAL: Output VALID JSON only. Ensure:
- Escape ALL quotes in content with backslash: \\"
- Use \\n for line breaks (never actual newlines in JSON)
- Use \\t for tabs
- No trailing commas
- Proper JSON syntax throughout

Example of correct content formatting:
"content": "She said, \\"Hello.\\"\\n\\nHe nodded."

Generate the chapter again with PERFECTLY VALID JSON.`;
        continue; // Try again with JSON fix instructions
      }
    }
    
    // Validate prose quality
    const validation = validateChapterProse(result.content);
    
    // If valid or max attempts reached, return
    if (validation.isValid || attempt >= MAX_ATTEMPTS) {
      return {
        ...result,
        proseValidation: validation,
      };
    }
    
    // If invalid, regenerate with stricter constraints
    console.log(`Prose validation failed (attempt ${attempt}/${MAX_ATTEMPTS}):`, validation.regenerationReason);
    console.log('Issues:', validation.issues);
    
    // Add stricter constraints to the prompt for next attempt
    currentPrompt = `${basePrompt}

⚠️ PREVIOUS ATTEMPT FAILED PROSE VALIDATION ⚠️
Issues detected: ${validation.issues.join('; ')}

REGENERATE with STRICT adherence to:
${validation.issues.map(issue => `- Fix: ${issue}`).join('\n')}

Remember: NO canon leakage, scene-based prose, proper paragraph rhythm, strong opening.`;
  }
  
  // Should never reach here, but TypeScript needs it
  throw new Error('Failed to generate valid chapter after maximum attempts');
}

export async function checkCanonCompliance(
  content: string,
  storyBible: StoryBible
): Promise<CanonEnforcementResult> {
  const systemPrompt = `You are a Canon Compliance Checker.
Analyze text for violations of Story Bible rules.

Output JSON:
{
  "passed": true/false,
  "violations": ["Critical violations of hard constraints"],
  "warnings": ["Potential issues or soft guideline deviations"]
}`;

  const prompt = `Check this content for Story Bible compliance:

STORY BIBLE HARD CONSTRAINTS:
${storyBible.structured_sections.hardConstraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}

WORLD RULES:
${storyBible.structured_sections.worldRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

CONTENT TO CHECK:
${content.substring(0, 3000)}...

Output ONLY the JSON object.`;

  const response = await callAI(prompt, systemPrompt);
  
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { passed: true, violations: [], warnings: [] };
  }
  
  return JSON.parse(jsonMatch[0]);
}
