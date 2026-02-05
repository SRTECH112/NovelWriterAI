'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Loader2 } from 'lucide-react';
import { StoryBible } from '@/lib/types';

interface WhitepaperInputProps {
  onBibleGenerated: (bible: StoryBible) => void;
}

export function WhitepaperInput({ onBibleGenerated }: WhitepaperInputProps) {
  const [whitepaper, setWhitepaper] = useState('');
  const [genre, setGenre] = useState('');
  const [tone, setTone] = useState('');
  const [targetLength, setTargetLength] = useState('');
  const [pov, setPov] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!whitepaper.trim()) {
      setError('Please paste your whitepaper text');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate-bible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whitepaper,
          metadata: {
            genre: genre || undefined,
            tone: tone || undefined,
            targetLength: targetLength ? parseInt(targetLength) : undefined,
            pov: pov || undefined,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate Story Bible');
      }

      const bible = await response.json();
      onBibleGenerated(bible);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Step 1: Whitepaper Input</CardTitle>
        <CardDescription>
          Paste your lore document or whitepaper. This will become the canonical source of truth.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Whitepaper / Lore Text *</label>
          <Textarea
            placeholder="Paste your world-building document, lore, or whitepaper here..."
            value={whitepaper}
            onChange={(e) => setWhitepaper(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Genre (optional)</label>
            <Input
              placeholder="e.g., Sci-Fi, Fantasy, Thriller"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Tone (optional)</label>
            <Input
              placeholder="e.g., Dark, Humorous, Epic"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Target Length (words, optional)</label>
            <Input
              type="number"
              placeholder="e.g., 80000"
              value={targetLength}
              onChange={(e) => setTargetLength(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">POV (optional)</label>
            <Input
              placeholder="e.g., First person, Third person limited"
              value={pov}
              onChange={(e) => setPov(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <Button onClick={handleGenerate} disabled={loading} className="w-full" size="lg">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Story Bible...
            </>
          ) : (
            'Generate Story Bible'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
