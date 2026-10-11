'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { PlusCircle, Tag as TagIcon, AlertCircle, ArrowLeft } from 'lucide-react';
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
      <div className="max-w-xl mx-auto py-16 text-center bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-8 brutal-card">
        <h2 className="text-2xl font-black mb-2 text-zinc-900 dark:text-white">Authentication Required</h2>
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-6">
          You must be logged in to participate and post discussions on DevConnect.
        </p>
        <Link
          href="/login"
          className="bg-[#42ed91] hover:bg-[#2dd87d] text-zinc-900 font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider brutal-btn inline-block"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-[#ffe5dd] dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_#18181b] flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/discussions"
            className="p-2.5 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border-2 border-zinc-900 dark:border-zinc-700 rounded-xl hover:bg-[#42ed91] hover:text-zinc-900 dark:hover:bg-[#42ed91] dark:hover:text-zinc-900 shadow-[2px_2px_0px_0px_#18181b] transition-all active:translate-x-0.5 active:translate-y-0.5"
            title="Back to Discussions"
          >
            <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
          </Link>
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#42ed91] border-2 border-zinc-900 text-zinc-900 mb-2 shadow-[2px_2px_0px_0px_#18181b]">
              <PlusCircle className="h-3.5 w-3.5" />
              New Discussion
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
              Create a New Discussion
            </h1>
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-medium mt-1">
              Share code, ask an architectural question, or exchange technical solutions.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#ffe5dd] border-2 border-rose-600 text-rose-700 text-xs font-bold shadow-[2px_2px_0px_0px_#e11d48]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Input */}
        <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-2xl p-6 brutal-card space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Discussion Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Best practices for caching GraphQL queries in Next.js Server Components"
            className="w-full text-base sm:text-lg font-bold bg-[#fbf9f5] dark:bg-zinc-800 text-zinc-900 dark:text-white border-2 border-zinc-900 dark:border-zinc-700 rounded-xl px-4 py-3 shadow-[2px_2px_0px_0px_#18181b] focus:outline-none"
          />
          <p className="text-[11px] font-medium text-zinc-500">
            Be specific and clear. Imagine you are asking a colleague a question. Minimum 5 characters.
          </p>
        </div>

        {/* Tags Selector */}
        <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-2xl p-6 brutal-card space-y-3">
          <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Tags (up to 5)
          </label>
          <div className="flex flex-wrap items-center gap-2.5">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-[#42ed91] border-2 border-zinc-900 text-zinc-900 shadow-[2px_2px_0px_0px_#18181b]"
              >
                <span>#{t}</span>
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="hover:text-rose-600 font-black text-sm ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
            {tags.length < 5 && (
              <div className="flex items-center gap-1.5 bg-[#fbf9f5] dark:bg-zinc-800 border-2 border-zinc-900 dark:border-zinc-700 rounded-xl px-3 py-1 shadow-[2px_2px_0px_0px_#18181b]">
                <TagIcon className="h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add tag and press Enter"
                  className="text-xs font-bold bg-transparent border-none py-1 text-zinc-900 dark:text-white focus:outline-none"
                />
              </div>
            )}
          </div>
          <p className="text-[11px] font-medium text-zinc-500">
            Add tags to help other developers discover and answer your discussion.
          </p>
        </div>

        {/* Markdown Content Editor */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Discussion Body & Code Snippets
          </label>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Describe your question or discussion in detail. Code blocks with ```language are highlighted automatically."
            minHeight="min-h-[300px]"
          />
        </div>

        {/* Action button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/discussions"
            className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            className="flex items-center gap-2 bg-[#42ed91] hover:bg-[#2dd87d] text-zinc-900 font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl brutal-btn disabled:opacity-50"
          >
            <PlusCircle className="h-4 w-4 stroke-[2.5]" />
            <span>{submitting ? 'Publishing...' : 'Publish Discussion'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
