import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getBook } from '@/lib/db/queries';
import { saveOutline, getOutline } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const user = await requireAuth();
    const book = await getBook(params.bookId, user.id);
    
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    
    const outline = await getOutline(params.bookId);
    return NextResponse.json({ outline });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching outline:', error);
    return NextResponse.json({ error: 'Failed to fetch outline' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const user = await requireAuth();
    const book = await getBook(params.bookId, user.id);
    
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    
    const { outline } = await request.json();
    const outlineId = await saveOutline(params.bookId, outline);
    const saved = await getOutline(params.bookId);
    
    return NextResponse.json({ outline: saved });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error saving outline:', error);
    return NextResponse.json({ error: 'Failed to save outline' }, { status: 500 });
  }
}
