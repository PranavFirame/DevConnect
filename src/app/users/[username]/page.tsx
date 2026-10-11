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
      <div className="dev-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="h-20 w-20 rounded-2xl border-2 border-slate-100 object-cover shadow-sm ring-2 ring-[#F45170]/20"
              />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-slate-100 border border-[#E5E7EB] flex items-center justify-center font-bold text-2xl text-[#17181D]">
                {profile.displayName.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-[#17181D]">
                  {profile.displayName}
                </h1>
                {profile.role !== 'USER' && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[#F45170] bg-[#FFF0F3] border border-[#F45170]/20 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {profile.role}
                  </span>
                )}
              </div>
              <p className="text-sm text-[#697386] font-mono">@{profile.username}</p>
              {profile.bio && (
                <p className="text-xs sm:text-sm text-[#17181D] mt-2 max-w-xl leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {isOwner && (
            <Link
              href="/settings"
              className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3.5"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </Link>
          )}
        </div>

        {/* Reputation and Meta Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#E5E7EB] text-center">
          <div className="p-3.5 rounded-xl bg-[#F5F6F8] border border-[#E5E7EB]">
            <span className="flex items-center justify-center gap-1 text-xs text-[#697386] mb-1 font-medium">
              <Award className="h-3.5 w-3.5 text-amber-500" />
              Reputation
            </span>
            <span className="text-lg font-extrabold text-[#17181D]">
              {profile.reputation}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F5F6F8] border border-[#E5E7EB]">
            <span className="flex items-center justify-center gap-1 text-xs text-[#697386] mb-1 font-medium">
              <MessageSquare className="h-3.5 w-3.5 text-[#F45170]" />
              Discussions
            </span>
            <span className="text-lg font-extrabold text-[#17181D]">
              {profile.discussionsCount}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F5F6F8] border border-[#E5E7EB]">
            <span className="flex items-center justify-center gap-1 text-xs text-[#697386] mb-1 font-medium">
              <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
              Replies
            </span>
            <span className="text-lg font-extrabold text-[#17181D]">
              {profile.commentsCount}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F5F6F8] border border-[#E5E7EB]">
            <span className="flex items-center justify-center gap-1 text-xs text-[#697386] mb-1 font-medium">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              Member Since
            </span>
            <span className="text-sm font-extrabold text-[#17181D]">
              {new Date(profile.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {profile.githubUrl && (
          <div className="mt-4 pt-4 border-t border-[#E5E7EB] flex items-center gap-2 text-xs">
            <GitBranch className="h-4 w-4 text-[#697386]" />
            <Link
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F45170] hover:underline font-mono"
            >
              {profile.githubUrl}
            </Link>
          </div>
        )}
      </div>

      {/* Authored Discussions */}
      <div className="space-y-3.5">
        <h2 className="text-base font-bold text-[#17181D]">
          Discussions by @{profile.username}
        </h2>
        {userDiscussions.length > 0 ? (
          userDiscussions.map((d) => <DiscussionCard key={d.id} {...d} />)
        ) : (
          <div className="dev-card text-center py-8 p-6 text-xs text-[#697386]">
            No public discussions posted yet.
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
