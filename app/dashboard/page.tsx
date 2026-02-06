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
    <div className="min-h-screen bg-background">
      <NavigationBar />
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Novelist AI</h1>
            <p className="text-muted-foreground">Your AI-powered novel writing studio</p>
          </div>
          <Button onClick={() => router.push('/new-book')} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            New Book
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="cursor-pointer hover:bg-accent" onClick={() => setFilter('all')}>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Projects</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent" onClick={() => setFilter('draft')}>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{stats.draft}</div>
              <div className="text-sm text-muted-foreground">Drafts</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent" onClick={() => setFilter('in-progress')}>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent" onClick={() => setFilter('completed')}>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent" onClick={() => setFilter('published')}>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{stats.published}</div>
              <div className="text-sm text-muted-foreground">Published</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4">
          <h2 className="text-2xl font-semibold">
            {filter === 'all' ? 'All Projects' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Projects`}
          </h2>
        </div>

        {filteredBooks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">Create your first novel project to get started</p>
              <Button onClick={() => router.push('/new-book')}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Book
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map(book => (
              <Card key={book.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1">{book.title}</CardTitle>
                      <CardDescription className="mt-1">{book.genre}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(book.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(book.status)}
                        <span className="capitalize">{book.status.replace('-', ' ')}</span>
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{book.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all" 
                        style={{ width: `${book.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Chapters</span>
                      <span className="font-medium">{book.current_chapter} / {book.total_chapters || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Last edited: {new Date(book.last_edited_at).toLocaleDateString()}</span>
                      {book.canon_locked && (
                        <Badge variant="outline" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Canon
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        className="flex-1" 
                        onClick={() => router.push(`/editor-v2/${book.id}`)}
                      >
                        Open
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleRename(book)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(book.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
