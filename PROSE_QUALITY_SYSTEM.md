# Prose Quality & Canon Sanitation System

## Overview

The Novelist AI application includes a **comprehensive prose validation layer** that ensures all generated chapters meet strict quality standards and contain zero canon leakage. This system operates as a **first-class constraint**, not a suggestion.

## Core Features

### 1. Canon Sanitation Layer (HARD REJECT)

**Purpose:** Prevent any references to internal Story Bible structures from appearing in prose.

**Automatically Rejects:**
- References to "Story Bible", "World Rules", "Lore Timeline"
- Meta language like "According to the canon..." or "As stated in the rules..."
- Parenthetical canon labels: `(per Story Bible)`, `(canon constraint)`
- Any explicit mention of internal structures

**Enforcement:**
- **Immediate rejection** if canon leakage detected
- **Automatic regeneration** with stricter constraints
- **Zero tolerance** - even one instance triggers rejection

**Example Violations:**
```
❌ "According to the Story Bible, magic requires..."
❌ "As stated in the world rules, technology is..."
❌ "The lore timeline shows that (canon: 500 years ago)..."
```

**Correct Approach:**
```
✅ "Magic required a blood sacrifice - it always had."
✅ "Technology was forbidden. Everyone knew why."
✅ "Five hundred years ago, the world had burned."
```

### 2. Scene-Based Prose Validation

**Purpose:** Ensure chapters are written as active scenes, not summaries.

**Requirements:**
- Write in **present action**, not retrospective summary
- Show events happening **now**, not "they talked about X"
- Include **sensory details**, **physical movement**, and **character interiority**
- Avoid synopsis-style writing

**Rejected Patterns:**
```
❌ "They talked about the plan for several hours."
❌ "After a while, they decided to leave."
❌ "Over the next few days, things changed."
❌ "Eventually, she realized the truth."
```

**Accepted Patterns:**
```
✅ "She leaned forward. 'We need to move tonight.'"
✅ "His hand trembled as he reached for the door."
✅ "Three days. That's all they had left."
✅ "The truth hit her like cold water. She gasped."
```

**Validation Metrics:**
- **Sensory details:** Minimum 1 per 100 words
- **Physical movement:** Minimum 1 action verb per 100 words
- **Character interiority:** Thoughts/feelings present throughout
- **Synopsis phrases:** Maximum 10 per chapter

### 3. Paragraph Rhythm Profile

**Purpose:** Enforce literary/light-novel hybrid style with breathable prose.

**Hard Rules:**
- **Average paragraph length:** 1-3 sentences
- **Maximum paragraph length:** 8 sentences (hard limit)
- **White space:** Frequent paragraph breaks required
- **Sentence variation:** Mix short and long sentences

**Quality Thresholds:**
- ✅ **Good:** Avg 1-3 sentences/paragraph, max 6 sentences
- ⚠️ **Warning:** Avg 3-4 sentences/paragraph, max 8 sentences
- ❌ **Reject:** Avg >4 sentences/paragraph or any paragraph >8 sentences

**Example:**

```
❌ BAD (Dense, unbroken):
The morning sun rose over the city as Sarah walked through the crowded streets, thinking about everything that had happened over the past few weeks and wondering what she should do next, because the situation had become increasingly complicated and she wasn't sure who to trust anymore, especially after what Marcus had told her yesterday about the conspiracy.

✅ GOOD (Breathable, rhythmic):
The morning sun rose over the city.

Sarah walked through the crowded streets. Everything from the past few weeks churned in her mind. What should she do next?

The situation had become complicated. She wasn't sure who to trust anymore.

Especially after what Marcus had told her.
```

### 4. Opening Scene Rule (HARD CONSTRAINT)

**Purpose:** Ensure chapters start with immediate engagement, not exposition.

**Forbidden Openings:**
- ❌ Waking up / morning routines
- ❌ "Another day began..."
- ❌ Exposition dumps about the world
- ❌ "It was a typical morning..."
- ❌ Alarm clocks, stretching, yawning

**Required Openings:**
- ✅ In motion (character already doing something)
- ✅ In conversation (dialogue starts immediately)
- ✅ Under social pressure (conflict present)
- ✅ Immediate sensory input (drop into scene)

**Examples:**

```
❌ REJECTED:
Sarah woke to the sound of her alarm. She stretched and yawned, then got out of bed and walked to the bathroom. It was another typical morning in the city.

✅ ACCEPTED:
"You're late." Marcus didn't look up from his screen.

Sarah dropped her bag on the desk. "Traffic."

"Right." His fingers stopped typing. "We need to talk."
```

### 5. Show Don't Tell Enforcement

**Purpose:** Prefer implication and action over explanation.

**Rejected Patterns:**
- "had always been" (exposition)
- "everyone knew" (telling)
- "it was known that" (telling)
- "for many years" (backstory dump)

**Preferred Techniques:**
- Dialogue reveals information
- Action demonstrates character
- Internal monologue shows thoughts
- Physical reactions convey emotions

**Example:**

```
❌ TELLING:
Sarah had always been afraid of heights. Everyone knew she avoided tall buildings.

✅ SHOWING:
Sarah's hands gripped the railing. White-knuckled. The ground swayed twenty floors below.

"You okay?" Marcus asked.

She couldn't answer. Couldn't breathe.
```

### 6. Emotional Depth Requirements

**Purpose:** Ensure chapters have varied emotional tone and character depth.

**Required Elements:**
- Character thoughts and feelings present
- Physical reactions to emotions shown
- Emotional tone varies throughout chapter
- Avoid flat, reportorial narration

**Validation:**
- Checks for interiority markers (thought, felt, wondered, realized)
- Ensures emotional variety (not monotone)
- Flags purely external/action-only writing

## Automatic Regeneration System

### How It Works

1. **Chapter Generated** → AI produces initial draft
2. **Prose Validation** → Automated quality check runs
3. **Score Calculated** → 0-100 based on all criteria
4. **Decision Point:**
   - **Score ≥ 80:** ✅ Excellent - Accept immediately
   - **Score 60-79:** ⚠️ Good - Accept with warnings
   - **Score < 60:** ❌ Poor - Automatic regeneration

### Regeneration Process

**Maximum Attempts:** 3 per chapter

**Attempt 1:** Standard generation with all constraints
**Attempt 2:** Regenerate with specific issue fixes highlighted
**Attempt 3:** Final attempt with strictest constraints

**After 3 Attempts:**
- Return best result (even if score < 60)
- Display all quality issues to user
- User can manually regenerate if desired

### Validation Scoring

**Score Breakdown:**

| Criterion | Weight | Pass Threshold |
|-----------|--------|----------------|
| Canon Leakage | INSTANT FAIL | Zero tolerance |
| Opening Quality | 30 points | Must pass opening rules |
| Paragraph Rhythm | 20 points | Avg ≤ 4 sentences |
| Scene Elements | 33 points | All three present (sensory, movement, interiority) |
| Synopsis Detection | 20 points | Score < 30 |
| Exposition Level | 15 points | < 10 exposition phrases |

**Total Possible:** 100 points (excluding instant-fail canon leakage)

## UI Feedback

### Prose Quality Display

When viewing a generated chapter, users see:

**Color-Coded Score Badge:**
- 🟢 **Green (80-100):** Excellent prose quality
- 🟡 **Yellow (60-79):** Good with minor issues
- 🔴 **Red (0-59):** Poor quality, consider regenerating

**Detailed Feedback:**
- **Issues:** Critical problems that lowered score
- **Warnings:** Minor concerns to be aware of
- **Suggestions:** How to improve if regenerating

### Example UI Display

```
┌─────────────────────────────────────┐
│ Prose Quality Score            85/100│
├─────────────────────────────────────┤
│ ✅ No canon leakage detected        │
│ ✅ Strong opening scene             │
│ ✅ Good paragraph rhythm            │
│ ⚠️  Limited character interiority   │
└─────────────────────────────────────┘
```

## Implementation Details

### Files

**`lib/prose-validator.ts`**
- Core validation logic
- Pattern detection (canon leakage, bad openings, etc.)
- Scoring algorithms
- Quality analysis functions

**`lib/ai-service.ts`**
- Integration with chapter generation
- Automatic regeneration loop
- Prose quality prompt injection

**`components/ChapterWriter.tsx`**
- UI display of prose quality scores
- Visual feedback for issues/warnings
- Color-coded quality indicators

### Key Functions

```typescript
// Main validation entry point
validateChapterProse(content: string): ProseValidationResult

// Specific validators
detectCanonLeakage(text: string): { hasLeakage: boolean; matches: string[] }
validateOpening(text: string): { isValid: boolean; reason?: string }
analyzeParagraphs(text: string): ParagraphAnalysis
detectSynopsisWriting(text: string): { score: number; matches: number }
checkSceneElements(text: string): { hasSensory, hasInteriority, hasMovement }

// Prompt generation
getProseQualityPrompt(): string
```

## Best Practices for Users

### To Get High-Quality Chapters

1. **Trust the System:** Let automatic regeneration work
2. **Review Feedback:** Check prose quality scores and issues
3. **Manual Regenerate:** If score < 70, consider regenerating
4. **Understand Patterns:** Learn what triggers low scores

### Common Issues and Fixes

**Issue:** "Paragraphs too long"
- **Fix:** AI will automatically shorten paragraphs on regeneration

**Issue:** "Synopsis-style writing detected"
- **Fix:** AI will switch to scene-based prose with more dialogue/action

**Issue:** "Bad opening: waking up"
- **Fix:** AI will regenerate opening to start in motion/conversation

**Issue:** "Missing sensory details"
- **Fix:** AI will add more sensory descriptions and physical details

## Technical Notes

### Performance

- Validation runs **after** generation (not during)
- Average validation time: **< 100ms**
- Regeneration adds **~30 seconds** per attempt
- Maximum total time: **~2 minutes** (3 attempts)

### Extensibility

The system is designed to be extended:

```typescript
// Add new validation rules
const NEW_PATTERN = /your pattern here/gi;

// Add to validation function
if (text.match(NEW_PATTERN)) {
  issues.push("Your custom issue");
  score -= 10;
}
```

### Configuration

Thresholds can be adjusted in `prose-validator.ts`:

```typescript
const QUALITY_THRESHOLD = 60;  // Minimum acceptable score
const MAX_ATTEMPTS = 3;         // Regeneration attempts
const PARAGRAPH_LIMIT = 4;      // Max avg sentences per paragraph
```

## Summary

The Prose Quality & Canon Sanitation System ensures that every chapter generated by Novelist AI meets professional standards:

✅ **Zero canon leakage** - Story Bible stays invisible  
✅ **Scene-based prose** - Active, engaging writing  
✅ **Proper rhythm** - Breathable, literary style  
✅ **Strong openings** - No boring wake-up scenes  
✅ **Show don't tell** - Implication over explanation  
✅ **Emotional depth** - Rich character interiority  

This is a **first-class constraint system**, not optional suggestions. The AI is trained to meet these standards, and automatic regeneration ensures compliance.
