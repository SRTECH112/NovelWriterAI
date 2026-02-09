import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check chapters table columns
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'chapters'
      ORDER BY ordinal_position
    `;

    return NextResponse.json({
      columns: columns.map((col: any) => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable
      }))
    });

  } catch (error: any) {
    console.error('Error checking chapters schema:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
