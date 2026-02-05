'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Lock, LockOpen, BookOpen } from 'lucide-react';
import { StoryBible } from '@/lib/types';

interface StoryBibleViewerProps {
  bible: StoryBible;
  onLockToggle: (locked: boolean) => void;
}

export function StoryBibleViewer({ bible, onLockToggle }: StoryBibleViewerProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Story Bible</CardTitle>
              <CardDescription>Canonical source of truth for your novel</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {bible.locked ? (
              <Badge variant="default" className="gap-1">
                <Lock className="h-3 w-3" />
                Locked
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <LockOpen className="h-3 w-3" />
                Unlocked
              </Badge>
            )}
            <Button
              variant={bible.locked ? 'outline' : 'default'}
              size="sm"
              onClick={() => onLockToggle(!bible.locked)}
            >
              {bible.locked ? 'Unlock' : 'Lock & Approve'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="world">World</TabsTrigger>
            <TabsTrigger value="factions">Factions</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="constraints">Constraints</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Metadata</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {bible.metadata.genre && (
                  <div>
                    <span className="text-muted-foreground">Genre:</span> {bible.metadata.genre}
                  </div>
                )}
                {bible.metadata.tone && (
                  <div>
                    <span className="text-muted-foreground">Tone:</span> {bible.metadata.tone}
                  </div>
                )}
                {bible.metadata.targetLength && (
                  <div>
                    <span className="text-muted-foreground">Target Length:</span>{' '}
                    {bible.metadata.targetLength.toLocaleString()} words
                  </div>
                )}
                {bible.metadata.pov && (
                  <div>
                    <span className="text-muted-foreground">POV:</span> {bible.metadata.pov}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Themes & Tone</h3>
              <div className="flex flex-wrap gap-2">
                {bible.structured_sections.themesTone.map((theme, i) => (
                  <Badge key={i} variant="secondary">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="world" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                World Rules
                <Badge variant="outline">{bible.structured_sections.worldRules.length}</Badge>
              </h3>
              <ul className="space-y-2">
                {bible.structured_sections.worldRules.map((rule, i) => (
                  <li key={i} className="text-sm bg-muted/50 p-3 rounded-md">
                    <span className="font-medium text-primary">{i + 1}.</span> {rule}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Lore Timeline</h3>
              <div className="space-y-2">
                {bible.structured_sections.loreTimeline.map((event, i) => (
                  <div key={i} className="border-l-2 border-primary pl-4 py-2">
                    <div className="font-medium text-sm">{event.period}</div>
                    <div className="text-sm text-muted-foreground">{event.event}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="factions" className="space-y-3">
            {bible.structured_sections.factions.map((faction, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-lg">{faction.name}</h3>
                <p className="text-sm">{faction.description}</p>
                <div className="text-sm">
                  <span className="font-medium text-primary">Goals:</span> {faction.goals}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Technology / Magic Rules</h3>
              <ul className="space-y-2">
                {bible.structured_sections.technologyMagicRules.map((rule, i) => (
                  <li key={i} className="text-sm bg-muted/50 p-3 rounded-md">
                    <span className="font-medium text-primary">{i + 1}.</span> {rule}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="constraints" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 text-destructive flex items-center gap-2">
                ⚠️ Hard Constraints (MUST NOT VIOLATE)
              </h3>
              <ul className="space-y-2">
                {bible.structured_sections.hardConstraints.map((constraint, i) => (
                  <li key={i} className="text-sm bg-destructive/10 p-3 rounded-md border border-destructive/20">
                    <span className="font-medium text-destructive">{i + 1}.</span> {constraint}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Soft Guidelines</h3>
              <ul className="space-y-2">
                {bible.structured_sections.softGuidelines.map((guideline, i) => (
                  <li key={i} className="text-sm bg-muted/50 p-3 rounded-md">
                    <span className="font-medium text-primary">{i + 1}.</span> {guideline}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
