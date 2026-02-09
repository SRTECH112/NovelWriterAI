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
  const [characters, setCharacters] = useState('');
  const [settings, setSettings] = useState('');
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
    if (!characters.trim()) {
      setError('Please describe your main characters');
      return;
    }
    if (!settings.trim()) {
      setError('Please describe your story settings and world');
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
          characters,
          settings,
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

      // ALWAYS auto-generate structure (with or without user outline)
      console.log('🤖 Auto-generating story structure from Story Bible...');
      const outlineRes = await fetch('/api/parse-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          rawOutline: storyOutline.trim() || '', // Empty string if no outline provided
        }),
      });

      if (!outlineRes.ok) {
        const data = await outlineRes.json();
        console.error('Structure generation error:', data);
        throw new Error(data.error || 'Failed to generate story structure');
      }

      const outlineData = await outlineRes.json();
      console.log('✅ Story structure generated:', outlineData);
      setParsedOutline(outlineData);
      
      // Redirect to editor-v2 with complete structure
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
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold ${
              index <= currentIndex 
                ? 'border-blue-500 bg-blue-500 text-white' 
                : 'border-white/30 bg-white/10 backdrop-blur-sm text-white/70'
            }`}>
              {index < currentIndex ? <Check className="h-5 w-5" /> : step.number}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-24 h-0.5 ${index < currentIndex ? 'bg-blue-500' : 'bg-white/20'}`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen premium-page-bg text-white">
      <div className="glass-nav sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
      
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-12 mt-8 text-center fade-in-up">
          <h1 className="text-5xl font-bold mb-3 gradient-text">Create New Book</h1>
          <p className="text-white/70 text-lg">Follow the steps to set up your AI-powered novel project</p>
        </div>

        <div className="fade-in-up stagger-1">
          {renderStepIndicator()}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 glass-card fade-in-up">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {currentStep === 'setup' && (
          <div className="glass-card p-8 fade-in-up">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Book Setup</h2>
              <p className="text-white/70">Define the basic parameters for your novel</p>
            </div>
            <div className="space-y-5">
              <div>
                <Label htmlFor="title" className="text-white/90">Book Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your book title"
                  className="premium-input text-white placeholder:text-white/40"
                />
              </div>

              <div>
                <Label htmlFor="genre" className="text-white/90">Genre</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger className="premium-input text-white">
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
                <Label htmlFor="pov" className="text-white/90">Point of View</Label>
                <Select value={pov} onValueChange={setPov}>
                  <SelectTrigger className="premium-input text-white">
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
                <Label htmlFor="tone" className="text-white/90">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="premium-input text-white">
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
                <Label htmlFor="wordcount" className="text-white/90">Target Word Count</Label>
                <Input
                  id="wordcount"
                  type="number"
                  value={targetWordCount}
                  onChange={(e) => setTargetWordCount(parseInt(e.target.value))}
                  min={10000}
                  max={200000}
                  step={10000}
                  className="premium-input text-white"
                />
                <p className="text-sm text-white/50 mt-1">
                  Typical novel: 70,000-100,000 words
                </p>
              </div>

              <div className="flex justify-end pt-6">
                <Button onClick={handleSetupNext} className="gradient-button text-white">
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'whitepaper' && (
          <div className="glass-card p-8 fade-in-up">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Story Concept / Whitepaper</h2>
              <p className="text-white/70">Paste your full concept. This will be your canonical whitepaper.</p>
            </div>
            <div className="space-y-5">
              <div>
                <Label htmlFor="whitepaper" className="text-white/90">Story Concept / Whitepaper</Label>
                <Textarea
                  id="whitepaper"
                  value={whitepaper}
                  onChange={(e) => setWhitepaper(e.target.value)}
                  placeholder="Describe your story world, magic systems, technology, factions, timeline, themes, and any other important details..."
                  className="min-h-[250px] font-mono text-sm premium-input text-white placeholder:text-white/40"
                />
                <p className="text-sm text-white/50 mt-2">
                  Include as much detail as possible about your world, rules, and story elements.
                </p>
              </div>

              <div>
                <Label htmlFor="characters" className="text-white/90">Characters</Label>
                <Textarea
                  id="characters"
                  value={characters}
                  onChange={(e) => setCharacters(e.target.value)}
                  placeholder="Kate Andrea Clauzure – confident, socially powerful, hides emotional fatigue&#10;Marvin Jay Lockhart – reserved, observant, uncomfortable with attention&#10;&#10;List your main and supporting characters with their personalities, traits, and relationships."
                  className="min-h-[200px] font-mono text-sm premium-input text-white placeholder:text-white/40"
                />
                <p className="text-sm text-white/50 mt-2">
                  List main and supporting characters. Personality matters more than perfection.
                </p>
              </div>

              <div>
                <Label htmlFor="settings" className="text-white/90">Settings & World</Label>
                <Textarea
                  id="settings"
                  value={settings}
                  onChange={(e) => setSettings(e.target.value)}
                  placeholder="Mabini Colleges, Daet — elite private academy with strict social hierarchy&#10;&#10;Describe your key locations, atmosphere, social rules, and time period."
                  className="min-h-[200px] font-mono text-sm premium-input text-white placeholder:text-white/40"
                />
                <p className="text-sm text-white/50 mt-2">
                  Describe locations, atmosphere, and world rules that shape your story.
                </p>
              </div>

              <div>
                <Label htmlFor="storyOutline" className="text-white/90">
                  Story / Chapter Outline{' '}
                  <span className="text-white/50 font-normal">(optional but recommended)</span>
                </Label>
                <Textarea
                  id="storyOutline"
                  value={storyOutline}
                  onChange={(e) => setStoryOutline(e.target.value)}
                  placeholder="Paste your chapter outline here. Can be:&#10;- Bullet points&#10;- Chapter summaries&#10;- Act breakdowns&#10;- Messy notes&#10;&#10;Example:&#10;Act 1 - Setup&#10;Ch 1: Kate's first day, meets Marvin&#10;Ch 2: Discovers Marvin's secret identity&#10;Ch 3: Love triangle begins with Boy A&#10;&#10;Act 2 - Rising Tension&#10;Ch 4: Kate and Marvin grow closer&#10;..."
                  className="min-h-[250px] font-mono text-sm premium-input text-white placeholder:text-white/40"
                />
                <p className="text-sm text-white/50 mt-2">
                  AI will parse this into structured Acts and Chapters. Supports plain text, bullet points, or informal notes.
                </p>
              </div>

              <div className="flex justify-between pt-6">
                <Button variant="outline" className="glass-panel border-white/20 text-white hover:bg-white/10" onClick={() => setCurrentStep('setup')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleWhitepaperNext} className="gradient-button text-white">
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'bible' && (
          <div className="glass-card p-8 fade-in-up">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Story Bible Generation</h2>
              <p className="text-white/70">
                Generate a structured Story Bible from your concept. This will become the canonical source of truth for your novel.
              </p>
            </div>
            <div className="space-y-5">
              {!generatedBible ? (
                <div className="text-center py-12">
                  <BookOpen className="h-20 w-20 mx-auto mb-6 text-purple-300 opacity-50" />
                  <p className="text-white/70 mb-6 text-lg">
                    Click below to generate your Story Bible from the provided concept
                  </p>
                  <Button onClick={handleGenerateBible} disabled={loading} className="gradient-button text-white">
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Generate Story Bible
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="bg-white/5 rounded-lg p-6 max-h-[500px] overflow-y-auto space-y-4 text-sm border border-white/10">
                    <div>
                      <h3 className="font-semibold mb-2">Whitepaper (verbatim)</h3>
                      <div className="whitespace-pre-wrap bg-background border rounded p-3 text-xs">
                        {generatedBible.raw_whitepaper}
                      </div>
                    </div>

                    {generatedBible.structured_sections?.worldRules?.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">World Rules</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {generatedBible.structured_sections.worldRules.map((rule: string, i: number) => (
                            <li key={i}>{rule}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {generatedBible.structured_sections?.hardConstraints?.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Hard Constraints</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {generatedBible.structured_sections.hardConstraints.map((constraint: string, i: number) => (
                            <li key={i}>{constraint}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {generatedBible.structured_sections?.themesTone?.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Themes & Tone</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {generatedBible.structured_sections.themesTone.map((theme: string, i: number) => (
                            <li key={i}>{theme}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {generatedBible.structured_sections?.factions?.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Factions</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {generatedBible.structured_sections.factions.map((faction: any, i: number) => (
                            <li key={i}><span className="font-semibold">{faction.name}:</span> {faction.description} (Goals: {faction.goals})</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {generatedBible.structured_sections?.loreTimeline?.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Timeline</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {generatedBible.structured_sections.loreTimeline.map((event: any, i: number) => (
                            <li key={i}><span className="font-semibold">{event.period}:</span> {event.event}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button variant="outline" className="glass-panel border-white/20 text-white hover:bg-white/10" onClick={() => setGeneratedBible(null)}>
                      Regenerate
                    </Button>
                    <Button onClick={handleApproveBible} className="gradient-button text-white">
                      Approve & Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
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
