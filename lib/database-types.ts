export type ProjectStatus = 'draft' | 'in-progress' | 'completed' | 'published';

export interface Project {
  id: string;
  title: string;
  genre: string;
  pov: string;
  tone: string;
  targetWordCount: number;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  lastEditedAt: string;
  storyBibleId?: string;
  outlineId?: string;
  currentChapter: number;
  totalChapters: number;
  progress: number; // percentage
  exportedFormats: string[];
}

export interface ProjectWithDetails extends Project {
  storyBible?: import('./types').StoryBible;
  outline?: import('./types').Outline;
  chapters: import('./types').Chapter[];
}

export interface ExportOptions {
  format: 'pdf' | 'epub' | 'docx' | 'markdown';
  includeMetadata: boolean;
  includeCoverPage: boolean;
}

export interface DashboardStats {
  totalProjects: number;
  draftProjects: number;
  inProgressProjects: number;
  completedProjects: number;
  publishedProjects: number;
  totalChapters: number;
  totalWords: number;
}
