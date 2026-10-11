'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { ThreadedComments, CommentNode } from '@/components/ThreadedComments';
import { formatTimeAgo } from '@/lib/utils';
import { 
  ChevronUp, 
  ChevronDown, 
  Bookmark, 
  CheckCircle2, 
  Pin, 
  Share2, 
  Trash2, 
  Eye, 
  MessageSquare,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';

interface DiscussionDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  score: number;
  pinned: boolean;
  solved: boolean;
  commentsCount: number;
  viewsCount: number;
  createdAt: string;
  userVote?: 'UPVOTE' | 'DOWNVOTE' | null;
  isBookmarked: boolean;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    reputation: number;
  };
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

function DiscussionDetailInner({ slug }: { slug: string }) {

  const { user, token } = useAuth();
  const router = useRouter();

  const [discussion, setDiscussion] = useState<DiscussionDetail | null>(null);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchDiscussionAndComments = async () => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: `
            query DiscussionData($slug: String!) {
              discussion(slug: $slug) {
                id
                title
                slug
                content
                score
                pinned
                solved
                commentsCount
                viewsCount
                createdAt
                userVote
                isBookmarked
                author {
                  id
                  username
                  displayName
                  avatarUrl
                  reputation
                }
                tags {
                  id
                  name
                  slug
                }
              }
            }
          `,
          variables: { slug },
        }),
      });

      const json = await res.json();
      if (json.data?.discussion) {
        setDiscussion(json.data.discussion);

        // Fetch comments for this discussion
        const commentsRes = await fetch('/api/graphql', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query: `
              query CommentsData($discussionId: ID!) {
                comments(discussionId: $discussionId) {
                  id
                  content
                  score
                  depth
                  isAccepted
                  createdAt
                  userVote
                  author {
                    id
                    username
                    displayName
                    avatarUrl
                  }
                  replies {
                    id
                    content
                    score
                    depth
                    isAccepted
                    createdAt
                    userVote
                    author {
                      id
                      username
                      displayName
                      avatarUrl
                    }
                    replies {
                      id
                      content
                      score
                      depth
                      isAccepted
                      createdAt
                      userVote
                      author {
                        id
                        username
                        displayName
                        avatarUrl
                      }
                      replies {
                        id
                      }
                    }
                  }
                }
              }
            `,
            variables: { discussionId: json.data.discussion.id },
          }),
        });

        const commentsJson = await commentsRes.json();
        if (commentsJson.data?.comments) {
          setComments(commentsJson.data.comments);
        }
      }
    } catch (err) {
      console.error('Failed to load discussion:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussionAndComments();
  }, [slug, token]);

  const handleVoteDiscussion = async (type: 'UPVOTE' | 'DOWNVOTE') => {
    if (!discussion || !token) {
      alert('Please log in to vote.');
      return;
    }

    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            mutation VoteDiscussion($id: ID!, $type: VoteType!) {
              voteDiscussion(discussionId: $id, type: $type) {
                score
                userVote
              }
            }
          `,
          variables: { id: discussion.id, type },
        }),
      });

      const json = await res.json();
      if (json.data?.voteDiscussion) {
        setDiscussion({
          ...discussion,
          score: json.data.voteDiscussion.score,
          userVote: json.data.voteDiscussion.userVote,
        });
      }
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  const handleToggleBookmark = async () => {
    if (!discussion || !token) {
      alert('Please log in to save bookmarks.');
      return;
    }

    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            mutation ToggleBookmark($id: ID!) {
              toggleBookmark(discussionId: $id) {
                isBookmarked
              }
            }
          `,
          variables: { id: discussion.id },
        }),
      });

      const json = await res.json();
      if (json.data?.toggleBookmark) {
        setDiscussion({
          ...discussion,
          isBookmarked: json.data.toggleBookmark.isBookmarked,
        });
      }
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    }
  };

  const handleCreateRootComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discussion || !token || !newComment.trim() || submittingReply) return;

    setSubmittingReply(true);
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            mutation CreateComment($discussionId: ID!, $content: String!) {
              createComment(discussionId: $discussionId, content: $content) {
                id
              }
            }
          `,
          variables: { discussionId: discussion.id, content: newComment.trim() },
        }),
      });

      const json = await res.json();
      if (json.data?.createComment) {
        setNewComment('');
        fetchDiscussionAndComments();
      }
    } catch (err) {
      console.error('Submit comment error:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleNestedReply = async (parentId: string, content: string) => {
    if (!discussion || !token) return;

    const res = await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `
          mutation CreateComment($discussionId: ID!, $content: String!, $parentId: ID) {
            createComment(discussionId: $discussionId, content: $content, parentId: $parentId) {
              id
            }
          }
        `,
        variables: { discussionId: discussion.id, content, parentId },
      }),
    });

    const json = await res.json();
    if (json.data?.createComment) {
      fetchDiscussionAndComments();
    }
  };

  const handleAcceptSolution = async (commentId: string) => {
    if (!discussion || !token) return;

    const res = await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `
          mutation AcceptSolution($discussionId: ID!, $commentId: ID!) {
            acceptSolution(discussionId: $discussionId, commentId: $commentId) {
              id
              solved
            }
          }
        `,
        variables: { discussionId: discussion.id, commentId },
      }),
    });

    const json = await res.json();
    if (json.data?.acceptSolution) {
      fetchDiscussionAndComments();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!token) return;

    await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `
          mutation DeleteComment($id: ID!) {
            deleteComment(id: $id)
          }
        `,
        variables: { id: commentId },
      }),
    });

    fetchDiscussionAndComments();
  };

  const handleDeleteDiscussion = async () => {
    if (!discussion || !token || !confirm('Permanently delete this discussion?')) return;

    await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `
          mutation DeletePost($id: ID!) {
            deleteDiscussion(id: $id)
          }
        `,
        variables: { id: discussion.id },
      }),
    });

    router.push('/discussions');
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <div className="h-64 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />;
  }

  if (!discussion) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold mb-2">Discussion Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">
          The requested discussion does not exist or has been removed.
        </p>
        <Link
          href="/discussions"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Back to Discussions
        </Link>
      </div>
    );
  }

  // Safe client-side markdown to html generator
  const renderFormattedContent = (raw: string) => {
    let safe = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    safe = safe.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, (_, __, code) => {
      return `<pre class="my-4 p-4 bg-slate-900 text-slate-100 rounded-xl text-xs sm:text-sm overflow-x-auto border border-slate-800"><code>${code.trim()}</code></pre>`;
    });

    safe = safe.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-mono text-xs">$1</code>');
    safe = safe.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold my-3 text-slate-900 dark:text-white">$1</h3>');
    safe = safe.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold my-4 text-slate-900 dark:text-white">$1</h2>');
    safe = safe.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold my-4 text-slate-900 dark:text-white">$1</h1>');
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');
    safe = safe.replace(/\[(.*?)\]\((https?:\/\/.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-medium">$1</a>');
    safe = safe.replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc text-sm my-1">$1</li>');
    safe = safe.replace(/\n\n/g, '<br/><br/>');

    return safe;
  };

  const isAuthor = user?.id === discussion.author.id;
  const canModerate = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        href="/discussions"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Discussions</span>
      </Link>

      {/* Discussion Card Detail */}
      <div className="dev-card p-6 sm:p-8">
        {/* Header Tags & Status Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-1.5">
            {discussion.tags.map((t) => (
              <Link
                key={t.id}
                href={`/tags/${t.slug}`}
                className="badge-tag"
              >
                #{t.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {discussion.pinned && (
              <span className="badge-pinned">
                <Pin className="h-3.5 w-3.5" />
                Pinned
              </span>
            )}
            {discussion.solved && (
              <span className="badge-solved">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Solved
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17181D] tracking-tight mb-4 leading-snug">
          {discussion.title}
        </h1>

        {/* Author info strip */}
        <div className="flex items-center justify-between border-y border-[#E5E7EB] py-3.5 mb-6">
          <div className="flex items-center gap-3">
            <Link href={`/users/${discussion.author.username}`}>
              {discussion.author.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={discussion.author.avatarUrl}
                  alt={discussion.author.displayName}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm">
                  {discussion.author.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </Link>
            <div>
              <Link
                href={`/users/${discussion.author.username}`}
                className="font-bold text-sm text-[#17181D] hover:text-[#F45170] transition-colors"
              >
                {discussion.author.displayName}
              </Link>
              <div className="flex items-center gap-2 text-xs text-[#697386]">
                <span>@{discussion.author.username}</span>
                <span>•</span>
                <span>{formatTimeAgo(discussion.createdAt)}</span>
                <span>•</span>
                <span className="text-[#F45170] font-semibold">{discussion.author.reputation} rep</span>
              </div>
            </div>
          </div>

          {/* Controls: Delete (if author or admin) */}
          {(isAuthor || canModerate) && (
            <button
              onClick={handleDeleteDiscussion}
              className="text-slate-400 hover:text-rose-600 p-2 rounded-lg transition-colors hover:bg-rose-50"
              title="Delete Discussion"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Discussion Content */}
        <div
          className="text-[#17181D] text-sm sm:text-base leading-relaxed mb-8 prose max-w-none"
          dangerouslySetInnerHTML={{ __html: renderFormattedContent(discussion.content) }}
        />

        {/* Actions bar */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center bg-slate-100/90 rounded-lg p-1 border border-slate-200">
              <button
                onClick={() => handleVoteDiscussion('UPVOTE')}
                className={`p-1.5 rounded transition-colors ${
                  discussion.userVote === 'UPVOTE'
                    ? 'text-[#F45170] bg-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-[#F45170]'
                }`}
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <span className="font-bold text-xs px-2 text-[#17181D]">
                {discussion.score}
              </span>
              <button
                onClick={() => handleVoteDiscussion('DOWNVOTE')}
                className={`p-1.5 rounded transition-colors ${
                  discussion.userVote === 'DOWNVOTE'
                    ? 'text-rose-600 bg-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-rose-600'
                }`}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleToggleBookmark}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                discussion.isBookmarked
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`h-3.5 w-3.5 ${discussion.isBookmarked ? 'fill-current' : ''}`} />
              <span>{discussion.isBookmarked ? 'Saved' : 'Save'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#697386]">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              <span>{discussion.viewsCount} views</span>
            </span>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 hover:text-[#F45170] transition-colors p-1.5 rounded-lg"
              title="Copy link to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
              <span className="font-medium">{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Discussion Replies / Threaded Conversations section */}
      <section id="replies" className="space-y-6 pt-2">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <h2 className="text-base font-bold text-[#17181D] flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#F45170]" />
            <span>Replies ({comments.length})</span>
          </h2>
        </div>

        {/* Reply Submission Box */}
        {user ? (
          <form
            onSubmit={handleCreateRootComment}
            className="dev-card p-5 space-y-3"
          >
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Join the discussion. Share your answer, solution, or insight..."
              rows={3}
              className="w-full text-sm p-3 rounded-xl border border-[#E5E7EB] bg-[#F5F6F8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F45170]/30 focus:border-[#F45170] transition-all"
            />
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={submittingReply || !newComment.trim()}
                className="btn-primary py-2 px-4 text-xs font-semibold disabled:opacity-50"
              >
                {submittingReply ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 rounded-2xl border border-dashed border-slate-300 bg-white text-center">
            <p className="text-xs text-[#697386] mb-3">
              Log in to join the conversation and post a reply.
            </p>
            <Link
              href="/login"
              className="btn-primary py-1.5 px-4 text-xs inline-block"
            >
              Sign In to Reply
            </Link>
          </div>
        )}

        {/* Threaded comments tree */}
        {comments.length > 0 ? (
          <ThreadedComments
            comments={comments}
            discussionId={discussion.id}
            discussionAuthorId={discussion.author.id}
            onReplySubmit={handleNestedReply}
            onAcceptSolution={handleAcceptSolution}
            onDeleteComment={handleDeleteComment}
          />
        ) : (
          <div className="dev-card p-8 text-center text-xs text-[#697386]">
            No replies yet. Be the first to share an answer!
          </div>
        )}
      </section>
    </div>
  );
}

export default function DiscussionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  return (
    <React.Suspense fallback={<div className="h-64 rounded-xl bg-slate-200 animate-pulse" />}>
      <DiscussionDetailInner slug={resolvedParams.slug} />
    </React.Suspense>
  );
}
