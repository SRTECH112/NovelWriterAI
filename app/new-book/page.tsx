'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Loader2, Check, BookOpen, FileText } from 'lucide-react';
import { ProjectStore } from '@/lib/project-store';
import { StoryBible } from '@/lib/types';
import { NavigationBar } from '@/components/NavigationBar';

type Step = 'setup' | 'whitepaper' | 'bible' | 'outline';

export default function NewBookPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('setup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [pov, setPov] = useState('');
  const [tone, setTone] = useState('');
  const [targetWordCount, setTargetWordCount] = useState(80000);
  const [whitepaper, setWhitepaper] = useState('');
  const [storyOutline, setStoryOutline] = useState('');
  const [generatedBible, setGeneratedBible] = useState<StoryBible | null>(null);
  const [parsedOutline, setParsedOutline] = useState<any>(null);
  const [generatedOutline, setGeneratedOutline] = useState<any>(null);
  const [projectId, setProjectId] = useState<string>('');

  const handleSetupNext = () => {
    if (!title || !genre || !pov || !tone) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setCurrentStep('whitepaper');
  };

  const handleWhitepaperNext = () => {
    if (!whitepaper.trim()) {
      setError('Please provide your story concept or whitepaper');
      return;
    }
    setError('');
    setCurrentStep('bible');
  };

  const handleGenerateBible = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate-bible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whitepaper,
          metadata: { genre, tone, targetLength: targetWordCount, pov },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate Story Bible');
      }

      const result = await response.json();
      console.log('Story Bible generated:', result);
      setGeneratedBible(result.storyBible);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBible = async () => {
    if (!generatedBible) return;
    
    setLoading(true);
    setError('');

    try {
      // Create book in database
      const bookRes = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          genre,
          pov,
          tone,
          targetWordCount,
          status: 'draft',
        }),
      });

      if (!bookRes.ok) {
        const data = await bookRes.json();
        throw new Error(data.error || 'Failed to create book');
      }

      const bookData = await bookRes.json();
      const bookId = bookData.book.id;

      // Save Story Bible to database
      const bibleRes = await fetch(`/api/books/${bookId}/bible`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyBible: {
            raw_whitepaper: whitepaper,
            structured_sections: generatedBible.structured_sections,
            metadata: generatedBible.metadata,
            locked: true,
          },
        }),
      });

      if (!bibleRes.ok) {
        const data = await bibleRes.json();
        throw new Error(data.error || 'Failed to save Story Bible');
      }

      setProjectId(bookId.toString());

      // Parse story outline if provided
      if (storyOutline.trim()) {
        console.log('📝 Parsing story outline...');
        const outlineRes = await fetch('/api/parse-outline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookId,
            rawOutline: storyOutline,
          }),
        });

        if (!outlineRes.ok) {
          const data = await outlineRes.json();
          console.error('Outline parse error:', data);
          // Don't fail the whole flow, just warn
          setError(`Warning: ${data.error || 'Failed to parse outline'}. You can add chapters manually.`);
        } else {
          const outlineData = await outlineRes.json();
          console.log('✅ Outline parsed:', outlineData);
          setParsedOutline(outlineData);
        }
      }
      
      // Redirect to editor-v2
      router.push(`/editor-v2/${bookId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOutline = async () => {
    if (!generatedBible || !projectId) {
      console.error('Missing bible or projectId:', { generatedBible, projectId });
      setError('Story Bible or Project ID is missing');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Generating outline with:', { 
        bibleId: generatedBible.id, 
        projectId,
        actStructure: 'three-act',
        targetChapters: 40 
      });

      const response = await fetch('/api/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyBible: generatedBible,
          actStructure: 'three-act',
          targetChapters: 40,
        }),
      });

      console.log('Outline API response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error('Outline API error:', data);
        throw new Error(data.error || 'Failed to generate outline');
      }

      const result = await response.json();
      console.log('Outline generated:', result);
      setGeneratedOutline(result.outline);
    } catch (err: any) {
      console.error('Outline generation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOutline = () => {
    if (!generatedOutline || !projectId) return;

    const outline = ProjectStore.saveOutline(generatedOutline);
    ProjectStore.updateProject(projectId, { 
      outlineId: outline.id,
      status: 'in-progress',
      totalChapters: outline.chapters.length,
    });

    router.push(`/editor/${projectId}`);
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'setup', label: 'Setup', number: 1 },
      { key: 'whitepaper', label: 'Concept', number: 2 },
      { key: 'bible', label: 'Story Bible', number: 3 },
      { key: 'outline', label: 'Outline', number: 4 },
    ];

    const currentIndex = steps.findIndex(s => s.key === currentStep);

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              index <= currentIndex ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background'
            }`}>
              {index < currentIndex ? <Check className="h-5 w-5" /> : step.number}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-24 h-0.5 ${index < currentIndex ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Create New Book</h1>
          <p className="text-muted-foreground">Follow the steps to set up your AI-powered novel project</p>
        </div>

        {renderStepIndicator()}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {currentStep === 'setup' && (
          <Card>
            <CardHeader>
              <CardTitle>Book Setup</CardTitle>
              <CardDescription>Define the basic parameters for your novel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Book Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your book title"
                />
              </div>

              <div>
                <Label htmlFor="genre">Genre</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fantasy">Fantasy</SelectItem>
                    <SelectItem value="sci-fi">Science Fiction</SelectItem>
                    <SelectItem value="mystery">Mystery</SelectItem>
                    <SelectItem value="thriller">Thriller</SelectItem>
                    <SelectItem value="romance">Romance</SelectItem>
                    <SelectItem value="literary">Literary Fiction</SelectItem>
                    <SelectItem value="historical">Historical Fiction</SelectItem>
                    <SelectItem value="horror">Horror</SelectItem>
                    <SelectItem value="contemporary">Contemporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="pov">Point of View</Label>
                <Select value={pov} onValueChange={setPov}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select POV" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first-person">First Person</SelectItem>
                    <SelectItem value="third-person-limited">Third Person Limited</SelectItem>
                    <SelectItem value="third-person-omniscient">Third Person Omniscient</SelectItem>
                    <SelectItem value="multiple-pov">Multiple POV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tone">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="serious">Serious</SelectItem>
                    <SelectItem value="humorous">Humorous</SelectItem>
                    <SelectItem value="dramatic">Dramatic</SelectItem>
                    <SelectItem value="suspenseful">Suspenseful</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="wordcount">Target Word Count</Label>
                <Input
                  id="wordcount"
                  type="number"
                  value={targetWordCount}
                  onChange={(e) => setTargetWordCount(parseInt(e.target.value))}
                  min={10000}
                  max={200000}
                  step={10000}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Typical novel: 70,000-100,000 words
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSetupNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'whitepaper' && (
          <Card>
            <CardHeader>
              <CardTitle>Story Concept / Whitepaper</CardTitle>
              <CardDescription>Paste your full concept. This will be your canonical whitepaper.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="whitepaper">Story Concept / Whitepaper</Label>
                <Textarea
                  id="whitepaper"
                  value={whitepaper}
                  onChange={(e) => setWhitepaper(e.target.value)}
                  placeholder="Describe your story world, characters, magic systems, technology, factions, timeline, themes, and any other important details..."
                  className="min-h-[300px] font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Include as much detail as possible about your world, characters, rules, and story elements.
                </p>
              </div>

              <div>
                <Label htmlFor="storyOutline">
                  Story / Chapter Outline{' '}
                  <span className="text-muted-foreground font-normal">(optional but recommended)</span>
                </Label>
                <Textarea
                  id="storyOutline"
                  value={storyOutline}
                  onChange={(e) => setStoryOutline(e.target.value)}
                  placeholder="Paste your chapter outline here. Can be:&#10;- Bullet points&#10;- Chapter summaries&#10;- Act breakdowns&#10;- Messy notes&#10;&#10;Example:&#10;Act 1 - Setup&#10;Ch 1: Kate's first day, meets Marvin&#10;Ch 2: Discovers Marvin's secret identity&#10;Ch 3: Love triangle begins with Boy A&#10;&#10;Act 2 - Rising Tension&#10;Ch 4: Kate and Marvin grow closer&#10;..."
                  className="min-h-[300px] font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  AI will parse this into structured Acts and Chapters. Supports plain text, bullet points, or informal notes.
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep('setup')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleWhitepaperNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'bible' && (
          <Card>
            <CardHeader>
              <CardTitle>Story Bible Generation</CardTitle>
              <CardDescription>
                Generate a structured Story Bible from your concept. This will become the canonical source of truth for your novel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!generatedBible ? (
                <div className="text-center py-8">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Click below to generate your Story Bible from the provided concept
                  </p>
                  <Button onClick={handleGenerateBible} disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Generate Story Bible
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 max-h-[500px] overflow-y-auto space-y-4 text-sm">
                    <div>
                      <h3 className="font-semibold mb-2">Whitepaper (verbatim)</h3>
                      <div className="whitespace-pre-wrap bg-background border rounded p-3 text-xs">
                        {generatedBible.raw_whitepaper}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">World Rules</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {generatedBible.structured_sections.worldRules.map((rule, i) => (
                          <li key={i}>{rule}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Hard Constraints</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {generatedBible.structured_sections.hardConstraints.map((constraint, i) => (
                          <li key={i}>{constraint}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Themes & Tone</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {generatedBible.structured_sections.themesTone.map((theme, i) => (
                          <li key={i}>{theme}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Factions</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {generatedBible.structured_sections.factions.map((faction, i) => (
                          <li key={i}><span className="font-semibold">{faction.name}:</span> {faction.description} (Goals: {faction.goals})</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Timeline</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {generatedBible.structured_sections.loreTimeline.map((event, i) => (
                          <li key={i}><span className="font-semibold">{event.period}:</span> {event.event}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setGeneratedBible(null)}>
                      Regenerate
                    </Button>
                    <Button onClick={handleApproveBible}>
                      Approve & Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 'outline' && (
          <Card>
            <CardHeader>
              <CardTitle>Chapter Outline</CardTitle>
              <CardDescription>
                Generate a complete chapter-by-chapter outline for your novel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!generatedOutline ? (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Generate a structured outline with 30-50 chapters
                  </p>
                  <Button onClick={handleGenerateOutline} disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Generate Outline
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                    <p className="text-sm text-muted-foreground mb-4">
                      {generatedOutline.chapters.length} chapters • {generatedOutline.actStructure} structure
                    </p>
                    <div className="space-y-3">
                      {generatedOutline.chapters.map((chapter: any) => (
                        <div key={chapter.number} className="border-l-2 border-primary pl-3 py-2 space-y-1">
                          <div className="font-medium text-sm flex justify-between items-center">
                            <span>Chapter {chapter.number}: {chapter.title}</span>
                            <span className="text-[11px] text-muted-foreground">POV: {chapter.pov || 'N/A'}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Act {chapter.act} • {chapter.summary}</div>
                          {chapter.setting && (
                            <div className="text-xs text-muted-foreground">📍 {chapter.setting}</div>
                          )}
                          {chapter.emotionalGoal && (
                            <div className="text-xs"><span className="font-semibold">Emotional Goal:</span> {chapter.emotionalGoal}</div>
                          )}
                          {chapter.conflict && (
                            <div className="text-xs"><span className="font-semibold">Conflict:</span> {chapter.conflict}</div>
                          )}
                          {chapter.beats && (
                            <div>
                              <div className="text-xs font-semibold mt-1">Beats:</div>
                              <ul className="list-disc list-inside text-xs space-y-1">
                                {chapter.beats.map((beat: any, idx: number) => (
                                  <li key={idx}>{beat}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {chapter.relationshipMovement && (
                            <div className="text-xs"><span className="font-semibold">Relationship:</span> {chapter.relationshipMovement}</div>
                          )}
                          {chapter.hookForNext && (
                            <div className="text-xs italic text-primary">🪝 {chapter.hookForNext}</div>
                          )}
                          {chapter.canonCitations && chapter.canonCitations.length > 0 && (
                            <div className="text-[11px] text-muted-foreground">Canon: {chapter.canonCitations.join('; ')}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setGeneratedOutline(null)}>
                      Regenerate
                    </Button>
                    <Button onClick={handleApproveOutline}>
                      Start Writing
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
