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

-- Books table
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
  current_chapter INTEGER DEFAULT 0,
  total_chapters INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_status CHECK (status IN ('draft', 'in-progress', 'completed', 'published'))
);

-- Story Bibles table
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

-- Outlines table
CREATE TABLE IF NOT EXISTS outlines (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  story_bible_id INTEGER REFERENCES story_bibles(id) ON DELETE CASCADE,
  act_structure VARCHAR(50) DEFAULT 'three-act',
  midpoint INTEGER,
  climax INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book_id),
  CONSTRAINT valid_act_structure CHECK (act_structure IN ('three-act', 'five-act'))
);

-- Chapter Outlines table
CREATE TABLE IF NOT EXISTS chapter_outlines (
  id SERIAL PRIMARY KEY,
  outline_id INTEGER NOT NULL REFERENCES outlines(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  summary TEXT,
  act INTEGER NOT NULL,
  bible_citations JSONB DEFAULT '[]',
  character_arcs JSONB DEFAULT '[]',
  beats JSONB DEFAULT '[]',
  pov VARCHAR(100),
  setting TEXT,
  canon_citations JSONB DEFAULT '[]',
  emotional_goal TEXT,
  conflict TEXT,
  relationship_movement TEXT,
  hook_for_next TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(outline_id, chapter_number)
);

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  outline_id INTEGER REFERENCES outlines(id) ON DELETE SET NULL,
  chapter_number INTEGER NOT NULL,
  title VARCHAR(500),
  content TEXT NOT NULL,
  summary TEXT,
  word_count INTEGER DEFAULT 0,
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
  UNIQUE(book_id, chapter_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_story_bibles_book_id ON story_bibles(book_id);
CREATE INDEX IF NOT EXISTS idx_outlines_book_id ON outlines(book_id);
CREATE INDEX IF NOT EXISTS idx_chapter_outlines_outline_id ON chapter_outlines(outline_id);
CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_chapters_chapter_number ON chapters(book_id, chapter_number);

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

CREATE TRIGGER update_outlines_updated_at BEFORE UPDATE ON outlines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
