'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, BookMarked } from 'lucide-react';
import { StoryBible } from '@/lib/types';

interface OutlineGeneratorProps {
  bible: StoryBible;
  onOutlineGenerated: (outline: any) => void;
}

export function OutlineGenerator({ bible, onOutlineGenerated }: OutlineGeneratorProps) {
  const [actStructure, setActStructure] = useState<'three-act' | 'five-act'>('three-act');
  const [targetChapters, setTargetChapters] = useState('40');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!bible.locked) {
      setError('Story Bible must be locked before generating outline');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyBible: bible,
          actStructure,
          targetChapters: parseInt(targetChapters) || 40,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate Outline');
      }

      const outline = await response.json();
      onOutlineGenerated(outline);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <BookMarked className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Step 3: Generate Outline</CardTitle>
            <CardDescription>Create a chapter-by-chapter structure based on the Story Bible</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Act Structure</label>
            <div className="flex gap-2">
              <Button
                variant={actStructure === 'three-act' ? 'default' : 'outline'}
                onClick={() => setActStructure('three-act')}
                className="flex-1"
              >
                3-Act
              </Button>
              <Button
                variant={actStructure === 'five-act' ? 'default' : 'outline'}
                onClick={() => setActStructure('five-act')}
                className="flex-1"
              >
                5-Act
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Target Chapters</label>
            <Input
              type="number"
              value={targetChapters}
              onChange={(e) => setTargetChapters(e.target.value)}
              min="10"
              max="100"
            />
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <Button onClick={handleGenerate} disabled={loading || !bible.locked} className="w-full" size="lg">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Outline...
            </>
          ) : (
            'Generate Outline'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
