'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { BookOpen, Sparkles, Layers, Brain, Zap, ArrowRight, Check } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen premium-page-bg flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen premium-page-bg text-white overflow-y-auto overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative">
        <div className="container mx-auto px-6 pt-20 pb-32">
          <div className="max-w-5xl mx-auto text-center">
            <div className="hero-glow fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-8">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-white/90">AI-Powered Novel Writing Studio</span>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
                Write Your Novel
                <br />
                <span className="gradient-text">With AI Magic</span>
              </h1>
              
              <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">
                Transform your story ideas into full-length novels. Novelist AI helps you craft compelling narratives with intelligent chapter generation, story memory, and seamless continuity.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  className="gradient-button text-white px-8 py-6 text-lg h-auto"
                  onClick={() => router.push('/auth/signup')}
                >
                  Start Writing Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="glass-panel border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg h-auto"
                  onClick={() => router.push('/auth/signin')}
                >
                  Sign In
                </Button>
              </div>
            </div>

            {/* Mock Editor Preview */}
            <div className="mt-20 fade-in-up stagger-2">
              <div className="glass-card p-8 max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/50" />
                    <div className="w-3 h-3 rounded-full bg-green-400/50" />
                  </div>
                  <div className="text-sm text-white/50">Chapter 1: The Beginning</div>
                </div>
                <div className="space-y-3 text-left">
                  <div className="h-3 bg-white/10 rounded w-full" />
                  <div className="h-3 bg-white/10 rounded w-11/12" />
                  <div className="h-3 bg-white/10 rounded w-full" />
                  <div className="h-3 bg-white/10 rounded w-10/12" />
                  <div className="h-3 bg-white/10 rounded w-full" />
                  <div className="h-3 bg-white/10 rounded w-9/12" />
                </div>
                <div className="mt-6 flex items-center justify-center gap-2 text-purple-300">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">AI generating your next page...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything You Need to Write</h2>
          <p className="text-white/70 text-lg">Professional tools for serious novelists</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="feature-card fade-in-up stagger-1">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Volumes & Chapters</h3>
            <p className="text-white/70">
              Organize your epic into volumes, chapters, and pages. Perfect for series and long-form fiction.
            </p>
          </div>

          <div className="feature-card fade-in-up stagger-2">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Story Bible Memory</h3>
            <p className="text-white/70">
              AI remembers your world, characters, and rules. Consistent storytelling across thousands of pages.
            </p>
          </div>

          <div className="feature-card fade-in-up stagger-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Smart Generation</h3>
            <p className="text-white/70">
              Generate 600-1200 word pages with perfect continuity. Wattpad-style pacing that keeps readers hooked.
            </p>
          </div>

          <div className="feature-card fade-in-up stagger-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Chapter Outlines</h3>
            <p className="text-white/70">
              Define your story structure. AI follows your outline while adding creative flourishes.
            </p>
          </div>

          <div className="feature-card fade-in-up stagger-5">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Cloud Sync</h3>
            <p className="text-white/70">
              Write anywhere, anytime. Your projects are always saved and synced across devices.
            </p>
          </div>

          <div className="feature-card fade-in-up stagger-1">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Premium Quality</h3>
            <p className="text-white/70">
              Beautiful, distraction-free interface. This is a professional tool, not a demo.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-24">
        <div className="glass-card max-w-4xl mx-auto p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Write Your Masterpiece?</h2>
          <p className="text-white/70 text-lg mb-8">
            Join thousands of authors crafting their novels with AI assistance
          </p>
          <Button 
            size="lg" 
            className="gradient-button text-white px-12 py-6 text-lg h-auto"
            onClick={() => router.push('/auth/signup')}
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 py-8">
        <div className="container mx-auto px-6 text-center text-white/50 text-sm">
          <p>© 2024 Novelist AI. Craft your story with intelligence.</p>
        </div>
      </div>
    </div>
  );
}
