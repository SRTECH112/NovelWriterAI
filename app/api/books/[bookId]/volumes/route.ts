import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getBook } from '@/lib/db/queries';
import { createVolume, getVolumesByBook } from '@/lib/db/volume-queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const user = await requireAuth();
    const bookId = params.bookId;

    const book = await getBook(bookId, user.id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const volumes = await getVolumesByBook(bookId);
    return NextResponse.json({ volumes });
  } catch (error: any) {
    console.error('Error fetching volumes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch volumes' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const user = await requireAuth();
    const bookId = params.bookId;

    const book = await getBook(bookId, user.id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const body = await request.json();
    const { volumeNumber, title, theme, emotionalPromise, relationshipStateStart, relationshipStateEnd, majorTurningPoint, targetChapterCount } = body;

    if (!volumeNumber || !title) {
      return NextResponse.json(
        { error: 'Volume number and title are required' },
        { status: 400 }
      );
    }

    const volume = await createVolume(bookId, {
      volumeNumber,
      title,
      theme,
      emotionalPromise,
      relationshipStateStart,
      relationshipStateEnd,
      majorTurningPoint,
      targetChapterCount,
    });

    return NextResponse.json({ volume }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating volume:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create volume' },
      { status: 500 }
    );
  }
}
