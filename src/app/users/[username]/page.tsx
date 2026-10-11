'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
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
    return <div className="h-64 rounded-3xl bg-[#f4f0e6] dark:bg-zinc-800 border-2 border-zinc-900 animate-pulse" />;
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 rounded-3xl p-8 max-w-md mx-auto shadow-[4px_4px_0px_0px_#18181b]">
          <h2 className="text-xl font-black mb-2 text-zinc-900 dark:text-zinc-100">User Not Found</h2>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-6">No developer exists with the username @{username}.</p>
          <Link href="/" className="inline-block bg-[#42ed91] text-zinc-900 font-black text-xs uppercase px-5 py-2.5 rounded-xl brutal-btn">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = currentUser?.username === profile.username;

  return (
    <div className="flex gap-8">
      <Sidebar />

      <div className="flex-1 min-w-0 space-y-6">
        {/* Profile Card Header with Light, High-Contrast Text */}
        <div className="bg-[#ffe5dd] dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_#18181b]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="h-20 w-20 rounded-2xl border-2 border-zinc-900 object-cover shadow-[3px_3px_0px_0px_#18181b] bg-white"
                />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-[#ffb800] border-2 border-zinc-900 flex items-center justify-center shadow-[3px_3px_0px_0px_#18181b]">
                  <User className="h-10 w-10 text-zinc-900" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                    {profile.displayName}
                  </h1>
                  {profile.role !== 'USER' && (
                    <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-zinc-900 bg-[#42ed91] px-2.5 py-0.5 rounded-full border border-zinc-900 shadow-[1px_1px_0px_0px_#18181b]">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {profile.role}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-mono font-bold mt-0.5">
                  @{profile.username}
                </p>

                {profile.bio && (
                  <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 mt-2.5 max-w-xl leading-relaxed font-medium">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {isOwner && (
              <Link
                href="/settings"
                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-800 border-2 border-zinc-900 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 hover:bg-[#42ed91] hover:text-zinc-900 brutal-btn transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Profile</span>
              </Link>
            )}
          </div>

          {/* Reputation and Meta Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t-2 border-zinc-900/20 dark:border-zinc-700/60 text-center">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_#18181b]">
              <span className="flex items-center justify-center gap-1 text-[11px] font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1">
                <Award className="h-4 w-4 text-[#ffb800]" />
                Reputation
              </span>
              <span className="text-xl font-black text-zinc-900 dark:text-white">
                {profile.reputation}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_#18181b]">
              <span className="flex items-center justify-center gap-1 text-[11px] font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1">
                <MessageSquare className="h-4 w-4 text-[#42ed91]" />
                Discussions
              </span>
              <span className="text-xl font-black text-zinc-900 dark:text-white">
                {profile.discussionsCount}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_#18181b]">
              <span className="flex items-center justify-center gap-1 text-[11px] font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1">
                <MessageSquare className="h-4 w-4 text-[#ffb800]" />
                Replies
              </span>
              <span className="text-xl font-black text-zinc-900 dark:text-white">
                {profile.commentsCount}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_#18181b]">
              <span className="flex items-center justify-center gap-1 text-[11px] font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1">
                <Calendar className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                Joined
              </span>
              <span className="text-xs font-black text-zinc-900 dark:text-white uppercase">
                {new Date(profile.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {profile.githubUrl && (
            <div className="mt-4 pt-4 border-t-2 border-zinc-900/20 dark:border-zinc-700/60 flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200">
              <GitBranch className="h-4 w-4 text-zinc-900 dark:text-zinc-300" />
              <Link
                href={profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-900 dark:text-[#42ed91] hover:underline font-mono"
              >
                {profile.githubUrl}
              </Link>
            </div>
          )}
        </div>

        {/* Authored Discussions */}
        <div className="space-y-4">
          <h2 className="text-lg font-black uppercase tracking-wider text-zinc-900 dark:text-white">
            Discussions by @{profile.username}
          </h2>
          {userDiscussions.length > 0 ? (
            userDiscussions.map((d) => <DiscussionCard key={d.id} {...d} />)
          ) : (
            <div className="text-center py-10 bg-white dark:bg-zinc-900 border-2 border-zinc-900 rounded-3xl p-6 shadow-[3px_3px_0px_0px_#18181b]">
              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">No public discussions posted yet.</p>
            </div>
          )}
        </div>
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
    <React.Suspense fallback={<div className="h-64 rounded-3xl bg-[#f4f0e6] animate-pulse border-2 border-zinc-900" />}>
      <UserProfileInner username={resolvedParams.username} />
    </React.Suspense>
  );
}
