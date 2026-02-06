import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createBook, getUserBooks } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const books = await getUserBooks(user.id);
    
    return NextResponse.json({ books });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching books:', error);
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await request.json();
    
    const book = await createBook(user.id, {
      title: data.title,
      genre: data.genre,
      pov: data.pov,
      tone: data.tone,
      targetWordCount: data.targetWordCount || 80000,
      status: data.status || 'draft',
    });
    
    return NextResponse.json({ book });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating book:', error);
    return NextResponse.json({ error: 'Failed to create book' }, { status: 500 });
  }
}
