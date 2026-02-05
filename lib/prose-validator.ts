/**
 * Prose Validation and Sanitation Layer
 * Ensures chapters meet quality standards and contain no canon leakage
 */

export interface ProseValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: string[];
  warnings: string[];
  shouldRegenerate: boolean;
  regenerationReason?: string;
}

export interface ParagraphAnalysis {
  averageSentencesPerParagraph: number;
  longestParagraphSentences: number;
  hasWhiteSpace: boolean;
  paragraphCount: number;
}

// Canon leakage patterns - HARD REJECT
const CANON_LEAKAGE_PATTERNS = [
  /story bible/i,
  /world rules/i,
  /lore timeline/i,
  /according to (the )?(canon|rules|bible)/i,
  /as stated in (the )?(story bible|world rules|canon)/i,
  /\(.*?(canon|bible|rule|constraint).*?\)/i,
  /the (established|canonical) (rules|lore|world)/i,
  /per (the )?(story bible|world rules)/i,
  /as (per|defined in) (the )?(canon|bible)/i,
];

// Bad opening patterns - REGENERATE OPENING
const BAD_OPENING_PATTERNS = [
  /^(I|He|She|They) woke/i,
  /^(The|A) (sun|morning|dawn) (rose|broke|came)/i,
  /^(I|He|She|They) (opened|rubbed) (my|his|her|their) eyes/i,
  /^Another (day|morning)/i,
  /^(I|He|She|They) (stretched|yawned)/i,
  /^The alarm/i,
  /^(I|He|She|They) got (out of bed|up)/i,
  /^It was (a|another) (typical|normal|ordinary) (day|morning)/i,
];

// Exposition dump indicators
const EXPOSITION_PATTERNS = [
  /had always been/gi,
  /for (many|several) (years|months|weeks)/gi,
  /in (this|that|the) world/gi,
  /everyone knew (that)?/gi,
  /it was (well )?known (that)?/gi,
];

// Synopsis-style writing (telling not showing)
const SYNOPSIS_PATTERNS = [
  /they (talked|discussed|argued) (about|for)/gi,
  /after (a while|some time|a few (minutes|hours))/gi,
  /eventually/gi,
  /over the (next|following) (few )?(days|weeks|hours)/gi,
];

/**
 * Check for canon leakage - HARD REJECT
 */
export function detectCanonLeakage(text: string): { hasLeakage: boolean; matches: string[] } {
  const matches: string[] = [];
  
  for (const pattern of CANON_LEAKAGE_PATTERNS) {
    const found = text.match(pattern);
    if (found) {
      matches.push(found[0]);
    }
  }
  
  return {
    hasLeakage: matches.length > 0,
    matches,
  };
}

/**
 * Check opening paragraph quality
 */
export function validateOpening(text: string): { isValid: boolean; reason?: string } {
  const firstParagraph = text.split('\n\n')[0] || text.substring(0, 500);
  
  for (const pattern of BAD_OPENING_PATTERNS) {
    if (pattern.test(firstParagraph)) {
      return {
        isValid: false,
        reason: `Opening violates scene-based rule: starts with "${firstParagraph.substring(0, 50)}..."`,
      };
    }
  }
  
  // Check if opening is too exposition-heavy
  const expositionMatches = firstParagraph.match(/had always been|for many years|in this world/gi);
  if (expositionMatches && expositionMatches.length > 2) {
    return {
      isValid: false,
      reason: 'Opening contains too much exposition instead of immediate scene',
    };
  }
  
  return { isValid: true };
}

/**
 * Analyze paragraph structure
 */
export function analyzeParagraphs(text: string): ParagraphAnalysis {
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  
  let totalSentences = 0;
  let longestParagraphSentences = 0;
  
  for (const paragraph of paragraphs) {
    // Rough sentence count (split by . ! ?)
    const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const sentenceCount = sentences.length;
    
    totalSentences += sentenceCount;
    if (sentenceCount > longestParagraphSentences) {
      longestParagraphSentences = sentenceCount;
    }
  }
  
  const averageSentencesPerParagraph = paragraphs.length > 0 
    ? totalSentences / paragraphs.length 
    : 0;
  
  // Check for white space (paragraphs should be frequent)
  const hasWhiteSpace = paragraphs.length >= (text.length / 500); // Roughly 1 paragraph per 500 chars
  
  return {
    averageSentencesPerParagraph,
    longestParagraphSentences,
    hasWhiteSpace,
    paragraphCount: paragraphs.length,
  };
}

/**
 * Check for synopsis-style writing (telling not showing)
 */
export function detectSynopsisWriting(text: string): { score: number; matches: number } {
  let matches = 0;
  
  for (const pattern of SYNOPSIS_PATTERNS) {
    const found = text.match(pattern);
    if (found) {
      matches += found.length;
    }
  }
  
  // Also check for long unbroken paragraphs
  const paragraphs = text.split('\n\n');
  const longParagraphs = paragraphs.filter(p => p.length > 800).length;
  
  matches += longParagraphs * 2; // Weight long paragraphs heavily
  
  // Score: 0 = good (scene-based), 100 = bad (synopsis)
  const score = Math.min(100, matches * 10);
  
  return { score, matches };
}

/**
 * Check for sensory details and interiority
 */
export function checkSceneElements(text: string): { 
  hasSensoryDetails: boolean;
  hasInteriority: boolean;
  hasMovement: boolean;
  score: number;
} {
  // Sensory words
  const sensoryPatterns = [
    /\b(saw|heard|felt|smelled|tasted|touched)\b/gi,
    /\b(sound|sight|scent|smell|taste|texture)\b/gi,
    /\b(warm|cold|hot|cool|soft|hard|rough|smooth)\b/gi,
    /\b(bright|dark|dim|shadowy|glowing)\b/gi,
  ];
  
  // Interiority patterns (thoughts, feelings)
  const interiorityPatterns = [
    /\bthought\b/gi,
    /\bfelt\b/gi,
    /\bwondered\b/gi,
    /\brealized\b/gi,
    /\bknew\b/gi,
  ];
  
  // Movement/action verbs
  const movementPatterns = [
    /\b(walked|ran|moved|stepped|turned|reached|grabbed|pulled|pushed)\b/gi,
    /\b(stood|sat|leaned|bent|crouched|knelt)\b/gi,
  ];
  
  let sensoryCount = 0;
  for (const pattern of sensoryPatterns) {
    const matches = text.match(pattern);
    if (matches) sensoryCount += matches.length;
  }
  
  let interiorityCount = 0;
  for (const pattern of interiorityPatterns) {
    const matches = text.match(pattern);
    if (matches) interiorityCount += matches.length;
  }
  
  let movementCount = 0;
  for (const pattern of movementPatterns) {
    const matches = text.match(pattern);
    if (matches) movementCount += matches.length;
  }
  
  const wordCount = text.split(/\s+/).length;
  const sensoryRatio = sensoryCount / (wordCount / 100); // Per 100 words
  const interiorityRatio = interiorityCount / (wordCount / 100);
  const movementRatio = movementCount / (wordCount / 100);
  
  const hasSensoryDetails = sensoryRatio > 1; // At least 1 per 100 words
  const hasInteriority = interiorityRatio > 0.5;
  const hasMovement = movementRatio > 1;
  
  // Score based on presence of all three elements
  let score = 0;
  if (hasSensoryDetails) score += 33;
  if (hasInteriority) score += 33;
  if (hasMovement) score += 34;
  
  return {
    hasSensoryDetails,
    hasInteriority,
    hasMovement,
    score,
  };
}

/**
 * Main validation function
 */
export function validateChapterProse(chapterContent: string): ProseValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 100;
  
  // 1. HARD REJECT: Canon leakage
  const canonCheck = detectCanonLeakage(chapterContent);
  if (canonCheck.hasLeakage) {
    return {
      isValid: false,
      score: 0,
      issues: [`CANON LEAKAGE DETECTED: ${canonCheck.matches.join(', ')}`],
      warnings: [],
      shouldRegenerate: true,
      regenerationReason: 'Chapter contains references to Story Bible internal structures',
    };
  }
  
  // 2. Opening validation
  const openingCheck = validateOpening(chapterContent);
  if (!openingCheck.isValid) {
    issues.push(`Bad opening: ${openingCheck.reason}`);
    score -= 30;
  }
  
  // 3. Paragraph analysis
  const paragraphAnalysis = analyzeParagraphs(chapterContent);
  if (paragraphAnalysis.averageSentencesPerParagraph > 4) {
    issues.push(`Paragraphs too long (avg ${paragraphAnalysis.averageSentencesPerParagraph.toFixed(1)} sentences, target: 1-3)`);
    score -= 20;
  }
  if (paragraphAnalysis.longestParagraphSentences > 8) {
    issues.push(`Unbroken paragraph detected (${paragraphAnalysis.longestParagraphSentences} sentences)`);
    score -= 15;
  }
  if (!paragraphAnalysis.hasWhiteSpace) {
    issues.push('Insufficient white space / paragraph breaks');
    score -= 10;
  }
  
  // 4. Synopsis detection
  const synopsisCheck = detectSynopsisWriting(chapterContent);
  if (synopsisCheck.score > 30) {
    issues.push(`Synopsis-style writing detected (score: ${synopsisCheck.score}/100)`);
    score -= 20;
  } else if (synopsisCheck.score > 15) {
    warnings.push(`Some telling instead of showing (score: ${synopsisCheck.score}/100)`);
    score -= 10;
  }
  
  // 5. Scene elements check
  const sceneCheck = checkSceneElements(chapterContent);
  if (!sceneCheck.hasSensoryDetails) {
    issues.push('Missing sensory details');
    score -= 15;
  }
  if (!sceneCheck.hasInteriority) {
    warnings.push('Limited character interiority');
    score -= 5;
  }
  if (!sceneCheck.hasMovement) {
    issues.push('Missing physical movement/action');
    score -= 10;
  }
  
  // 6. Exposition heaviness
  const expositionMatches = chapterContent.match(new RegExp(EXPOSITION_PATTERNS.map(p => p.source).join('|'), 'gi'));
  if (expositionMatches && expositionMatches.length > 10) {
    issues.push(`Exposition-heavy (${expositionMatches.length} exposition phrases)`);
    score -= 15;
  }
  
  // Determine if regeneration is needed
  const shouldRegenerate = score < 60 || issues.length > 3;
  
  return {
    isValid: score >= 60,
    score: Math.max(0, score),
    issues,
    warnings,
    shouldRegenerate,
    regenerationReason: shouldRegenerate 
      ? `Prose quality below threshold (score: ${score}/100)` 
      : undefined,
  };
}

/**
 * Generate enhanced system prompt for prose quality
 */
export function getProseQualityPrompt(): string {
  return `
CRITICAL PROSE CONSTRAINTS (FIRST-CLASS REQUIREMENTS):

1. CANON SANITATION (ABSOLUTE):
   - NEVER mention "Story Bible", "World Rules", "Lore Timeline", or any internal structures
   - NEVER use phrases like "According to the rules..." or "As stated in the canon..."
   - Apply world rules IMPLICITLY - never quote or name them
   - NO parenthetical canon labels or meta-explanations

2. SCENE-BASED PROSE (REQUIRED):
   - Write in SCENES, not summaries
   - Show action happening NOW, not "they talked about X"
   - Use sensory details, physical movement, and character interiority
   - NO synopsis-style writing

3. PARAGRAPH RHYTHM (STRICT):
   - Paragraphs: 1-3 sentences average
   - Frequent line breaks for white space
   - Vary sentence length for rhythm
   - Literary/light-novel hybrid style

4. OPENING SCENE RULE (HARD CONSTRAINT):
   - NEVER start with: waking up, morning routines, exposition dumps
   - START with: motion, conversation, social pressure, or immediate sensory input
   - Drop reader into active scene

5. SHOW DON'T TELL:
   - Prefer implication over explanation
   - Use dialogue and action to reveal information
   - Blend internal monologue with action
   - Avoid phrases like "had always been", "everyone knew", "it was known"

6. EMOTIONAL DEPTH:
   - Include character thoughts and feelings
   - Show physical reactions to emotions
   - Vary emotional tone throughout chapter
   - Avoid flat, reportorial narration

These are REQUIREMENTS, not suggestions. Violating them will trigger automatic regeneration.
`;
}
