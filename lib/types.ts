export interface StoryBible {
  id: string;
  raw_whitepaper: string;
  characters?: string;
  settings?: string;
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
  outline?: string; // User-defined volume and chapter-by-chapter outline (binding for generation)
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
  volumeId: string; // Required: chapters are direct children of volumes
  chapterNumber: number;
  chapterOrder: number; // Order within volume (for sorting)
  globalChapterNumber?: number;
  title?: string;
  content: string; // Deprecated: use pages instead
  summary?: string;
  wordCount: number; // Calculated from pages
  targetWordCount: number; // Target: 2,500-3,000 words
  targetPageCount: number; // Target: 3-5 pages
  currentPageCount: number; // Actual pages generated
  outline?: string; // Chapter-level outline (broken into page beats)
  actTag?: string; // Optional: act as metadata/tag, not hierarchical parent
  emotionalBeat?: string;
  relationshipShift?: string;
  sceneGoal?: string;
  characterStates?: Record<string, any>;
  worldChanges?: any[];
  plotProgression?: any[];
  emotionalState?: string;
  unresolvedThreads?: string[];
  canonWarnings?: string[];
  proseQualityScore?: number;
  proseQualityIssues?: string[];
  proseQualityWarnings?: string[];
  regenerationCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: string;
  chapterId: string;
  pageNumber: number;
  content: string;
  wordCount: number;
  beatCoverage?: string; // Which micro-beats this page covers
  narrativeMomentum?: string; // How this page ends (must have forward momentum)
  locked: boolean; // Lock previous pages to prevent regeneration
  createdAt: string;
  updatedAt: string;
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
