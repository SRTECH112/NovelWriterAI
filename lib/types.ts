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

export interface Volume {
  id: string;
  bookId: string;
  volumeNumber: number;
  title: string;
  theme?: string;
  emotionalPromise?: string;
  relationshipStateStart?: string;
  relationshipStateEnd?: string;
  majorTurningPoint?: string;
  targetChapterCount: number;
  status: 'draft' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Act {
  id: string;
  volumeId: string;
  actNumber: number;
  title?: string;
  narrativePurpose: 'setup' | 'rising-tension' | 'fracture' | 'crisis' | 'resolution' | 'payoff';
  pacing: 'slow' | 'medium' | 'fast';
  emotionalPressure: number;
  characterDevelopmentFocus?: string;
  targetChapterCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VolumeMemory {
  id: string;
  volumeId: string;
  unresolvedArcs: string[];
  characterProgression: Record<string, string>;
  relationshipEvolution?: string;
  thematicThreads: string[];
  promisesMade: string[];
  promisesFulfilled: string[];
  updatedAt: string;
}

export interface ActMemory {
  id: string;
  actId: string;
  currentTensionLevel: number;
  emotionalDirection?: string;
  activeConflicts: string[];
  proximityEvents: string[];
  misunderstandings: string[];
  updatedAt: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  volumeId: string;
  actId: string;
  chapterNumber: number;
  globalChapterNumber: number;
  title?: string;
  content: string;
  summary?: string;
  wordCount: number;
  emotionalBeat?: string;
  relationshipShift?: string;
  sceneGoal?: string;
  hookToNext?: string;
  stateDelta: StateDelta;
  canonWarnings: string[];
  proseQuality?: {
    score: number;
    issues: string[];
    warnings: string[];
  };
  createdAt: string;
  updatedAt: string;
  lastGeneratedAt: string;
  regenerationCount: number;
}

export interface StateDelta {
  characterStates: Record<string, string>;
  worldChanges: string[];
  plotProgression: string[];
  emotionalState?: string;
  unresolvedThreads?: string[];
}

export interface NarrativeMemory {
  global: {
    storyBible: StoryBible;
  };
  volume: VolumeMemory;
  act: ActMemory;
  local: {
    chapterSummaries: Map<number, string>;
    characterStates: Map<string, string>;
    worldState: string[];
  };
}

export interface GenerationRequest {
  type: 'story-bible' | 'volume' | 'act' | 'chapter';
  bookId?: string;
  storyBibleId?: string;
  volumeId?: string;
  actId?: string;
  chapterNumber?: number;
}

export interface CanonEnforcementResult {
  passed: boolean;
  violations: string[];
  warnings: string[];
}
