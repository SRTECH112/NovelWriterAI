import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getBook } from '@/lib/db/queries';
import { getVolume, saveVolumeMemory, getVolumeMemory } from '@/lib/db/volume-queries';

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

    const memory = await getVolumeMemory(volumeId);
    return NextResponse.json({ memory });
  } catch (error: any) {
    console.error('Error fetching volume memory:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch volume memory' },
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
    const memory = await saveVolumeMemory(volumeId, body);

    return NextResponse.json({ memory });
  } catch (error: any) {
    console.error('Error saving volume memory:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save volume memory' },
      { status: 500 }
    );
  }
}
