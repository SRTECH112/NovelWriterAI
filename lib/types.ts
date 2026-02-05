export interface StoryBible {
  id: string;
  raw_whitepaper: string;
  structured_sections: {
    worldRules: string[];
    loreTimeline: TimelineEvent[];
    factions: Faction[];
    technologyMagicRules: string[];
    themesTone: string[];
    hardConstraints: string[];
    softGuidelines: string[];
  };
  locked: boolean;
  metadata: {
    genre?: string;
    tone?: string;
    targetLength?: number;
    pov?: string;
  };
  createdAt: string;
}

export interface TimelineEvent {
  period: string;
  event: string;
}

export interface Faction {
  name: string;
  description: string;
  goals: string;
}

export interface Outline {
  id: string;
  storyBibleId: string;
  actStructure: 'three-act' | 'five-act';
  chapters: ChapterOutline[];
  keyMilestones: {
    midpoint?: number;
    climax?: number;
  };
  createdAt: string;
}

export interface ChapterOutline {
  number: number;
  title: string;
  summary: string;
  act: number;
  bibleCitations: string[];
  characterArcs: string[];
}

export interface Chapter {
  id: string;
  outlineId: string;
  number: number;
  content: string;
  summary: string;
  stateDelta: StateDelta;
  canonWarnings: string[];
  proseQuality?: {
    score: number;
    issues: string[];
    warnings: string[];
  };
  createdAt: string;
  regenerationCount: number;
}

export interface StateDelta {
  characterStates: Record<string, string>;
  worldChanges: string[];
  plotProgression: string[];
}

export interface NarrativeMemory {
  chapterSummaries: Map<number, string>;
  characterStates: Map<string, string>;
  worldState: string[];
}

export interface GenerationRequest {
  type: 'story-bible' | 'outline' | 'chapter';
  storyBibleId?: string;
  outlineId?: string;
  chapterNumber?: number;
}

export interface CanonEnforcementResult {
  passed: boolean;
  violations: string[];
  warnings: string[];
}
