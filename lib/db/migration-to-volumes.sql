-- Migration script to upgrade existing database to multi-volume/multi-act system
-- Run this AFTER the initial schema has been created

-- Step 1: Create new tables (volumes, acts, memory tables)
CREATE TABLE IF NOT EXISTS volumes (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  volume_number INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  theme TEXT,
  emotional_promise TEXT,
  relationship_state_start TEXT,
  relationship_state_end TEXT,
  major_turning_point TEXT,
  target_chapter_count INTEGER DEFAULT 20,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book_id, volume_number),
  CONSTRAINT valid_volume_status CHECK (status IN ('draft', 'in-progress', 'completed'))
);

CREATE TABLE IF NOT EXISTS acts (
  id SERIAL PRIMARY KEY,
  volume_id INTEGER NOT NULL REFERENCES volumes(id) ON DELETE CASCADE,
  act_number INTEGER NOT NULL,
  title VARCHAR(500),
  narrative_purpose VARCHAR(100) NOT NULL,
  pacing VARCHAR(50) DEFAULT 'medium',
  emotional_pressure INTEGER DEFAULT 5,
  character_development_focus TEXT,
  target_chapter_count INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(volume_id, act_number),
  CONSTRAINT valid_purpose CHECK (narrative_purpose IN ('setup', 'rising-tension', 'fracture', 'crisis', 'resolution', 'payoff')),
  CONSTRAINT valid_pacing CHECK (pacing IN ('slow', 'medium', 'fast')),
  CONSTRAINT valid_pressure CHECK (emotional_pressure BETWEEN 1 AND 10)
);

CREATE TABLE IF NOT EXISTS volume_memory (
  id SERIAL PRIMARY KEY,
  volume_id INTEGER NOT NULL REFERENCES volumes(id) ON DELETE CASCADE,
  unresolved_arcs JSONB DEFAULT '[]',
  character_progression JSONB DEFAULT '{}',
  relationship_evolution TEXT,
  thematic_threads JSONB DEFAULT '[]',
  promises_made JSONB DEFAULT '[]',
  promises_fulfilled JSONB DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(volume_id)
);

CREATE TABLE IF NOT EXISTS act_memory (
  id SERIAL PRIMARY KEY,
  act_id INTEGER NOT NULL REFERENCES acts(id) ON DELETE CASCADE,
  current_tension_level INTEGER DEFAULT 5,
  emotional_direction TEXT,
  active_conflicts JSONB DEFAULT '[]',
  proximity_events JSONB DEFAULT '[]',
  misunderstandings JSONB DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(act_id),
  CONSTRAINT valid_tension CHECK (current_tension_level BETWEEN 1 AND 10)
);

-- Step 2: Add new columns to existing books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS current_volume INTEGER DEFAULT 1;
ALTER TABLE books ADD COLUMN IF NOT EXISTS total_volumes INTEGER DEFAULT 1;

-- Step 3: Backup existing chapters to temporary table
CREATE TABLE IF NOT EXISTS chapters_backup AS SELECT * FROM chapters;

-- Step 4: Drop old chapters table
DROP TABLE IF EXISTS chapters CASCADE;

-- Step 5: Create new chapters table with volume/act structure
CREATE TABLE chapters (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  volume_id INTEGER NOT NULL REFERENCES volumes(id) ON DELETE CASCADE,
  act_id INTEGER NOT NULL REFERENCES acts(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  global_chapter_number INTEGER NOT NULL,
  title VARCHAR(500),
  content TEXT NOT NULL,
  summary TEXT,
  word_count INTEGER DEFAULT 0,
  emotional_beat TEXT,
  relationship_shift TEXT,
  scene_goal TEXT,
  hook_to_next TEXT,
  character_states JSONB DEFAULT '{}',
  world_changes JSONB DEFAULT '[]',
  plot_progression JSONB DEFAULT '[]',
  emotional_state TEXT,
  unresolved_threads JSONB DEFAULT '[]',
  canon_warnings JSONB DEFAULT '[]',
  prose_quality_score INTEGER,
  prose_quality_issues JSONB DEFAULT '[]',
  prose_quality_warnings JSONB DEFAULT '[]',
  regeneration_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(act_id, chapter_number),
  UNIQUE(book_id, global_chapter_number)
);

-- Step 6: Drop old outline tables (no longer needed with volume/act system)
DROP TABLE IF EXISTS chapter_outlines CASCADE;
DROP TABLE IF EXISTS outlines CASCADE;

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_volumes_book_id ON volumes(book_id);
CREATE INDEX IF NOT EXISTS idx_volumes_status ON volumes(status);
CREATE INDEX IF NOT EXISTS idx_acts_volume_id ON acts(volume_id);
CREATE INDEX IF NOT EXISTS idx_chapters_volume_id ON chapters(volume_id);
CREATE INDEX IF NOT EXISTS idx_chapters_act_id ON chapters(act_id);
CREATE INDEX IF NOT EXISTS idx_chapters_global_number ON chapters(book_id, global_chapter_number);
CREATE INDEX IF NOT EXISTS idx_volume_memory_volume_id ON volume_memory(volume_id);
CREATE INDEX IF NOT EXISTS idx_act_memory_act_id ON act_memory(act_id);

-- Step 8: Add triggers for new tables
CREATE TRIGGER update_volumes_updated_at BEFORE UPDATE ON volumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_acts_updated_at BEFORE UPDATE ON acts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volume_memory_updated_at BEFORE UPDATE ON volume_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_act_memory_updated_at BEFORE UPDATE ON act_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration complete!
-- Note: Old chapter data is preserved in chapters_backup table
-- You can manually migrate it if needed, or start fresh with the new structure
