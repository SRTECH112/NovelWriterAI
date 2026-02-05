import { Project, ProjectWithDetails, ProjectStatus } from './database-types';
import { StoryBible, Outline, Chapter } from './types';

const STORAGE_KEY = 'novelist_projects';
const BIBLE_KEY = 'novelist_bibles';
const OUTLINE_KEY = 'novelist_outlines';
const CHAPTER_KEY = 'novelist_chapters';

export class ProjectStore {
  static getAllProjects(): Project[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static getProject(id: string): ProjectWithDetails | null {
    const projects = this.getAllProjects();
    const project = projects.find(p => p.id === id);
    if (!project) return null;

    return {
      ...project,
      storyBible: project.storyBibleId ? this.getStoryBible(project.storyBibleId) : undefined,
      outline: project.outlineId ? this.getOutline(project.outlineId) : undefined,
      chapters: this.getChapters(id),
    };
  }

  static createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'lastEditedAt' | 'currentChapter' | 'totalChapters' | 'progress' | 'exportedFormats'>): Project {
    const project: Project = {
      ...data,
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
      currentChapter: 0,
      totalChapters: 0,
      progress: 0,
      exportedFormats: [],
    };

    const projects = this.getAllProjects();
    projects.push(project);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return project;
  }

  static updateProject(id: string, updates: Partial<Project>): Project | null {
    const projects = this.getAllProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return null;

    projects[index] = {
      ...projects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return projects[index];
  }

  static deleteProject(id: string): boolean {
    const projects = this.getAllProjects();
    const filtered = projects.filter(p => p.id !== id);
    if (filtered.length === projects.length) return false;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    const project = projects.find(p => p.id === id);
    if (project?.storyBibleId) this.deleteStoryBible(project.storyBibleId);
    if (project?.outlineId) this.deleteOutline(project.outlineId);
    this.deleteAllChapters(id);
    
    return true;
  }

  static duplicateProject(id: string, newTitle: string): Project | null {
    const original = this.getProject(id);
    if (!original) return null;

    const newProject = this.createProject({
      title: newTitle,
      genre: original.genre,
      pov: original.pov,
      tone: original.tone,
      targetWordCount: original.targetWordCount,
      status: 'draft',
    });

    if (original.storyBible) {
      const newBible = this.saveStoryBible({ ...original.storyBible, id: `bible_${newProject.id}` });
      this.updateProject(newProject.id, { storyBibleId: newBible.id });
    }

    if (original.outline) {
      const newOutline = this.saveOutline({ ...original.outline, id: `outline_${newProject.id}`, storyBibleId: newProject.storyBibleId || '' });
      this.updateProject(newProject.id, { outlineId: newOutline.id });
    }

    original.chapters.forEach(chapter => {
      this.saveChapter(newProject.id, { ...chapter, id: `chapter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` });
    });

    return this.getProject(newProject.id);
  }

  static getStoryBible(id: string): StoryBible | undefined {
    if (typeof window === 'undefined') return undefined;
    const data = localStorage.getItem(`${BIBLE_KEY}_${id}`);
    return data ? JSON.parse(data) : undefined;
  }

  static saveStoryBible(bible: StoryBible): StoryBible {
    localStorage.setItem(`${BIBLE_KEY}_${bible.id}`, JSON.stringify(bible));
    return bible;
  }

  static deleteStoryBible(id: string): void {
    localStorage.removeItem(`${BIBLE_KEY}_${id}`);
  }

  static getOutline(id: string): Outline | undefined {
    if (typeof window === 'undefined') return undefined;
    const data = localStorage.getItem(`${OUTLINE_KEY}_${id}`);
    return data ? JSON.parse(data) : undefined;
  }

  static saveOutline(outline: Outline): Outline {
    localStorage.setItem(`${OUTLINE_KEY}_${outline.id}`, JSON.stringify(outline));
    return outline;
  }

  static deleteOutline(id: string): void {
    localStorage.removeItem(`${OUTLINE_KEY}_${id}`);
  }

  static getChapters(projectId: string): Chapter[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(`${CHAPTER_KEY}_${projectId}`);
    return data ? JSON.parse(data) : [];
  }

  static saveChapter(projectId: string, chapter: Chapter): Chapter {
    const chapters = this.getChapters(projectId);
    const index = chapters.findIndex(c => c.id === chapter.id);
    
    if (index >= 0) {
      chapters[index] = chapter;
    } else {
      chapters.push(chapter);
    }

    chapters.sort((a, b) => a.number - b.number);
    localStorage.setItem(`${CHAPTER_KEY}_${projectId}`, JSON.stringify(chapters));

    const project = this.getAllProjects().find(p => p.id === projectId);
    if (project) {
      this.updateProject(projectId, {
        totalChapters: chapters.length,
        currentChapter: Math.max(...chapters.map(c => c.number), 0),
        progress: project.outlineId ? Math.round((chapters.length / (this.getOutline(project.outlineId)?.chapters.length || 1)) * 100) : 0,
      });
    }

    return chapter;
  }

  static deleteChapter(projectId: string, chapterId: string): boolean {
    const chapters = this.getChapters(projectId);
    const filtered = chapters.filter(c => c.id !== chapterId);
    if (filtered.length === chapters.length) return false;

    localStorage.setItem(`${CHAPTER_KEY}_${projectId}`, JSON.stringify(filtered));
    return true;
  }

  static deleteAllChapters(projectId: string): void {
    localStorage.removeItem(`${CHAPTER_KEY}_${projectId}`);
  }

  static getProjectsByStatus(status: ProjectStatus): Project[] {
    return this.getAllProjects().filter(p => p.status === status);
  }

  static searchProjects(query: string): Project[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllProjects().filter(p => 
      p.title.toLowerCase().includes(lowerQuery) ||
      p.genre.toLowerCase().includes(lowerQuery)
    );
  }
}
