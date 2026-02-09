# Story Bible Generation Architecture

## 🎯 Overview

The Story Bible generation system has been completely refactored to aggregate **ALL user inputs** from the `/new-book` setup flow, not just the whitepaper. This ensures the generated Story Bible reflects the complete user specification and maintains consistency across all narrative elements.

---

## 🏗️ Architecture Components

### 1. **StoryCanonInput** - Centralized Input Aggregator

**Location:** `lib/story-canon-aggregator.ts`

The `StoryCanonInput` interface is the **single source of truth** for all user inputs. The Story Bible generator is **not allowed** to read directly from UI fields—it must **only** read from this structured object.

```typescript
interface StoryCanonInput {
  core_whitepaper: string;           // Narrative foundation
  characters_input: string;          // Character canon (immutable)
  settings_input: string;            // World & setting canon
  story_outline?: string;            // Structural guidance
  metadata: {
    title: string;
    genre: string;
    pov: string;
    tone: string;
    targetWordCount: number;
  };
  // Future expansion: questionnaires, constraints, style preferences
}
```

### 2. **Story Bible Generator** - AI Service

**Location:** `lib/ai-service-bible.ts`

The generator uses GPT-4 with strict instructions to:
- Incorporate **ALL** input categories
- Use character names **exactly** as provided
- Use settings **exactly** as provided
- Synthesize whitepaper content (not just copy it)
- Document conflicts in hard constraints

**Key Functions:**
- `generateStoryBible(input: StoryCanonInput)` - Main generation function
- `validateGeneratedBible(bible, input)` - Post-generation validation
- `convertBibleToDBFormat(bible, input)` - Database conversion

### 3. **Validation System**

**Two-stage validation:**

#### Stage 1: Input Validation (Pre-generation)
```typescript
validateStoryCanonInput(input: StoryCanonInput)
```
- Checks required fields (whitepaper, characters, settings, title, genre)
- Returns errors (blocking) and warnings (non-blocking)

#### Stage 2: Output Validation (Post-generation)
```typescript
validateGeneratedBible(bible: GeneratedStoryBible, input: StoryCanonInput)
```
- Verifies all input characters are present with exact names
- Checks settings are represented
- Validates themes exist
- Ensures genre alignment
- Returns validation report with errors and warnings

---

## 📋 Input Priority Rules

When generating the Story Bible, the AI follows this strict priority order:

1. **Character Canon** (from `characters_input`) - **IMMUTABLE, HIGHEST PRIORITY**
   - Full names must be used exactly
   - No renaming, shortening, or modifications allowed
   - No invented characters

2. **Settings Canon** (from `settings_input`) - **IMMUTABLE, SECOND PRIORITY**
   - Locations must be used exactly
   - No invented locations
   - Atmosphere and rules extracted as-is

3. **Metadata** (genre, tone, POV) - **MUST BE REFLECTED**
   - Themes must align with genre/tone
   - POV must be consistent

4. **Story Outline** (if provided) - **STRUCTURAL GUIDANCE**
   - Used for volume/chapter intent
   - Act structure and pacing

5. **Core Whitepaper** - **FILLS GAPS ONLY**
   - Used for details not covered by other inputs
   - Cannot override Characters or Settings

6. **AI Inference** - **LAST RESORT ONLY**
   - Only for unspecified details

### Conflict Resolution
- If multiple inputs conflict: **Favor the most specific input**
- Example: Character box > Whitepaper prose
- Unresolvable conflicts → Document in "hard_constraints"

---

## 📚 Generated Story Bible Structure

The generated Story Bible includes **10 mandatory sections**:

```typescript
interface GeneratedStoryBible {
  core_premise: string;                    // 2-3 sentence elevator pitch
  themes: string[];                        // 3-5 major themes
  character_profiles: Array<{              // STRICT: Only from characters_input
    full_name: string;                     // EXACT name from input
    short_name?: string;
    personality: string;
    traits: string[];
    relationships: string;
    arc: string;
    source: 'characters_input';
  }>;
  world_settings: Array<{                  // STRICT: Only from settings_input
    location: string;
    description: string;
    atmosphere: string;
    social_rules?: string;
    source: 'settings_input';
  }>;
  world_rules: string[];                   // Magic, technology, physics
  factions?: Array<{...}>;                 // Organizations, groups
  timeline?: Array<{...}>;                 // Historical events
  hard_constraints: string[];              // Non-negotiable rules
  soft_guidelines: string[];               // Flexible preferences
  narrative_intent: {                      // Pacing and structure
    pacing: string;
    emotional_journey: string;
    structure?: string;
  };
  technology_magic_rules?: string[];
}
```

Each section includes **source tracking** internally (not shown to user) to verify which input contributed to it.

---

## 🚨 Failure Conditions

The Story Bible generation **auto-rejects** if:

❌ Characters appear that weren't in `characters_input`  
❌ Character names are altered or shortened  
❌ Settings appear that weren't in `settings_input`  
❌ Themes contradict genre/tone metadata  
❌ Story Bible only mirrors whitepaper (ignoring other inputs)  
❌ Any input category is completely ignored  

---

## 🔄 Generation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User fills /new-book form (Steps 1-2)                   │
│    - Title, Genre, POV, Tone                                │
│    - Whitepaper                                             │
│    - Characters                                             │
│    - Settings                                               │
│    - Story Outline (optional)                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Build StoryCanonInput (app/new-book/page.tsx)           │
│    - Aggregates ALL inputs into single object               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Validate Input (lib/story-canon-aggregator.ts)          │
│    - Check required fields                                  │
│    - Return errors/warnings                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Generate Story Bible (lib/ai-service-bible.ts)          │
│    - Format inputs for AI with strict rules                │
│    - Call GPT-4 with JSON response format                  │
│    - Parse generated Bible                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Validate Output (lib/ai-service-bible.ts)               │
│    - Verify characters match exactly                        │
│    - Check settings are present                             │
│    - Validate themes and structure                          │
│    - Return validation report                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Convert to DB Format (lib/ai-service-bible.ts)          │
│    - Map to StoryBible interface                            │
│    - Preserve all input sources                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Save to Database (app/api/generate-bible/route.ts)      │
│    - Store complete Story Bible                             │
│    - Log validation results                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing & Validation

### Manual Testing Checklist

1. **Character Name Preservation**
   - [ ] Enter "Kate Andrea Clauzure" in Characters input
   - [ ] Verify Story Bible uses exact name (not "Kate Reyes" or "K. Clauzure")
   - [ ] Check character appears in `character_profiles` array

2. **Settings Preservation**
   - [ ] Enter "Mabini Colleges, Daet" in Settings input
   - [ ] Verify Story Bible includes exact location
   - [ ] Check location appears in `world_settings` array

3. **Input Aggregation**
   - [ ] Fill all fields: Title, Genre, POV, Tone, Whitepaper, Characters, Settings, Outline
   - [ ] Verify Story Bible reflects ALL inputs
   - [ ] Check validation report has no errors

4. **Conflict Resolution**
   - [ ] Enter conflicting info in Whitepaper vs Characters
   - [ ] Verify Characters input takes priority
   - [ ] Check conflict documented in `hard_constraints`

5. **Validation Errors**
   - [ ] Leave Characters input empty
   - [ ] Verify API returns 400 error with details
   - [ ] Check error message is clear

### Automated Validation

The system automatically validates:
- ✅ All required fields present
- ✅ Character names match exactly
- ✅ Settings are represented
- ✅ Themes exist and align with genre
- ✅ Core premise is generated
- ⚠️ Warnings for missing optional fields

---

## 📊 API Changes

### Before (Old System)
```typescript
POST /api/generate-bible
{
  "whitepaper": "...",
  "characters": "...",
  "settings": "...",
  "metadata": {...}
}
```
❌ Only whitepaper was used for generation  
❌ Characters/Settings were stored but ignored  
❌ No validation  

### After (New System)
```typescript
POST /api/generate-bible
{
  "storyCanonInput": {
    "core_whitepaper": "...",
    "characters_input": "...",
    "settings_input": "...",
    "story_outline": "...",
    "metadata": {
      "title": "...",
      "genre": "...",
      "pov": "...",
      "tone": "...",
      "targetWordCount": 80000
    }
  }
}

Response:
{
  "storyBible": {...},
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  }
}
```
✅ ALL inputs aggregated and used  
✅ Two-stage validation  
✅ Validation report returned  

---

## 🎯 Expected Results

After this refactor:

✅ **Story Bible feels assembled, not improvised**
- Every section cites specific user inputs
- No AI hallucinations or assumptions

✅ **User recognizes their inputs everywhere**
- Character names match exactly
- Settings are preserved
- Themes reflect their choices

✅ **Whitepaper becomes a component, not the dictator**
- Used to fill gaps, not override canon
- Synthesized with other inputs

✅ **Later chapter generation becomes far more accurate**
- AI has complete, structured context
- Character consistency maintained
- World rules enforced

---

## 🔮 Future Enhancements

The `StoryCanonInput` structure is designed for expansion:

1. **User Questionnaires**
   ```typescript
   questionnaire_answers?: {
     themes?: string[];
     emotional_beats?: string[];
     ending_type?: string;
     pacing_preference?: string;
     romance_style?: string;
   }
   ```

2. **Volume & Chapter Configuration**
   ```typescript
   volumes_structure?: {
     planned_volumes?: number;
     chapters_per_volume?: number;
     act_structure?: string;
   }
   ```

3. **Writing Style Preferences**
   ```typescript
   writing_style_preferences?: {
     prose_style?: string;
     dialogue_density?: string;
     description_level?: string;
     reference_authors?: string[];
   }
   ```

4. **Constraints & Forbidden Elements**
   ```typescript
   constraints?: {
     forbidden_tropes?: string[];
     hard_constraints?: string[];
     soft_guidelines?: string[];
   }
   ```

---

## 📝 Summary

The Story Bible generation system now:
- ✅ Aggregates ALL user inputs via `StoryCanonInput`
- ✅ Enforces character and setting canon strictly
- ✅ Validates inputs before and after generation
- ✅ Prioritizes explicit user inputs over AI inference
- ✅ Documents conflicts and validation results
- ✅ Provides clear error messages and warnings
- ✅ Maintains source tracking for all sections

This architecture ensures the Story Bible is a **true reflection of user intent**, not an AI improvisation.
