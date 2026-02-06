import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getBook } from '@/lib/db/queries';
import { saveStoryBible, getStoryBible } from '@/lib/db/queries';

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
    
    const storyBible = await getStoryBible(params.bookId);
    return NextResponse.json({ storyBible });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching story bible:', error);
    return NextResponse.json({ error: 'Failed to fetch story bible' }, { status: 500 });
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
    
    const { storyBible } = await request.json();
    const saved = await saveStoryBible(params.bookId, storyBible);
    
    return NextResponse.json({ storyBible: saved });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error saving story bible:', error);
    return NextResponse.json({ error: 'Failed to save story bible' }, { status: 500 });
  }
}
