import { NextRequest, NextResponse } from 'next/server';
import { generateStoryBible } from '@/lib/ai-service';
import { StoryBible } from '@/lib/types';
import { requireAuth } from '@/lib/auth';
import { saveStoryBible } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { whitepaper, characters, settings, metadata, bookId } = body;

    if (!whitepaper || whitepaper.trim().length === 0) {
      return NextResponse.json(
        { error: 'Whitepaper text is required' },
        { status: 400 }
      );
    }

    const structured_sections = await generateStoryBible(whitepaper, metadata || {});

    const storyBible: StoryBible = {
      id: `bible_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      raw_whitepaper: whitepaper,
      characters: characters || '',
      settings: settings || '',
      structured_sections,
      locked: false,
      metadata: metadata || {},
      createdAt: new Date().toISOString(),
    };

    // Save to database if bookId provided
    if (bookId) {
      await saveStoryBible(bookId, storyBible);
    }

    return NextResponse.json({ storyBible });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error generating Story Bible:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate Story Bible' },
      { status: 500 }
    );
  }
}
