'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Download, FileText, BookOpen, FileCode } from 'lucide-react';
import { ProjectStore } from '@/lib/project-store';
import { ProjectWithDetails } from '@/lib/database-types';

export default function ExportPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectWithDetails | null>(null);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeCoverPage, setIncludeCoverPage] = useState(true);

  useEffect(() => {
    const proj = ProjectStore.getProject(projectId);
    if (!proj) {
      router.push('/dashboard');
      return;
    }
    setProject(proj);
  }, [projectId, router]);

  const handleExport = (format: 'pdf' | 'epub' | 'docx' | 'markdown') => {
    if (!project) return;

    let content = '';
    let filename = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;

    if (includeCoverPage) {
      content += `# ${project.title}\n\n`;
      if (includeMetadata) {
        content += `**Genre:** ${project.genre}\n`;
        content += `**POV:** ${project.pov}\n`;
        content += `**Tone:** ${project.tone}\n`;
        content += `**Chapters:** ${project.chapters.length}\n\n`;
      }
      content += `---\n\n`;
    }

    project.chapters.forEach(chapter => {
      content += `# Chapter ${chapter.chapterNumber}\n\n`;
      content += `${chapter.content}\n\n`;
      content += `---\n\n`;
    });

    if (format === 'markdown') {
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'docx') {
      const htmlContent = content
        .replace(/# (.*)/g, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/---/g, '<hr>');
      
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${project.title}</title>
        </head>
        <body>
          <p>${htmlContent}</p>
        </body>
        </html>
      `;
      
      const blob = new Blob([fullHtml], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert(`${format.toUpperCase()} export coming soon! For now, use Markdown or DOCX.`);
    }

    const formats = project.exportedFormats || [];
    if (!formats.includes(format)) {
      ProjectStore.updateProject(projectId, {
        exportedFormats: [...formats, format],
      });
    }
  };

  if (!project) {
    return null;
  }

  const totalWords = project.chapters.reduce((sum, ch) => sum + ch.content.split(/\s+/).length, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Export Novel</h1>
          <p className="text-muted-foreground">{project.title}</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Book Statistics</CardTitle>
              <CardDescription>Overview of your completed novel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold">{project.chapters.length}</div>
                  <div className="text-sm text-muted-foreground">Chapters</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalWords.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Words</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{project.genre}</div>
                  <div className="text-sm text-muted-foreground">Genre</div>
                </div>
                <div>
                  <div className="text-2xl font-bold capitalize">{project.status}</div>
                  <div className="text-sm text-muted-foreground">Status</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>Configure your export settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="metadata" 
                  checked={includeMetadata}
                  onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
                />
                <Label htmlFor="metadata">Include metadata (genre, POV, tone)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="cover" 
                  checked={includeCoverPage}
                  onCheckedChange={(checked) => setIncludeCoverPage(checked as boolean)}
                />
                <Label htmlFor="cover">Include cover page</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Formats</CardTitle>
              <CardDescription>Choose your preferred format</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => handleExport('markdown')}
                >
                  <FileCode className="h-8 w-8" />
                  <div>
                    <div className="font-semibold">Markdown</div>
                    <div className="text-xs text-muted-foreground">Plain text with formatting</div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => handleExport('docx')}
                >
                  <FileText className="h-8 w-8" />
                  <div>
                    <div className="font-semibold">DOCX</div>
                    <div className="text-xs text-muted-foreground">Microsoft Word format</div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => handleExport('pdf')}
                  disabled
                >
                  <FileText className="h-8 w-8" />
                  <div>
                    <div className="font-semibold">PDF</div>
                    <div className="text-xs text-muted-foreground">Coming soon</div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => handleExport('epub')}
                  disabled
                >
                  <BookOpen className="h-8 w-8" />
                  <div>
                    <div className="font-semibold">EPUB</div>
                    <div className="text-xs text-muted-foreground">Coming soon</div>
                  </div>
                </Button>
              </div>

              {project.exportedFormats && project.exportedFormats.length > 0 && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Previously exported as: {project.exportedFormats.join(', ').toUpperCase()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
