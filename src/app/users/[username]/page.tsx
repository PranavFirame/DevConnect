'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { DiscussionCard, DiscussionCardProps } from '@/components/DiscussionCard';
import { 
  User, 
  Award, 
  GitBranch, 
  Calendar, 
  MessageSquare, 
  ShieldCheck, 
  Edit 
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  githubUrl?: string | null;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  reputation: number;
  createdAt: string;
  discussionsCount: number;
  commentsCount: number;
}

function UserProfileInner({ username }: { username: string }) {

  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userDiscussions, setUserDiscussions] = useState<DiscussionCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query UserProfileQuery($username: String!) {
                user(username: $username) {
                  id
                  email
                  username
                  displayName
                  bio
                  avatarUrl
                  githubUrl
                  role
                  reputation
                  createdAt
                  discussionsCount
                  commentsCount
                }
                discussions(author: $username, limit: 10) {
                  discussions {
                    id
                    title
                    slug
                    content
                    score
                    commentsCount
                    viewsCount
                    pinned
                    solved
                    createdAt
                    author {
                      username
                      displayName
                      avatarUrl
                    }
                    tags {
                      id
                      name
                      slug
                    }
                    userVote
                    isBookmarked
                  }
                }
              }
            `,
            variables: { username },
          }),
        });

        const json = await res.json();
        if (json.data?.user) setProfile(json.data.user);
        if (json.data?.discussions?.discussions) {
          setUserDiscussions(json.data.discussions.discussions);
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return <div className="h-64 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />;
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold mb-2">User Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">No developer exists with the username @{username}.</p>
        <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Return Home
        </Link>
      </div>
    );
  }

  const isOwner = currentUser?.username === profile.username;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Card Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="h-20 w-20 rounded-2xl border-2 border-slate-200 dark:border-slate-700 object-cover shadow-sm"
              />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <User className="h-8 w-8 text-slate-400" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {profile.displayName}
                </h1>
                {profile.role !== 'USER' && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {profile.role}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 font-mono">@{profile.username}</p>
              {profile.bio && (
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-2 max-w-xl leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {isOwner && (
            <Link
              href="/settings"
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </Link>
          )}
        </div>

        {/* Reputation and Meta Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <span className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-1">
              <Award className="h-3.5 w-3.5 text-amber-500" />
              Reputation
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {profile.reputation}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <span className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-1">
              <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
              Discussions
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {profile.discussionsCount}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <span className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-1">
              <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
              Replies
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {profile.commentsCount}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <span className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-1">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              Member Since
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {new Date(profile.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {profile.githubUrl && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs">
            <GitBranch className="h-4 w-4 text-slate-600" />
            <Link
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-mono"
            >
              {profile.githubUrl}
            </Link>
          </div>
        )}
      </div>

      {/* Authored Discussions */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Discussions by @{profile.username}
        </h2>
        {userDiscussions.length > 0 ? (
          userDiscussions.map((d) => <DiscussionCard key={d.id} {...d} />)
        ) : (
          <div className="text-center py-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <p className="text-xs text-slate-500">No public discussions posted yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ slug?: string; username: string }>;
}) {
  const resolvedParams = use(params);
  return (
    <React.Suspense fallback={<div className="h-64 rounded-xl bg-slate-200 animate-pulse" />}>
      <UserProfileInner username={resolvedParams.username} />
    </React.Suspense>
  );
}
