-- Migration: Add characters and settings columns to story_bibles table
-- Date: 2024-02-09
-- Purpose: Store core narrative data (characters & settings) for AI generation

-- Add characters column
ALTER TABLE story_bibles 
ADD COLUMN IF NOT EXISTS characters TEXT;

-- Add settings column
ALTER TABLE story_bibles 
ADD COLUMN IF NOT EXISTS settings TEXT;

-- Add comments for documentation
COMMENT ON COLUMN story_bibles.characters IS 'Core character descriptions including personalities, traits, and relationships';
COMMENT ON COLUMN story_bibles.settings IS 'World settings, locations, atmosphere, and social rules';
