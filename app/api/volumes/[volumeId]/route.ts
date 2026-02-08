import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { volumeId: string } }
) {
  try {
    const user = await requireAuth();
    const { volumeId } = params;
    const body = await request.json();
    const { outline } = body;

    // Verify volume belongs to user's book
    const volumeCheck = await sql`
      SELECT v.id, v.book_id, b.user_id 
      FROM volumes v
      JOIN books b ON v.book_id = b.id
      WHERE v.id = ${volumeId}
    `;

    if (volumeCheck.length === 0) {
      return NextResponse.json(
        { error: 'Volume not found' },
        { status: 404 }
      );
    }

    if (volumeCheck[0].user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update volume outline
    const result = await sql`
      UPDATE volumes
      SET outline = ${outline}, updated_at = NOW()
      WHERE id = ${volumeId}
      RETURNING *
    `;

    return NextResponse.json({ volume: result[0] });
  } catch (error: any) {
    console.error('Error updating volume outline:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update volume outline' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { volumeId: string } }
) {
  try {
    const user = await requireAuth();
    const { volumeId } = params;

    // Get volume with authorization check
    const result = await sql`
      SELECT v.* 
      FROM volumes v
      JOIN books b ON v.book_id = b.id
      WHERE v.id = ${volumeId} AND b.user_id = ${user.id}
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Volume not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ volume: result[0] });
  } catch (error: any) {
    console.error('Error fetching volume:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch volume' },
      { status: 500 }
    );
  }
}
