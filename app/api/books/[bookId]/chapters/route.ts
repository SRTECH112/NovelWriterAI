import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getBook } from '@/lib/db/queries';
import { saveChapter, getChapters } from '@/lib/db/queries';

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
    
    const chapters = await getChapters(params.bookId);
    return NextResponse.json({ chapters });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching chapters:', error);
    return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 });
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
    
    const { chapter } = await request.json();
    const saved = await saveChapter(params.bookId, chapter);
    
    return NextResponse.json({ chapter: saved });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error saving chapter:', error);
    return NextResponse.json({ error: 'Failed to save chapter' }, { status: 500 });
  }
}
