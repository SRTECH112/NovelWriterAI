import { NextRequest, NextResponse } from 'next/server';
import { generateOutline } from '@/lib/ai-service';
import { StoryBible, Outline } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyBible, actStructure, targetChapters } = body;

    if (!storyBible || !storyBible.id) {
      return NextResponse.json(
        { error: 'Story Bible is required' },
        { status: 400 }
      );
    }

    // Story Bible is automatically locked when approved in the workflow
    // No need to check lock status

    const chapters = await generateOutline(
      storyBible as StoryBible,
      actStructure || 'three-act',
      targetChapters || 40
    );

    const outline: Outline = {
      id: `outline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      storyBibleId: storyBible.id,
      actStructure: actStructure || 'three-act',
      chapters,
      keyMilestones: {
        midpoint: Math.floor(chapters.length / 2),
        climax: chapters.length - 3,
      },
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ outline });
  } catch (error: any) {
    console.error('Error generating Outline:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate Outline' },
      { status: 500 }
    );
  }
}
