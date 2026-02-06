-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  password_hash VARCHAR(255),
  auth_provider VARCHAR(50) DEFAULT 'email',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Books table (top-level container)
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  genre VARCHAR(100),
  pov VARCHAR(100),
  tone VARCHAR(100),
  target_word_count INTEGER DEFAULT 80000,
  status VARCHAR(50) DEFAULT 'draft',
  canon_locked BOOLEAN DEFAULT false,
  current_volume INTEGER DEFAULT 1,
  current_chapter INTEGER DEFAULT 0,
  total_volumes INTEGER DEFAULT 1,
  total_chapters INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_status CHECK (status IN ('draft', 'in-progress', 'completed', 'published'))
);

-- Story Bibles table (global canon for entire book)
CREATE TABLE IF NOT EXISTS story_bibles (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  raw_whitepaper TEXT NOT NULL,
  world_rules JSONB DEFAULT '[]',
  lore_timeline JSONB DEFAULT '[]',
  factions JSONB DEFAULT '[]',
  technology_magic_rules JSONB DEFAULT '[]',
  themes_tone JSONB DEFAULT '[]',
  hard_constraints JSONB DEFAULT '[]',
  soft_guidelines JSONB DEFAULT '[]',
  locked BOOLEAN DEFAULT false,
  genre VARCHAR(100),
  tone VARCHAR(100),
  target_length INTEGER,
  pov VARCHAR(100),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book_id)
);

-- Volumes table (major narrative arcs)
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

-- Acts table (structural units within volumes)
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

-- Chapters table (actual content, nested under acts)
CREATE TABLE IF NOT EXISTS chapters (
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

-- Volume Memory table (long-term arc tracking)
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

-- Act Memory table (mid-term tension tracking)
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_story_bibles_book_id ON story_bibles(book_id);
CREATE INDEX IF NOT EXISTS idx_volumes_book_id ON volumes(book_id);
CREATE INDEX IF NOT EXISTS idx_volumes_status ON volumes(status);
CREATE INDEX IF NOT EXISTS idx_acts_volume_id ON acts(volume_id);
CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_chapters_volume_id ON chapters(volume_id);
CREATE INDEX IF NOT EXISTS idx_chapters_act_id ON chapters(act_id);
CREATE INDEX IF NOT EXISTS idx_chapters_global_number ON chapters(book_id, global_chapter_number);
CREATE INDEX IF NOT EXISTS idx_volume_memory_volume_id ON volume_memory(volume_id);
CREATE INDEX IF NOT EXISTS idx_act_memory_act_id ON act_memory(act_id);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_bibles_updated_at BEFORE UPDATE ON story_bibles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volumes_updated_at BEFORE UPDATE ON volumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_acts_updated_at BEFORE UPDATE ON acts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volume_memory_updated_at BEFORE UPDATE ON volume_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_act_memory_updated_at BEFORE UPDATE ON act_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
