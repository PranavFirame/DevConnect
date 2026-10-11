import React from 'react';
import Link from 'next/link';
import { 
  Home, 
  MessageSquare, 
  Hash, 
  Bookmark, 
  TrendingUp, 
  Sparkles,
  Zap,
  Flame,
  ArrowUpRight 
} from 'lucide-react';

interface SidebarProps {
  popularTags?: Array<{ id: string; name: string; slug: string; postCount: number }>;
}

export function Sidebar({ popularTags = [] }: SidebarProps) {
  return (
    <aside className="w-68 shrink-0 hidden lg:block space-y-5">
      {/* Navigation Links Card */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-2xl p-4 shadow-[3px_3px_0px_0px_#18181b]">
        <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block mb-3 px-2">
          Navigation
        </span>
        <nav className="space-y-1.5">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 rounded-xl hover:bg-[#fff4d1] dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="h-7 w-7 rounded-lg bg-[#ffb800] border border-zinc-900 flex items-center justify-center text-zinc-900">
              <Home className="h-3.5 w-3.5" />
            </div>
            <span>Home</span>
          </Link>
          <Link
            href="/discussions"
            className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 rounded-xl hover:bg-[#ffe5dd] dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="h-7 w-7 rounded-lg bg-[#42ed91] border border-zinc-900 flex items-center justify-center text-white">
              <MessageSquare className="h-3.5 w-3.5" />
            </div>
            <span>Discussions</span>
          </Link>
          <Link
            href="/tags"
            className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 rounded-xl hover:bg-[#fff4d1] dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="h-7 w-7 rounded-lg bg-[#38bdf8] border border-zinc-900 flex items-center justify-center text-zinc-900">
              <Hash className="h-3.5 w-3.5" />
            </div>
            <span>Explore Tags</span>
          </Link>
          <Link
            href="/bookmarks"
            className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 rounded-xl hover:bg-[#ffe5dd] dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="h-7 w-7 rounded-lg bg-[#a78bfa] border border-zinc-900 flex items-center justify-center text-white">
              <Bookmark className="h-3.5 w-3.5" />
            </div>
            <span>Saved Posts</span>
          </Link>
        </nav>
      </div>

      {/* Trending Topics Widget */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-2xl p-4 shadow-[3px_3px_0px_0px_#18181b]">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Flame className="h-4 w-4 text-[#42ed91]" />
          <h3 className="font-black text-sm uppercase tracking-wide text-zinc-900 dark:text-white">
            Hot Topics
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {popularTags.length > 0 ? (
            popularTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-[#fbf9f5] dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-600 hover:bg-[#ffb800] hover:text-zinc-900 transition-all shadow-[1.5px_1.5px_0px_0px_#18181b]"
              >
                <span>#{tag.name}</span>
                <span className="text-[10px] bg-zinc-900 text-white dark:bg-zinc-700 px-1.5 py-0.2 rounded-md font-black">
                  {tag.postCount}
                </span>
              </Link>
            ))
          ) : (
            <>
              {['react', 'nextjs', 'typescript', 'graphql', 'postgresql', 'architecture'].map((t) => (
                <Link
                  key={t}
                  href={`/tags/${t}`}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#fbf9f5] dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 hover:bg-[#ffb800] transition-colors"
                >
                  #{t}
                </Link>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Community Spotlight / FlowFest Vibe Banner */}
      <div className="bg-[#fff4d1] dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-2xl p-4 shadow-[3px_3px_0px_0px_#18181b] relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2 text-zinc-900 dark:text-amber-400">
          <Zap className="h-4 w-4 text-[#42ed91]" />
          <h4 className="font-black text-xs uppercase tracking-wider">Community First</h4>
        </div>
        <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed mb-3">
          Build together, share real reproducible code, and celebrate peer solutions.
        </p>
        <Link
          href="/discussions/new"
          className="inline-flex items-center gap-1.5 text-xs font-black text-zinc-900 bg-white border-2 border-zinc-900 px-3 py-1.5 rounded-lg brutal-btn"
        >
          <span>Share Knowledge</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  );
}
