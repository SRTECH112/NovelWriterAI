import { StoryBible, Outline, Chapter } from './types';

const STORAGE_KEYS = {
  STORY_BIBLES: 'novelist_story_bibles',
  OUTLINES: 'novelist_outlines',
  CHAPTERS: 'novelist_chapters',
  CURRENT_PROJECT: 'novelist_current_project',
};

export class LocalStorage {
  static getStoryBibles(): StoryBible[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.STORY_BIBLES);
    return data ? JSON.parse(data) : [];
  }

  static saveStoryBible(bible: StoryBible): void {
    const bibles = this.getStoryBibles();
    const index = bibles.findIndex(b => b.id === bible.id);
    if (index >= 0) {
      bibles[index] = bible;
    } else {
      bibles.push(bible);
    }
    localStorage.setItem(STORAGE_KEYS.STORY_BIBLES, JSON.stringify(bibles));
  }

  static getStoryBible(id: string): StoryBible | null {
    const bibles = this.getStoryBibles();
    return bibles.find(b => b.id === id) || null;
  }

  static getOutlines(): Outline[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.OUTLINES);
    return data ? JSON.parse(data) : [];
  }

  static saveOutline(outline: Outline): void {
    const outlines = this.getOutlines();
    const index = outlines.findIndex(o => o.id === outline.id);
    if (index >= 0) {
      outlines[index] = outline;
    } else {
      outlines.push(outline);
    }
    localStorage.setItem(STORAGE_KEYS.OUTLINES, JSON.stringify(outlines));
  }

  static getOutline(id: string): Outline | null {
    const outlines = this.getOutlines();
    return outlines.find(o => o.id === id) || null;
  }

  static getOutlinesByBibleId(bibleId: string): Outline[] {
    const outlines = this.getOutlines();
    return outlines.filter(o => o.storyBibleId === bibleId);
  }

  static getChapters(): Chapter[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.CHAPTERS);
    return data ? JSON.parse(data) : [];
  }

  static saveChapter(chapter: Chapter): void {
    const chapters = this.getChapters();
    const index = chapters.findIndex(c => c.id === chapter.id);
    if (index >= 0) {
      chapters[index] = chapter;
    } else {
      chapters.push(chapter);
    }
    localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(chapters));
  }

  static getChaptersByOutlineId(outlineId: string): Chapter[] {
    const chapters = this.getChapters();
    return chapters.filter(c => c.outlineId === outlineId).sort((a, b) => a.number - b.number);
  }

  static getCurrentProject(): { bibleId?: string; outlineId?: string } {
    if (typeof window === 'undefined') return {};
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT);
    return data ? JSON.parse(data) : {};
  }

  static setCurrentProject(bibleId?: string, outlineId?: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, JSON.stringify({ bibleId, outlineId }));
  }

  static deleteChapter(id: string): void {
    const chapters = this.getChapters();
    const filtered = chapters.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(filtered));
  }
}
