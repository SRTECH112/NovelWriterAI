import { NextRequest, NextResponse } from 'next/server';
import { StoryBible } from '@/lib/types';
import { requireAuth } from '@/lib/auth';
import { saveStoryBible } from '@/lib/db/queries';
import { generateStoryBible, convertBibleToDBFormat } from '@/lib/ai-service-bible';
import { StoryCanonInput, validateStoryCanonInput } from '@/lib/story-canon-aggregator';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { storyCanonInput, bookId } = body as { storyCanonInput: StoryCanonInput; bookId?: string };

    // Validate StoryCanonInput
    const inputValidation = validateStoryCanonInput(storyCanonInput);
    if (!inputValidation.valid) {
      return NextResponse.json(
        { 
          error: 'Invalid story canon input',
          details: inputValidation.errors,
        },
        { status: 400 }
      );
    }

    // Log warnings if any
    if (inputValidation.warnings.length > 0) {
      console.warn('Story Canon Input warnings:', inputValidation.warnings);
    }

    console.log('🎯 Generating Story Bible from complete StoryCanonInput...');
    console.log('📊 Input summary:', {
      title: storyCanonInput.metadata.title,
      genre: storyCanonInput.metadata.genre,
      hasCharacters: !!storyCanonInput.characters_input?.trim(),
      hasSettings: !!storyCanonInput.settings_input?.trim(),
      hasOutline: !!storyCanonInput.story_outline?.trim(),
    });

    // Generate Story Bible using centralized aggregator
    const { bible, validation } = await generateStoryBible(storyCanonInput);

    // Log validation results
    if (validation.errors.length > 0) {
      console.error('⚠️ Story Bible validation errors:', validation.errors);
    }
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Story Bible validation warnings:', validation.warnings);
    }

    // Convert to database format
    const dbBible = convertBibleToDBFormat(bible, storyCanonInput);

    const storyBible: StoryBible = {
      id: `bible_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...dbBible,
      createdAt: new Date().toISOString(),
    };

    // Save to database if bookId provided
    if (bookId) {
      await saveStoryBible(bookId, storyBible);
      console.log('✅ Story Bible saved to database for book:', bookId);
    }

    return NextResponse.json({ 
      storyBible,
      validation,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('❌ Error generating Story Bible:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate Story Bible' },
      { status: 500 }
    );
  }
}
