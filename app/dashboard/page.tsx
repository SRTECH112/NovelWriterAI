'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, FileText, CheckCircle, Clock, Trash2, Copy, Edit, Download } from 'lucide-react';
import { ProjectStore } from '@/lib/project-store';
import { Project } from '@/lib/database-types';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<'all' | 'draft' | 'in-progress' | 'completed' | 'published'>('all');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    setProjects(ProjectStore.getAllProjects());
  };

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.status === filter);

  const stats = {
    total: projects.length,
    draft: projects.filter(p => p.status === 'draft').length,
    inProgress: projects.filter(p => p.status === 'in-progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    published: projects.filter(p => p.status === 'published').length,
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      ProjectStore.deleteProject(id);
      loadProjects();
    }
  };

  const handleDuplicate = (project: Project) => {
    const newTitle = prompt('Enter title for duplicated project:', `${project.title} (Copy)`);
    if (newTitle) {
      ProjectStore.duplicateProject(project.id, newTitle);
      loadProjects();
    }
  };

  const handleRename = (project: Project) => {
    const newTitle = prompt('Enter new title:', project.title);
    if (newTitle && newTitle !== project.title) {
      ProjectStore.updateProject(project.id, { title: newTitle });
      loadProjects();
    }
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'in-progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'published': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: Project['status']) => {
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

        {filteredProjects.length === 0 ? (
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
            {filteredProjects.map(project => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                      <CardDescription className="mt-1">{project.genre}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(project.status)}
                        <span className="capitalize">{project.status.replace('-', ' ')}</span>
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all" 
                        data-progress={project.progress}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Chapters</span>
                      <span className="font-medium">{project.currentChapter} / {project.totalChapters || '—'}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last edited: {new Date(project.lastEditedAt).toLocaleDateString()}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        className="flex-1" 
                        onClick={() => router.push(`/editor/${project.id}`)}
                      >
                        Open
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleRename(project)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDuplicate(project)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      {project.status === 'published' && (
                        <Button variant="outline" size="icon" onClick={() => router.push(`/export/${project.id}`)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="icon" onClick={() => handleDelete(project.id)}>
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
