import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getBook } from '@/lib/db/queries';
import { getVolume, createAct, getActsByVolume } from '@/lib/db/volume-queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string; volumeId: string } }
) {
  try {
    const user = await requireAuth();
    const { bookId, volumeId } = params;

    const book = await getBook(bookId, user.id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const volume = await getVolume(volumeId);
    if (!volume || volume.bookId !== bookId) {
      return NextResponse.json({ error: 'Volume not found' }, { status: 404 });
    }

    const acts = await getActsByVolume(volumeId);
    return NextResponse.json({ acts });
  } catch (error: any) {
    console.error('Error fetching acts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch acts' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { bookId: string; volumeId: string } }
) {
  try {
    const user = await requireAuth();
    const { bookId, volumeId } = params;

    const book = await getBook(bookId, user.id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const volume = await getVolume(volumeId);
    if (!volume || volume.bookId !== bookId) {
      return NextResponse.json({ error: 'Volume not found' }, { status: 404 });
    }

    const body = await request.json();
    const { actNumber, title, narrativePurpose, pacing, emotionalPressure, characterDevelopmentFocus, targetChapterCount } = body;

    if (!actNumber || !narrativePurpose) {
      return NextResponse.json(
        { error: 'Act number and narrative purpose are required' },
        { status: 400 }
      );
    }

    const act = await createAct(volumeId, {
      actNumber,
      title,
      narrativePurpose,
      pacing,
      emotionalPressure,
      characterDevelopmentFocus,
      targetChapterCount,
    });

    return NextResponse.json({ act }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating act:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create act' },
      { status: 500 }
    );
  }
}
