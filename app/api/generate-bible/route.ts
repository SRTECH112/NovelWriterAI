import { NextRequest, NextResponse } from 'next/server';
import { generateStoryBible } from '@/lib/ai-service';
import { StoryBible } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { whitepaper, metadata } = body;

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
      structured_sections,
      locked: false,
      metadata: metadata || {},
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ storyBible });
  } catch (error: any) {
    console.error('Error generating Story Bible:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate Story Bible' },
      { status: 500 }
    );
  }
}
