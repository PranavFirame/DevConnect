'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { Plus, Tag as TagIcon, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewDiscussionPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['react', 'typescript']);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (clean && !tags.includes(clean) && tags.length < 5) {
        setTags([...tags, clean]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Please log in to publish a discussion.');
      return;
    }
    if (tags.length === 0) {
      setError('Please add at least one tag (e.g. #react, #docker).');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            mutation CreatePost($title: String!, $content: String!, $tags: [String!]!) {
              createDiscussion(title: $title, content: $content, tags: $tags) {
                slug
              }
            }
          `,
          variables: { title, content, tags },
        }),
      });

      const json = await res.json();
      if (json.errors && json.errors.length > 0) {
        throw new Error(json.errors[0].message);
      }

      if (json.data?.createDiscussion?.slug) {
        router.push(`/discussions/${json.data.createDiscussion.slug}`);
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to publish discussion');
    } finally {
      setSubmitting(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center dev-card p-8">
        <h2 className="text-lg font-bold mb-2">Sign in to contribute</h2>
        <p className="text-xs text-[#697386] dark:text-[#9CA3AF] mb-6">
          You must be logged in to post discussions and share code on DevConnect.
        </p>
        <Link
          href="/login"
          className="btn-primary py-2 px-5 text-xs font-semibold"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/discussions"
          className="p-2 text-[#697386] hover:text-[#17181D] dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-[#16181E] border border-transparent hover:border-[#E5E7EB] dark:hover:border-[#282C37] transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#17181D] dark:text-white tracking-tight">
            New Discussion
          </h1>
          <p className="text-xs text-[#697386] dark:text-[#9CA3AF] mt-0.5">
            Share code, ask an architectural question, or exchange technical insights.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title Input */}
        <div className="dev-card p-5 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#697386] dark:text-[#9CA3AF]">
            Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Best practices for caching GraphQL queries in Next.js Server Components"
            className="w-full text-base sm:text-lg font-semibold bg-transparent border-b border-[#E5E7EB] dark:border-[#282C37] py-2 focus:outline-none focus:border-[#F45170] text-[#17181D] dark:text-white placeholder:text-[#9CA3AF]"
          />
          <p className="text-[11px] text-[#9CA3AF]">
            Be concise and descriptive. Minimum 5 characters.
          </p>
        </div>

        {/* Tags Selector */}
        <div className="dev-card p-5 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#697386] dark:text-[#9CA3AF]">
            Tags (up to 5)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#FFEAEF] dark:bg-[#2D1820] text-[#F45170] border border-[#FFCCD5] dark:border-[#4A1E29]"
              >
                <span>#{t}</span>
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="hover:text-[#E63D60] font-bold"
                >
                  ×
                </button>
              </span>
            ))}
            {tags.length < 5 && (
              <div className="flex items-center gap-1.5 bg-[#F0F2F5] dark:bg-[#1E2129] px-3 py-1 rounded-lg">
                <TagIcon className="h-3 w-3 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add tag and press Enter"
                  className="text-xs bg-transparent border-none py-0.5 focus:outline-none text-[#17181D] dark:text-white placeholder:text-[#9CA3AF]"
                />
              </div>
            )}
          </div>
          <p className="text-[11px] text-[#9CA3AF]">
            Add tags to help other engineers discover and categorize your post.
          </p>
        </div>

        {/* Markdown Editor */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#697386] dark:text-[#9CA3AF]">
            Content & Code Snippets
          </label>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Describe your question or discussion in detail. Code blocks with ```language are highlighted automatically."
            minHeight="min-h-[280px]"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/discussions"
            className="btn-secondary py-2 px-4 text-xs font-semibold"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            className="btn-primary py-2 px-5 text-xs font-semibold disabled:opacity-50"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>{submitting ? 'Publishing...' : 'Publish Discussion'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
