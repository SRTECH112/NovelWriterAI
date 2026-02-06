import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getBook, updateBook, deleteBook } from '@/lib/db/queries';
import { getStoryBible, getOutline, getChapters } from '@/lib/db/queries';

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
    
    // Fetch related data
    const storyBible = await getStoryBible(params.bookId);
    const outline = await getOutline(params.bookId);
    const chapters = await getChapters(params.bookId);
    
    return NextResponse.json({
      book: {
        ...book,
        storyBible,
        outline,
        chapters,
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching book:', error);
    return NextResponse.json({ error: 'Failed to fetch book' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const user = await requireAuth();
    const updates = await request.json();
    
    const book = await updateBook(params.bookId, user.id, updates);
    
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    
    return NextResponse.json({ book });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating book:', error);
    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const user = await requireAuth();
    await deleteBook(params.bookId, user.id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting book:', error);
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
  }
}
