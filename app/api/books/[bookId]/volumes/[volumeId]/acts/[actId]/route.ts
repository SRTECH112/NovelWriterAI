import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getBook } from '@/lib/db/queries';
import { getVolume, getAct, updateAct, deleteAct } from '@/lib/db/volume-queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string; volumeId: string; actId: string } }
) {
  try {
    const user = await requireAuth();
    const { bookId, volumeId, actId } = params;

    const book = await getBook(bookId, user.id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const volume = await getVolume(volumeId);
    if (!volume || volume.bookId !== bookId) {
      return NextResponse.json({ error: 'Volume not found' }, { status: 404 });
    }

    const act = await getAct(actId);
    if (!act || act.volumeId !== volumeId) {
      return NextResponse.json({ error: 'Act not found' }, { status: 404 });
    }

    return NextResponse.json({ act });
  } catch (error: any) {
    console.error('Error fetching act:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch act' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { bookId: string; volumeId: string; actId: string } }
) {
  try {
    const user = await requireAuth();
    const { bookId, volumeId, actId } = params;

    const book = await getBook(bookId, user.id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const volume = await getVolume(volumeId);
    if (!volume || volume.bookId !== bookId) {
      return NextResponse.json({ error: 'Volume not found' }, { status: 404 });
    }

    const act = await getAct(actId);
    if (!act || act.volumeId !== volumeId) {
      return NextResponse.json({ error: 'Act not found' }, { status: 404 });
    }

    const updates = await request.json();
    const updatedAct = await updateAct(actId, updates);

    return NextResponse.json({ act: updatedAct });
  } catch (error: any) {
    console.error('Error updating act:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update act' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { bookId: string; volumeId: string; actId: string } }
) {
  try {
    const user = await requireAuth();
    const { bookId, volumeId, actId } = params;

    const book = await getBook(bookId, user.id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const volume = await getVolume(volumeId);
    if (!volume || volume.bookId !== bookId) {
      return NextResponse.json({ error: 'Volume not found' }, { status: 404 });
    }

    const act = await getAct(actId);
    if (!act || act.volumeId !== volumeId) {
      return NextResponse.json({ error: 'Act not found' }, { status: 404 });
    }

    await deleteAct(actId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting act:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete act' },
      { status: 500 }
    );
  }
}
