import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getBook } from '@/lib/db/queries';
import { getVolume, updateVolume, deleteVolume } from '@/lib/db/volume-queries';

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

    return NextResponse.json({ volume });
  } catch (error: any) {
    console.error('Error fetching volume:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch volume' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const updates = await request.json();
    const updatedVolume = await updateVolume(volumeId, updates);

    return NextResponse.json({ volume: updatedVolume });
  } catch (error: any) {
    console.error('Error updating volume:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update volume' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await deleteVolume(volumeId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting volume:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete volume' },
      { status: 500 }
    );
  }
}
