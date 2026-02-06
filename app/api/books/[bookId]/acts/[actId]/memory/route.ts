import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getBook } from '@/lib/db/queries';
import { getAct, saveActMemory, getActMemory } from '@/lib/db/volume-queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string; actId: string } }
) {
  try {
    const user = await requireAuth();
    const { bookId, actId } = params;

    const book = await getBook(bookId, user.id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const act = await getAct(actId);
    if (!act) {
      return NextResponse.json({ error: 'Act not found' }, { status: 404 });
    }

    const memory = await getActMemory(actId);
    return NextResponse.json({ memory });
  } catch (error: any) {
    console.error('Error fetching act memory:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch act memory' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { bookId: string; actId: string } }
) {
  try {
    const user = await requireAuth();
    const { bookId, actId } = params;

    const book = await getBook(bookId, user.id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const act = await getAct(actId);
    if (!act) {
      return NextResponse.json({ error: 'Act not found' }, { status: 404 });
    }

    const body = await request.json();
    const memory = await saveActMemory(actId, body);

    return NextResponse.json({ memory });
  } catch (error: any) {
    console.error('Error saving act memory:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save act memory' },
      { status: 500 }
    );
  }
}
