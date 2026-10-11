import React from 'react';
import Link from 'next/link';
import { 
  Home, 
  MessageSquare, 
  Hash, 
  Bookmark, 
  TrendingUp, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface SidebarProps {
  popularTags?: Array<{ id: string; name: string; slug: string; postCount: number }>;
}

export function Sidebar({ popularTags = [] }: SidebarProps) {
  return (
    <aside className="w-[260px] shrink-0 hidden lg:block space-y-5">
      {/* Navigation Card */}
      <div className="dev-card p-3">
        <nav className="space-y-0.5">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-[#17181D] dark:text-[#F3F4F6] rounded-lg bg-[#F0F2F5] dark:bg-[#1E2129] text-[#F45170] transition-colors"
          >
            <Home className="h-4 w-4 text-[#F45170]" />
            <span>Home</span>
          </Link>
          <Link
            href="/discussions"
            className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-[#697386] dark:text-[#9CA3AF] hover:text-[#17181D] dark:hover:text-white hover:bg-[#F0F2F5] dark:hover:bg-[#1E2129] rounded-lg transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Discussions</span>
          </Link>
          <Link
            href="/tags"
            className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-[#697386] dark:text-[#9CA3AF] hover:text-[#17181D] dark:hover:text-white hover:bg-[#F0F2F5] dark:hover:bg-[#1E2129] rounded-lg transition-colors"
          >
            <Hash className="h-4 w-4" />
            <span>Explore Tags</span>
          </Link>
          <Link
            href="/bookmarks"
            className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-[#697386] dark:text-[#9CA3AF] hover:text-[#17181D] dark:hover:text-white hover:bg-[#F0F2F5] dark:hover:bg-[#1E2129] rounded-lg transition-colors"
          >
            <Bookmark className="h-4 w-4" />
            <span>Saved Posts</span>
          </Link>
        </nav>
      </div>

      {/* Popular Topics Widget */}
      <div className="dev-card p-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#17181D] dark:text-white uppercase tracking-wider">
            <TrendingUp className="h-3.5 w-3.5 text-[#F45170]" />
            <span>Popular Topics</span>
          </div>
          <Link href="/tags" className="text-[11px] font-medium text-[#697386] hover:text-[#F45170]">
            All
          </Link>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {popularTags.length > 0 ? (
            popularTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="badge-tag"
              >
                <span>#{tag.name}</span>
                {tag.postCount > 0 && (
                  <span className="text-[10px] text-[#9CA3AF]">
                    {tag.postCount}
                  </span>
                )}
              </Link>
            ))
          ) : (
            <>
              {['react', 'nextjs', 'typescript', 'graphql', 'postgresql', 'architecture'].map((t) => (
                <Link
                  key={t}
                  href={`/tags/${t}`}
                  className="badge-tag"
                >
                  #{t}
                </Link>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Community Card */}
      <div className="dev-card p-4 bg-gradient-to-br from-white to-[#FBF8F9] dark:from-[#16181E] dark:to-[#1A181D]">
        <div className="flex items-center gap-2 mb-2 text-[#17181D] dark:text-white">
          <div className="h-6 w-6 rounded-md bg-[#FFEAEF] dark:bg-[#2D1820] flex items-center justify-center text-[#F45170]">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <h4 className="font-bold text-xs uppercase tracking-wide">Community</h4>
        </div>
        <p className="text-xs text-[#697386] dark:text-[#9CA3AF] leading-relaxed mb-3">
          Build together. Share reproducible code. Learn from the community.
        </p>
        <Link
          href="/discussions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F45170] hover:text-[#E63D60] group"
        >
          <span>Explore Discussions</span>
          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </aside>
  );
}
