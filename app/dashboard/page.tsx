'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, FileText, CheckCircle, Clock, Trash2, Copy, Edit, Download, Lock, Loader2 } from 'lucide-react';
import { NavigationBar } from '@/components/NavigationBar';

interface Book {
  id: number;
  title: string;
  genre: string;
  status: string;
  progress: number;
  current_chapter: number;
  total_chapters: number;
  last_edited_at: string;
  canon_locked: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'in-progress' | 'completed' | 'published'>('all');

  useEffect(() => {
    if (status === 'authenticated') {
      loadBooks();
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/books');
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books || []);
      }
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = filter === 'all' 
    ? books 
    : books.filter(b => b.status === filter);

  const stats = {
    total: books.length,
    draft: books.filter(b => b.status === 'draft').length,
    inProgress: books.filter(b => b.status === 'in-progress').length,
    completed: books.filter(b => b.status === 'completed').length,
    published: books.filter(b => b.status === 'published').length,
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this book? This cannot be undone.')) {
      try {
        const response = await fetch(`/api/books/${id}`, { method: 'DELETE' });
        if (response.ok) {
          loadBooks();
        }
      } catch (error) {
        console.error('Error deleting book:', error);
      }
    }
  };

  const handleRename = async (book: Book) => {
    const newTitle = prompt('Enter new title:', book.title);
    if (newTitle && newTitle !== book.title) {
      try {
        const response = await fetch(`/api/books/${book.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle }),
        });
        if (response.ok) {
          loadBooks();
        }
      } catch (error) {
        console.error('Error renaming book:', error);
      }
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'in-progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'published': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'in-progress': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'published': return <BookOpen className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen premium-page-bg text-white">
      <div className="glass-nav sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">NovelWriter AI</span>
            </div>
            <Button onClick={() => router.push('/new-book')} className="gradient-button text-white">
              <Plus className="h-5 w-5 mr-2" />
              New Book
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-12 mt-8 fade-in-up">
          <h1 className="text-5xl font-bold mb-3 gradient-text">Your Novels</h1>
          <p className="text-white/70 text-lg">Continue crafting your stories</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12 fade-in-up stagger-1">
          <div className="stat-card p-6" onClick={() => setFilter('all')}>
            <div className="text-3xl font-bold mb-1">{stats.total}</div>
            <div className="text-sm text-white/60">Total Projects</div>
          </div>
          <div className="stat-card p-6" onClick={() => setFilter('draft')}>
            <div className="text-3xl font-bold mb-1">{stats.draft}</div>
            <div className="text-sm text-white/60">Drafts</div>
          </div>
          <div className="stat-card p-6" onClick={() => setFilter('in-progress')}>
            <div className="text-3xl font-bold mb-1">{stats.inProgress}</div>
            <div className="text-sm text-white/60">In Progress</div>
          </div>
          <div className="stat-card p-6" onClick={() => setFilter('completed')}>
            <div className="text-3xl font-bold mb-1">{stats.completed}</div>
            <div className="text-sm text-white/60">Completed</div>
          </div>
          <div className="stat-card p-6" onClick={() => setFilter('published')}>
            <div className="text-3xl font-bold mb-1">{stats.published}</div>
            <div className="text-sm text-white/60">Published</div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white">
            {filter === 'all' ? 'All Projects' : `${filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', ' ')} Projects`}
          </h2>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="glass-card p-16 text-center fade-in-up">
            <BookOpen className="h-20 w-20 mx-auto mb-6 text-purple-300 opacity-50" />
            <h3 className="text-2xl font-semibold mb-3 text-white">No projects yet</h3>
            <p className="text-white/60 mb-6 text-lg">Create your first novel project to get started</p>
            <Button onClick={() => router.push('/new-book')} className="gradient-button text-white">
              <Plus className="h-5 w-5 mr-2" />
              Create New Book
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book, index) => (
              <div key={book.id} className={`book-card p-6 fade-in-up stagger-${Math.min(index % 3 + 1, 5)}`}>
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white line-clamp-1 mb-1">{book.title}</h3>
                      <p className="text-white/60 text-sm">{book.genre}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(book.status)} flex items-center gap-1`}>
                      {getStatusIcon(book.status)}
                      <span className="capitalize">{book.status.replace('-', ' ')}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Progress</span>
                      <span className="font-semibold text-white">{book.progress}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all" 
                        style={{ width: `${book.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Chapters</span>
                      <span className="font-semibold text-white">{book.current_chapter} / {book.total_chapters || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
                      <span className="text-white/50">Last edited: {new Date(book.last_edited_at).toLocaleDateString()}</span>
                      {book.canon_locked && (
                        <div className="flex items-center gap-1 text-purple-300">
                          <Lock className="h-3 w-3" />
                          <span>Canon</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-3">
                      <Button 
                        className="flex-1 gradient-button text-white" 
                        onClick={() => router.push(`/editor-v2/${book.id}`)}
                      >
                        Open
                      </Button>
                      <Button variant="outline" size="icon" className="glass-panel border-white/20 text-white hover:bg-white/10" onClick={() => handleRename(book)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="glass-panel border-white/20 text-white hover:bg-white/10" onClick={() => handleDelete(book.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
