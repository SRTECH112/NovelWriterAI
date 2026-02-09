import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check if chapters table has act_id column
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'chapters'
      ORDER BY ordinal_position
    `;

    const hasActId = columns.some((col: any) => col.column_name === 'act_id');
    const hasChapterOrder = columns.some((col: any) => col.column_name === 'chapter_order');
    const hasActTag = columns.some((col: any) => col.column_name === 'act_tag');

    return NextResponse.json({
      needsMigration: hasActId,
      currentSchema: {
        hasActId,
        hasChapterOrder,
        hasActTag,
      },
      columns: columns.map((col: any) => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable
      }))
    });

  } catch (error: any) {
    console.error('Error checking schema:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
