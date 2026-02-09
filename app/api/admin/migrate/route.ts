import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting migrations...');

    // Migration 1: Add volume outline column
    console.log('Migration 1: Adding outline column to volumes...');
    await sql`ALTER TABLE volumes ADD COLUMN IF NOT EXISTS outline TEXT`;

    // Migration 2: Remove act hierarchy
    console.log('Migration 2: Removing act hierarchy from chapters...');

    // Step 1: Add new columns
    console.log('Step 1: Adding chapter_order column...');
    await sql`ALTER TABLE chapters ADD COLUMN IF NOT EXISTS chapter_order INTEGER`;
    
    console.log('Step 2: Adding act_tag column...');
    await sql`ALTER TABLE chapters ADD COLUMN IF NOT EXISTS act_tag VARCHAR(200)`;
    
    console.log('Step 3: Adding page-based columns...');
    await sql`ALTER TABLE chapters ADD COLUMN IF NOT EXISTS target_word_count INTEGER DEFAULT 2750`;
    await sql`ALTER TABLE chapters ADD COLUMN IF NOT EXISTS target_page_count INTEGER DEFAULT 4`;
    await sql`ALTER TABLE chapters ADD COLUMN IF NOT EXISTS current_page_count INTEGER DEFAULT 0`;
    await sql`ALTER TABLE chapters ADD COLUMN IF NOT EXISTS outline TEXT`;

    // Step 2: Update chapter_order for existing chapters
    console.log('Step 4: Setting chapter_order values...');
    await sql`UPDATE chapters SET chapter_order = chapter_number WHERE chapter_order IS NULL`;

    // Step 3: Make chapter_order NOT NULL
    console.log('Step 4: Making chapter_order NOT NULL...');
    await sql`ALTER TABLE chapters ALTER COLUMN chapter_order SET NOT NULL`;

    // Step 4: Drop old constraints
    console.log('Step 5: Dropping old act_id foreign key...');
    await sql`ALTER TABLE chapters DROP CONSTRAINT IF EXISTS chapters_act_id_fkey`;

    console.log('Step 6: Dropping old unique constraint...');
    await sql`ALTER TABLE chapters DROP CONSTRAINT IF EXISTS chapters_act_id_chapter_number_key`;

    // Step 5: Add new unique constraint (only if it doesn't exist)
    console.log('Step 7: Adding new unique constraint (volume_id, chapter_number)...');
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'chapters_volume_id_chapter_number_key'
        ) THEN
          ALTER TABLE chapters ADD CONSTRAINT chapters_volume_id_chapter_number_key UNIQUE (volume_id, chapter_number);
        END IF;
      END $$;
    `;

    // Step 6: Make volume_id NOT NULL
    console.log('Step 8: Making volume_id NOT NULL...');
    await sql`ALTER TABLE chapters ALTER COLUMN volume_id SET NOT NULL`;

    // Step 7: Migrate act info to act_tag (only if act_id column still exists)
    console.log('Step 9: Checking if act_id column exists...');
    const actIdExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'chapters' AND column_name = 'act_id'
    `;
    
    if (actIdExists.length > 0) {
      console.log('Step 9a: Migrating act information to act_tag...');
      await sql`
        UPDATE chapters c
        SET act_tag = (
          SELECT a.title 
          FROM acts a 
          WHERE a.id = c.act_id
        )
        WHERE c.act_id IS NOT NULL
      `;
      
      // Step 8: Drop act_id column
      console.log('Step 10: Dropping act_id column...');
      await sql`ALTER TABLE chapters DROP COLUMN IF EXISTS act_id`;
    } else {
      console.log('Step 9a: act_id column already removed, skipping migration');
    }

    console.log('✅ Migration completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'All migrations completed successfully',
      changes: [
        'Added outline column to volumes table',
        'Added chapter_order column to chapters',
        'Added act_tag column to chapters',
        'Removed act_id foreign key',
        'Removed old unique constraint (act_id, chapter_number)',
        'Added new unique constraint (volume_id, chapter_number)',
        'Dropped act_id column',
        'Chapters are now direct children of volumes'
      ]
    });

  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
