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
      <div className="max-w-xl mx-auto py-16 text-center">
        <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
        <p className="text-sm text-slate-500 mb-6">
          You must be logged in to participate and post discussions on DevConnect.
        </p>
        <Link
          href="/login"
          className="bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg text-sm"
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
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Create a New Discussion
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Share code, ask an architectural question, or discuss technical insights.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Input */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Discussion Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Best practices for caching GraphQL queries in Next.js Server Components"
            className="w-full text-base sm:text-lg font-medium bg-transparent border-b border-slate-200 dark:border-slate-700 py-2 focus:outline-none focus:border-blue-500"
          />
          <p className="text-[11px] text-slate-400">
            Be specific and imagine you are asking a colleague a question. Minimum 5 characters.
          </p>
        </div>

        {/* Tags Selector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Tags (up to 5)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40"
              >
                <span>#{t}</span>
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="hover:text-rose-600 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
            {tags.length < 5 && (
              <div className="flex items-center gap-1">
                <TagIcon className="h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add tag and press Enter"
                  className="text-xs bg-transparent border-none py-1 focus:outline-none"
                />
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Add tags to help other developers discover and answer your discussion.
          </p>
        </div>

        {/* Markdown Content Editor */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
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
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm shadow-sm transition-colors disabled:opacity-50"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{submitting ? 'Publishing...' : 'Publish Discussion'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
