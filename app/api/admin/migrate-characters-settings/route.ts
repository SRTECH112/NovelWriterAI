import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add admin check here if needed
    // const user = await requireAuth();
    
    console.log('🔄 Running migration: add_characters_settings_to_story_bibles');

    // Add characters column
    await sql`
      ALTER TABLE story_bibles 
      ADD COLUMN IF NOT EXISTS characters TEXT
    `;
    console.log('✅ Added characters column');

    // Add settings column
    await sql`
      ALTER TABLE story_bibles 
      ADD COLUMN IF NOT EXISTS settings TEXT
    `;
    console.log('✅ Added settings column');

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      columns_added: ['characters', 'settings']
    });
  } catch (error: any) {
    console.error('❌ Migration error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Migration failed',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
