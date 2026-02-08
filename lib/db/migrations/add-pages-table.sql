-- Add page-based chapter system
-- Chapters become containers, pages are the writable units (600-900 words each)

-- Add new columns to chapters table
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS target_word_count INTEGER DEFAULT 2750;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS target_page_count INTEGER DEFAULT 4;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS current_page_count INTEGER DEFAULT 0;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS outline TEXT;

-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  beat_coverage TEXT,
  narrative_momentum TEXT,
  locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(chapter_id, page_number),
  CONSTRAINT valid_word_count CHECK (word_count BETWEEN 600 AND 900)
);

-- Add comments
COMMENT ON TABLE pages IS 'Pages are the only writable units. Each page is 600-900 words and covers 1-2 micro-beats.';
COMMENT ON COLUMN chapters.target_word_count IS 'Target chapter length: 2,500-3,000 words';
COMMENT ON COLUMN chapters.target_page_count IS 'Target number of pages: 3-5 pages';
COMMENT ON COLUMN chapters.current_page_count IS 'Actual number of pages generated';
COMMENT ON COLUMN chapters.outline IS 'Chapter-level outline broken into page beats';
COMMENT ON COLUMN pages.beat_coverage IS 'Which micro-beats this page covers';
COMMENT ON COLUMN pages.narrative_momentum IS 'How this page ends (must have forward momentum, not closure)';
COMMENT ON COLUMN pages.locked IS 'Lock previous pages to prevent regeneration';
