-- Remove Act-based hierarchy from chapters
-- Chapters become direct children of Volumes
-- Acts become optional metadata/tags only

-- Add new columns to chapters
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS chapter_order INTEGER;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS act_tag VARCHAR(200);

-- Update chapter_order for existing chapters (based on current chapter_number)
UPDATE chapters SET chapter_order = chapter_number WHERE chapter_order IS NULL;

-- Make chapter_order NOT NULL after setting values
ALTER TABLE chapters ALTER COLUMN chapter_order SET NOT NULL;

-- Drop the old act_id foreign key constraint
ALTER TABLE chapters DROP CONSTRAINT IF EXISTS chapters_act_id_fkey;

-- Drop the old unique constraint on (act_id, chapter_number)
ALTER TABLE chapters DROP CONSTRAINT IF EXISTS chapters_act_id_chapter_number_key;

-- Add new unique constraint on (volume_id, chapter_number)
ALTER TABLE chapters ADD CONSTRAINT chapters_volume_id_chapter_number_key UNIQUE (volume_id, chapter_number);

-- Make volume_id NOT NULL (it should already be, but enforce it)
ALTER TABLE chapters ALTER COLUMN volume_id SET NOT NULL;

-- Optional: Migrate act information to act_tag for existing chapters
UPDATE chapters c
SET act_tag = (
  SELECT a.title 
  FROM acts a 
  WHERE a.id = c.act_id
)
WHERE c.act_id IS NOT NULL;

-- Drop the act_id column (no longer needed)
ALTER TABLE chapters DROP COLUMN IF EXISTS act_id;

-- Add comments
COMMENT ON COLUMN chapters.chapter_order IS 'Order of chapter within volume (for sorting)';
COMMENT ON COLUMN chapters.act_tag IS 'Optional act label/tag (metadata only, not hierarchical parent)';
COMMENT ON TABLE chapters IS 'Chapters are direct children of volumes. Pages are children of chapters. Acts are optional metadata only.';

-- Note: Acts table remains for optional narrative tagging, but is no longer a hierarchical container
COMMENT ON TABLE acts IS 'Acts are optional narrative tags/metadata. They do NOT contain chapters. Chapters belong directly to volumes.';
