import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { volumeId: string } }
) {
  try {
    console.log('🔵 PATCH /api/volumes/[volumeId] - Starting...');
    console.log('Volume ID:', params.volumeId);
    
    const user = await requireAuth();
    console.log('✅ User authenticated:', user.id);
    
    const { volumeId } = params;
    const body = await request.json();
    const { outline } = body;
    
    console.log('📝 Outline length:', outline?.length || 0);
    console.log('📝 Outline preview:', outline?.substring(0, 100));

    // Verify volume belongs to user's book
    console.log('🔍 Checking volume ownership...');
    const volumeCheck = await sql`
      SELECT v.id, v.book_id, b.user_id 
      FROM volumes v
      JOIN books b ON v.book_id = b.id
      WHERE v.id = ${volumeId}
    `;

    console.log('Volume check result:', volumeCheck);

    if (volumeCheck.length === 0) {
      console.log('❌ Volume not found');
      return NextResponse.json(
        { error: 'Volume not found' },
        { status: 404 }
      );
    }

    if (String(volumeCheck[0].user_id) !== String(user.id)) {
      console.log('❌ Unauthorized - user mismatch');
      console.log('DB user_id:', volumeCheck[0].user_id, 'type:', typeof volumeCheck[0].user_id);
      console.log('Auth user.id:', user.id, 'type:', typeof user.id);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    console.log('✅ Authorization passed');

    // Update volume outline
    console.log('💾 Updating volume outline...');
    const result = await sql`
      UPDATE volumes
      SET outline = ${outline}, updated_at = NOW()
      WHERE id = ${volumeId}
      RETURNING *
    `;

    console.log('✅ Update successful, rows affected:', result.length);
    console.log('Updated volume:', result[0]);

    return NextResponse.json({ volume: result[0] });
  } catch (error: any) {
    console.error('❌ Error updating volume outline:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update volume outline',
        details: error.toString()
      },
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
      WHERE v.id = ${volumeId} AND CAST(b.user_id AS TEXT) = ${String(user.id)}
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
