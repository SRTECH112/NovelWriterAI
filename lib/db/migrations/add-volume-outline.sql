-- Add outline column to volumes table for user-defined volume/chapter outlines
ALTER TABLE volumes ADD COLUMN IF NOT EXISTS outline TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN volumes.outline IS 'User-defined volume and chapter-by-chapter outline that is binding for AI generation';
