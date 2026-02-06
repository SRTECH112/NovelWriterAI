'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Plus, RefreshCw, Loader2, BookOpen, FileText, AlertTriangle, Edit, Lock } from 'lucide-react';
import { ProjectStore } from '@/lib/project-store';
import { ProjectWithDetails } from '@/lib/database-types';
import { Chapter } from '@/lib/types';
import { NavigationBar } from '@/components/NavigationBar';

export default function EditorPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectWithDetails | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBible, setShowBible] = useState(true);
  const [regenerating, setRegenerating] = useState<'bible' | 'outline' | null>(null);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = () => {
    const proj = ProjectStore.getProject(projectId);
    if (!proj) {
      router.push('/dashboard');
      return;
    }
    setProject(proj);
    if (proj.chapters.length > 0) {
      setSelectedChapter(proj.chapters[proj.chapters.length - 1]);
    }
  };

  const handleGenerateChapter = async (chapterNumber: number) => {
    if (!project?.storyBible || !project?.outline) {
      setError('Story Bible and Outline must be set before generating chapters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyBible: project.storyBible,
          outline: project.outline,
          chapterNumber,
          previousChapters: project.chapters,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate chapter');
      }

      const result = await response.json();
      ProjectStore.saveChapter(projectId, result.chapter);
      loadProject();
      setSelectedChapter(result.chapter);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateChapter = async (chapter: Chapter) => {
    if (!project?.storyBible || !project?.outline) return;

    setLoading(true);
    setError('');

    try {
      const previousChaps = project.chapters.filter(c => c.chapterNumber < chapter.chapterNumber);
      const response = await fetch('/api/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyBible: project.storyBible,
          outline: project.outline,
          chapterNumber: chapter.chapterNumber,
          previousChapters: previousChaps,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to regenerate chapter');
      }

      const result = await response.json();
      ProjectStore.saveChapter(projectId, result.chapter);
      loadProject();
      setSelectedChapter(result.chapter);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getNextChapterNumber = () => {
    if (!project?.chapters.length) return 1;
    return Math.max(...project.chapters.map(c => c.chapterNumber)) + 1;
  };

  const canGenerateNext = () => {
    if (!project?.outline) return false;
    const nextNum = getNextChapterNumber();
    return nextNum <= project.outline.chapters.length;
  };

  const handleRegenerateBible = async () => {
    if (!project?.storyBible) return;
    
    setRegenerating('bible');
    setError('');

    try {
      const response = await fetch('/api/generate-bible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whitepaper: project.storyBible.raw_whitepaper,
          metadata: project.storyBible.metadata,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to regenerate Story Bible');
      }

      const result = await response.json();
      const updatedBible = { ...result.storyBible, locked: project.storyBible.locked };
      ProjectStore.saveStoryBible(updatedBible);
      loadProject();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRegenerating(null);
    }
  };

  const handleRegenerateOutline = async () => {
    if (!project?.storyBible) return;

    setRegenerating('outline');
    setError('');

    try {
      const response = await fetch('/api/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyBible: project.storyBible,
          actStructure: project.outline?.actStructure || 'three-act',
          targetChapters: project.outline?.chapters.length || 40,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to regenerate Outline');
      }

      const result = await response.json();
      ProjectStore.saveOutline(result.outline);
      ProjectStore.updateProject(projectId, { outlineId: result.outline.id });
      loadProject();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRegenerating(null);
    }
  };

  const handleToggleLock = () => {
    if (!project?.storyBible) return;

    const updatedBible = { ...project.storyBible, locked: !project.storyBible.locked };
    ProjectStore.saveStoryBible(updatedBible);
    loadProject();
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const sections = project.storyBible?.structured_sections ?? {
    worldRules: [],
    loreTimeline: [],
    factions: [],
    technologyMagicRules: [],
    themesTone: [],
    hardConstraints: [],
    softGuidelines: [],
  };

  const safeSelectedChapter = selectedChapter
    ? {
        ...selectedChapter,
        stateDelta:
          selectedChapter.stateDelta ||
          { characterStates: {}, worldChanges: [], plotProgression: [] },
      }
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavigationBar />
      {/* Top Bar */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Menu
            </Button>
            <div className="border-l pl-4">
              <h1 className="font-semibold">{project.title}</h1>
              <p className="text-xs text-muted-foreground">
                {selectedChapter ? `Chapter ${selectedChapter.chapterNumber}` : 'No chapter selected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>Dashboard</Button>
            <Button variant="ghost" size="sm" onClick={() => router.push('/new-book')}>Story Bible</Button>
            <Badge variant="outline">{project.status}</Badge>
            <Badge variant="outline">
              {project.chapters.length} / {project.outline?.chapters.length || 0} chapters
            </Badge>
          </div>
        </div>
      </div>

      {error && (
        <div className="container mx-auto px-4 pt-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL - Chapter List */}
        <div className="w-64 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold mb-2">Chapters</h2>
            <Button 
              className="w-full" 
              size="sm"
              onClick={() => handleGenerateChapter(getNextChapterNumber())}
              disabled={loading || !canGenerateNext()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Generate Next
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {project.outline?.chapters.map((outlineChapter: any) => {
                const generatedChapter = project.chapters.find(c => c.chapterNumber === outlineChapter.number);
                const isSelected = selectedChapter?.chapterNumber === outlineChapter.number;

                return (
                  <div
                    key={outlineChapter.number}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                    }`}
                    onClick={() => generatedChapter && setSelectedChapter(generatedChapter)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Ch. {outlineChapter.number}</span>
                      {generatedChapter && (
                        <Badge variant={isSelected ? 'secondary' : 'default'} className="text-xs">
                          Written
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs opacity-90 line-clamp-2">{outlineChapter.title}</p>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* CENTER PANEL - Chapter Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {safeSelectedChapter ? (
            <>
              <div className="p-4 border-b bg-card flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Chapter {safeSelectedChapter.chapterNumber}</h2>
                  <p className="text-sm text-muted-foreground">{safeSelectedChapter.summary}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRegenerateChapter(safeSelectedChapter)}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Regenerate
                </Button>
              </div>

              {safeSelectedChapter.proseQuality && (
                <div className="px-4 pt-4">
                  <div className={`border rounded-lg p-3 ${
                    safeSelectedChapter.proseQuality.score >= 80 ? 'bg-green-50 border-green-200' :
                    safeSelectedChapter.proseQuality.score >= 60 ? 'bg-yellow-50 border-yellow-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Prose Quality</span>
                      <Badge variant={
                        safeSelectedChapter.proseQuality.score >= 80 ? 'default' :
                        safeSelectedChapter.proseQuality.score >= 60 ? 'secondary' :
                        'destructive'
                      }>
                        {safeSelectedChapter.proseQuality.score}/100
                      </Badge>
                    </div>
                    {safeSelectedChapter.proseQuality.issues.length > 0 && (
                      <div className="mt-2 text-xs space-y-1">
                        {safeSelectedChapter.proseQuality.issues.map((issue, i) => (
                          <div key={i} className="text-red-700">• {issue}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <ScrollArea className="flex-1 p-6">
                <div className="prose prose-sm max-w-none">
                  {safeSelectedChapter.content.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Chapter Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a chapter from the left panel or generate a new one
                </p>
                {canGenerateNext() && (
                  <Button onClick={() => handleGenerateChapter(getNextChapterNumber())} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Generate Chapter 1
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL - Story Bible & Info */}
        <div className="w-96 border-l bg-card flex flex-col overflow-hidden">
          <div className="p-4 border-b space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Canon Control</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push('/new-book')}>
                  <Edit className="h-4 w-4 mr-1" /> Edit Story Bible
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push('/new-book')}>
                  <Edit className="h-4 w-4 mr-1" /> Edit Outline
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="default" size="sm" onClick={handleRegenerateBible} disabled={loading || regenerating === 'bible' || !project.storyBible}>
                {regenerating === 'bible' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                Regenerate Bible
              </Button>
              <Button variant="default" size="sm" onClick={handleRegenerateOutline} disabled={loading || regenerating === 'outline' || !project.storyBible}>
                {regenerating === 'outline' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                Regenerate Outline
              </Button>
              <Button variant={project.storyBible?.locked ? 'outline' : 'default'} size="sm" onClick={handleToggleLock} disabled={!project.storyBible}>
                <Lock className="h-4 w-4 mr-1" /> {project.storyBible?.locked ? 'Canon Locked' : 'Approve & Lock Canon'}
              </Button>
            </div>
          </div>

          {project.storyBible && (
            <ScrollArea className="flex-1 p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Whitepaper (verbatim)</h3>
                <div className="text-xs whitespace-pre-wrap bg-muted/50 p-3 rounded border">{project.storyBible.raw_whitepaper}</div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2"><BookOpen className="h-4 w-4" /> World Rules</h3>
                <ul className="space-y-1 text-xs">
                  {sections.worldRules.map((rule, i) => (
                    <li key={i} className="pl-3 border-l-2 border-primary/30 py-1">{rule}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Hard Constraints</h3>
                <ul className="space-y-1 text-xs">
                  {sections.hardConstraints.map((c, i) => (
                    <li key={i} className="pl-3 border-l-2 border-destructive/30 py-1">{c}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Themes & Tone</h3>
                <ul className="space-y-1 text-xs">
                  {sections.themesTone.map((t, i) => (
                    <li key={i} className="pl-3 border-l-2 border-primary/20 py-1">{t}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Factions</h3>
                <div className="space-y-2">
                  {sections.factions.map((f, i) => (
                    <div key={i} className="bg-muted/50 rounded p-2 text-xs">
                      <div className="font-medium">{f.name}</div>
                      <div className="text-muted-foreground mt-1">{f.description}</div>
                      <div className="text-muted-foreground text-[11px] mt-1">Goals: {f.goals}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Timeline</h3>
                <div className="space-y-1 text-xs">
                  {(sections.loreTimeline || []).map((e, i) => (
                    <div key={i} className="pl-3 border-l-2 border-primary/30 py-1">
                      <div className="font-medium">{e.period}</div>
                      <div className="text-muted-foreground">{e.event}</div>
                    </div>
                  ))}
                </div>
              </div>

              {project.outline && (
                <div className="space-y-2 border-t pt-3">
                  <h3 className="font-semibold text-sm">Outline (beats view)</h3>
                  <div className="space-y-2 text-xs max-h-64 overflow-y-auto pr-2">
                    {project.outline.chapters.map((ch: any) => (
                      <div key={ch.number} className="border-l-2 border-primary/40 pl-3 py-1 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Ch {ch.number}: {ch.title}</span>
                          <span>POV: {ch.pov || 'N/A'}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">Act {ch.act} • {ch.summary}</div>
                        {ch.emotionalGoal && (
                          <div className="text-[11px]"><span className="font-semibold">Goal:</span> {ch.emotionalGoal}</div>
                        )}
                        {ch.conflict && (
                          <div className="text-[11px]"><span className="font-semibold">Conflict:</span> {ch.conflict}</div>
                        )}
                        {ch.beats && (
                          <ul className="list-disc list-inside space-y-1">
                            {ch.beats.map((b, idx) => (
                              <li key={idx}>{b}</li>
                            ))}
                          </ul>
                        )}
                        {ch.relationshipMovement && (
                          <div className="text-[11px]"><span className="font-semibold">Relationship:</span> {ch.relationshipMovement}</div>
                        )}
                        {ch.hookForNext && (
                          <div className="text-[11px] italic text-primary">🪝 {ch.hookForNext}</div>
                        )}
                        {ch.canonCitations && ch.canonCitations.length > 0 && (
                          <div className="text-[11px] text-muted-foreground">Canon: {ch.canonCitations.join('; ')}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {safeSelectedChapter && (
                <div className="border-t pt-3 space-y-2">
                  <h3 className="font-semibold text-sm">Chapter Info</h3>
                  <div className="text-xs space-y-1">
                    <div><span className="text-muted-foreground">Summary:</span> {safeSelectedChapter.summary}</div>
                    <div><span className="text-muted-foreground">Word Count:</span> {safeSelectedChapter.content.split(/\s+/).length} words</div>
                  </div>
                  {Object.keys(safeSelectedChapter.stateDelta.characterStates).length > 0 && (
                    <div className="space-y-1">
                      <h4 className="font-semibold text-xs">Character States</h4>
                      {Object.entries(safeSelectedChapter.stateDelta.characterStates).map(([char, state]) => (
                        <div key={char} className="bg-muted/50 rounded p-2 text-xs">
                          <div className="font-medium">{char}</div>
                          <div className="text-muted-foreground">{state}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
