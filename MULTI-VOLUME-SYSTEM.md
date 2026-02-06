# Multi-Volume/Multi-Act Storytelling System

## Overview

The Novelist AI system has been upgraded to support **serialized, multi-volume storytelling** similar to anime light novels, Wattpad romances, and web novels. This enables long-form narrative structure with proper emotional escalation, relationship progression, and satisfying payoffs across volumes and acts.

---

## Architecture

### **Hierarchy**

```
BOOK (Top-level project)
 └── VOLUME (Major narrative arc - e.g., "Volume 1: First Encounter")
      └── ACT (Structural unit - e.g., "Act 2: Rising Tension")
           └── CHAPTER (Individual scenes with emotional beats)
```

### **Memory Layers**

The AI uses a **4-layer memory system** when generating chapters:

1. **Global Memory** - Story Bible (canonical world rules, themes, constraints)
2. **Volume Memory** - Long-term arc tracking (unresolved arcs, character progression, promises)
3. **Act Memory** - Mid-term tension tracking (conflicts, misunderstandings, proximity events)
4. **Local Memory** - Chapter-to-chapter continuity (immediate context, hooks)

---

## Database Schema

### **Tables**

#### `volumes`
- `id` - Primary key
- `book_id` - Foreign key to books
- `volume_number` - Sequential number (1, 2, 3...)
- `title` - Volume title (e.g., "First Encounter")
- `theme` - Core theme of this volume
- `emotional_promise` - What emotional payoff this volume delivers
- `relationship_state_start` - Where relationships begin
- `relationship_state_end` - Where relationships end up
- `major_turning_point` - Key event that defines this volume
- `target_chapter_count` - Expected chapters (default: 20)
- `status` - draft | in-progress | completed

#### `acts`
- `id` - Primary key
- `volume_id` - Foreign key to volumes
- `act_number` - Sequential number within volume (1, 2, 3...)
- `title` - Optional act title
- `narrative_purpose` - setup | rising-tension | fracture | crisis | resolution | payoff
- `pacing` - slow | medium | fast
- `emotional_pressure` - 1-10 scale (1=calm, 10=crisis)
- `character_development_focus` - What character growth happens
- `target_chapter_count` - Expected chapters (default: 5)

#### `chapters` (updated)
- `id` - Primary key
- `book_id` - Foreign key to books
- `volume_id` - Foreign key to volumes
- `act_id` - Foreign key to acts
- `chapter_number` - Number within act (1, 2, 3...)
- `global_chapter_number` - Number across entire book
- `title` - Chapter title
- `content` - Full chapter text
- `summary` - Brief summary
- `word_count` - Calculated word count
- `emotional_beat` - What emotion/moment this chapter captures
- `relationship_shift` - How relationships change
- `scene_goal` - What this chapter accomplishes
- `hook_to_next` - Cliffhanger or question for next chapter
- `character_states` - JSONB character state tracking
- `world_changes` - JSONB world state changes
- `plot_progression` - JSONB plot advancement
- `emotional_state` - POV character's emotional state
- `unresolved_threads` - JSONB questions/tensions left open
- `canon_warnings` - JSONB canon violations (if any)
- `prose_quality_score` - 0-100 quality score
- `regeneration_count` - How many times regenerated

#### `volume_memory`
- `id` - Primary key
- `volume_id` - Foreign key to volumes
- `unresolved_arcs` - JSONB array of ongoing story threads
- `character_progression` - JSONB character development tracking
- `relationship_evolution` - Text describing relationship changes
- `thematic_threads` - JSONB array of thematic elements
- `promises_made` - JSONB array of narrative promises
- `promises_fulfilled` - JSONB array of delivered payoffs

#### `act_memory`
- `id` - Primary key
- `act_id` - Foreign key to acts
- `current_tension_level` - 1-10 scale
- `emotional_direction` - Text describing emotional trajectory
- `active_conflicts` - JSONB array of ongoing conflicts
- `proximity_events` - JSONB array of character proximity moments
- `misunderstandings` - JSONB array of relationship misunderstandings

---

## API Routes

### **Volumes**

- `GET /api/books/[bookId]/volumes` - List all volumes for a book
- `POST /api/books/[bookId]/volumes` - Create a new volume
- `GET /api/books/[bookId]/volumes/[volumeId]` - Get volume details
- `PATCH /api/books/[bookId]/volumes/[volumeId]` - Update volume
- `DELETE /api/books/[bookId]/volumes/[volumeId]` - Delete volume

### **Acts**

- `GET /api/books/[bookId]/volumes/[volumeId]/acts` - List all acts in a volume
- `POST /api/books/[bookId]/volumes/[volumeId]/acts` - Create a new act
- `GET /api/books/[bookId]/volumes/[volumeId]/acts/[actId]` - Get act details
- `PATCH /api/books/[bookId]/volumes/[volumeId]/acts/[actId]` - Update act
- `DELETE /api/books/[bookId]/volumes/[volumeId]/acts/[actId]` - Delete act

### **Generation**

- `POST /api/generate-volume-outline` - Generate multi-volume structure from Story Bible
  - Input: `{ storyBible, volumeCount, chaptersPerVolume }`
  - Output: Complete volume/act/chapter structure

- `POST /api/generate-chapter-v2` - Generate chapter with volume/act awareness
  - Input: `{ bookId, volumeId, actId, chapterNumber, globalChapterNumber, emotionalBeat, relationshipShift, sceneGoal, previousChapters }`
  - Output: Chapter with full context (volume theme, act purpose, emotional pressure)

---

## AI Generation Rules

### **Volume Structure**

Each volume should:
- Have a complete emotional arc with its own theme
- Build on previous volumes (escalating stakes, deepening relationships)
- Deliver a satisfying payoff while advancing the overall story
- Show clear relationship state evolution

### **Act Structure**

Typical volume contains 4-6 acts:

1. **Act 1: Setup** (slow pacing, emotional pressure 3/10)
   - Establish dynamics, baseline relationships
   - Subtle foreshadowing

2. **Act 2-3: Rising Tension** (medium pacing, pressure 5-7/10)
   - Build misunderstandings
   - Proximity events
   - Emotional awareness

3. **Act 4: Fracture/Crisis** (fast pacing, pressure 8-9/10)
   - Confrontation
   - Revelation
   - Relationship strain

4. **Act 5: Resolution** (medium pacing, pressure 6/10)
   - Reconciliation
   - Clarity
   - Emotional payoff

5. **Act 6: Payoff** (slow pacing, pressure 4/10)
   - Deliver on volume promises
   - Satisfying closure
   - Setup for next volume

### **Chapter Generation**

When generating a chapter, the AI considers:

- **Volume Theme** - Overarching emotional promise
- **Act Purpose** - Current structural goal (setup, tension, crisis, etc.)
- **Act Pacing** - Speed of narrative (slow, medium, fast)
- **Emotional Pressure** - Intensity level (1-10)
- **Character Development Focus** - What growth is happening
- **Previous Chapters** - Continuity and hooks
- **Volume/Act Memory** - Long-term and mid-term tracking

---

## Usage Example

### **1. Create a Book**
```typescript
POST /api/books
{
  "title": "My Romance Novel",
  "genre": "Romance",
  "pov": "First Person",
  "tone": "Emotional, Slow Burn"
}
```

### **2. Generate Story Bible**
```typescript
POST /api/generate-bible
{
  "whitepaper": "A story about two rivals who slowly fall in love...",
  "metadata": { "genre": "Romance", "tone": "Slow Burn" }
}
```

### **3. Generate Volume Outline**
```typescript
POST /api/generate-volume-outline
{
  "storyBible": { ... },
  "volumeCount": 3,
  "chaptersPerVolume": 20
}
```

This returns a complete structure with volumes, acts, and chapter beats.

### **4. Create Volume and Acts**
```typescript
POST /api/books/[bookId]/volumes
{
  "volumeNumber": 1,
  "title": "First Encounter",
  "theme": "Enemies to Awareness",
  "emotionalPromise": "From rivalry to reluctant respect",
  "relationshipStateStart": "Hostile rivals",
  "relationshipStateEnd": "Grudging allies",
  "majorTurningPoint": "Forced to work together on project"
}

POST /api/books/[bookId]/volumes/[volumeId]/acts
{
  "actNumber": 1,
  "narrativePurpose": "setup",
  "pacing": "slow",
  "emotionalPressure": 3,
  "characterDevelopmentFocus": "Establish rivalry and first impressions"
}
```

### **5. Generate Chapters**
```typescript
POST /api/generate-chapter-v2
{
  "bookId": "123",
  "volumeId": "456",
  "actId": "789",
  "chapterNumber": 1,
  "globalChapterNumber": 1,
  "emotionalBeat": "First awkward encounter in class",
  "relationshipShift": "Initial dislike established",
  "sceneGoal": "Show personality clash",
  "previousChapters": []
}
```

The AI will generate a chapter that:
- Respects the volume theme ("Enemies to Awareness")
- Follows the act purpose (setup)
- Matches the pacing (slow)
- Delivers the emotional beat
- Sets up the relationship shift

---

## Migration

If you have an existing database, run the migration script:

```sql
-- Run lib/db/migration-to-volumes.sql in Neon SQL Editor
```

This will:
- Create new `volumes`, `acts`, `volume_memory`, `act_memory` tables
- Add `current_volume` and `total_volumes` to `books`
- Backup existing chapters to `chapters_backup`
- Recreate `chapters` table with volume/act structure
- Remove old `outlines` and `chapter_outlines` tables

---

## Benefits

### **For Writers**
- ✅ Plan long-form series with clear structure
- ✅ Track emotional escalation across volumes
- ✅ Ensure satisfying payoffs at volume/act boundaries
- ✅ Maintain consistency across hundreds of chapters

### **For AI**
- ✅ Understand long-term narrative goals
- ✅ Generate chapters with appropriate pacing
- ✅ Track unresolved threads and promises
- ✅ Deliver emotionally coherent arcs

### **For Readers**
- ✅ Binge-readable serialized content
- ✅ Clear volume boundaries for natural stopping points
- ✅ Satisfying emotional payoffs
- ✅ Consistent character and relationship progression

---

## Future Enhancements

- **UI Components** - Volume selector, act navigator, collapsible chapter lists
- **Editor Integration** - Display volume/act context while writing
- **Memory Auto-Update** - Automatically update volume/act memory after each chapter
- **Arc Visualization** - Visual timeline of emotional escalation
- **Promise Tracking** - Dashboard showing unfulfilled narrative promises

---

## Technical Notes

- All database queries use Neon Postgres with proper foreign key constraints
- Memory layers are stored as JSONB for flexible schema
- API routes are protected with NextAuth authentication
- Chapter generation uses Claude 3.5 Sonnet with 16K token context
- Emotional pressure scales from 1 (calm) to 10 (crisis)

---

**The multi-volume system is now live and ready for serialized storytelling!** 🎉
