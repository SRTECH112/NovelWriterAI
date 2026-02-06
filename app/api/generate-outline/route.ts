import { NextRequest, NextResponse } from 'next/server';
import { generateOutline } from '@/lib/ai-service';
import { StoryBible } from '@/lib/types';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { storyBible, actStructure, targetChapters } = body;

    if (!storyBible || !storyBible.id) {
      return NextResponse.json(
        { error: 'Story Bible is required. Note: This route is deprecated, use /api/generate-volume-outline for multi-volume structure.' },
        { status: 400 }
      );
    }

    const chapters = await generateOutline(
      storyBible as StoryBible,
      actStructure || 'three-act',
      targetChapters || 40
    );

    // Return legacy format for backward compatibility
    return NextResponse.json({
      outline: {
        id: `outline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        storyBibleId: storyBible.id,
        actStructure: actStructure || 'three-act',
        chapters,
        keyMilestones: {
          midpoint: Math.floor(chapters.length / 2),
          climax: chapters.length - 3,
        },
        createdAt: new Date().toISOString(),
      }
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error generating Outline:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate Outline' },
      { status: 500 }
    );
  }
}
