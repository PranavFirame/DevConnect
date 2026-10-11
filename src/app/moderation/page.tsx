'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { ShieldAlert, CheckCircle, XCircle, Clock } from 'lucide-react';

interface ReportItem {
  id: string;
  reason: string;
  details?: string | null;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  reporter: {
    username: string;
  };
  discussion?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  comment?: {
    id: string;
    content: string;
  } | null;
}

export default function ModerationPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            query ModerationReports {
              reports {
                id
                reason
                details
                status
                createdAt
                reporter {
                  username
                }
                discussion {
                  id
                  title
                  slug
                }
                comment {
                  id
                  content
                }
              }
            }
          `,
        }),
      });

      const json = await res.json();
      if (json.data?.reports) {
        setReports(json.data.reports);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [token]);

  const handleUpdateStatus = async (id: string, status: 'RESOLVED' | 'DISMISSED') => {
    if (!token) return;

    await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `
          mutation UpdateReport($id: ID!, $status: ReportStatus!) {
            updateReportStatus(id: $id, status: $status) {
              id
              status
            }
          }
        `,
        variables: { id, status },
      }),
    });

    setReports(reports.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  if (!authLoading && (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR'))) {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-8 brutal-card">
        <h2 className="text-2xl font-black mb-2 text-zinc-900 dark:text-white">Access Denied</h2>
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-6">
          Moderator or Administrator credentials are required to view this dashboard.
        </p>
        <Link href="/" className="bg-[#42ed91] hover:bg-[#2dd87d] text-zinc-900 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider brutal-btn inline-block">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-[#ffe5dd] dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_#18181b]">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#ffb800] border-2 border-zinc-900 text-zinc-900 mb-2 shadow-[2px_2px_0px_0px_#18181b]">
          <ShieldAlert className="h-3.5 w-3.5" />
          Safety Center
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
          <span>Community Moderation Center</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-medium mt-1">
          Review user-flagged content, maintain community safety, and resolve issues.
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-[#f4f0e6] dark:bg-zinc-800 border-2 border-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : reports.length > 0 ? (
          reports.map((r) => (
            <div
              key={r.id}
              className="p-6 rounded-2xl border-2 border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 brutal-card space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black px-3 py-1 rounded-xl bg-[#ffb800] border-2 border-zinc-900 text-zinc-900 shadow-[2px_2px_0px_0px_#18181b]">
                  Reason: {r.reason}
                </span>
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  Status: <strong className="text-zinc-900 dark:text-white uppercase">{r.status}</strong>
                </span>
              </div>

              {r.discussion && (
                <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  <span>Reported discussion: </span>
                  <Link
                    href={`/discussions/${r.discussion.slug}`}
                    className="font-black text-zinc-900 dark:text-white hover:text-[#42ed91] underline"
                  >
                    &ldquo;{r.discussion.title}&rdquo;
                  </Link>
                </div>
              )}

              {r.comment && (
                <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-[#fbf9f5] dark:bg-zinc-800 p-3 rounded-xl border-2 border-zinc-900 dark:border-zinc-700">
                  <span className="text-zinc-400 font-bold block mb-1">Reported comment snippet:</span>
                  &ldquo;{r.comment.content}&rdquo;
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t-2 border-zinc-900 dark:border-zinc-800 text-xs">
                <span className="text-zinc-500 font-bold">Reported by @{r.reporter.username}</span>

                {r.status === 'PENDING' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(r.id, 'RESOLVED')}
                      className="flex items-center gap-1.5 bg-[#42ed91] hover:bg-[#2dd87d] text-zinc-900 px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider brutal-btn"
                    >
                      <CheckCircle className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Resolve</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(r.id, 'DISMISSED')}
                      className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 border-2 border-zinc-900 dark:border-zinc-700 text-zinc-900 dark:text-white px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#18181b] hover:bg-zinc-100"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Dismiss</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 border-2 border-zinc-900 rounded-2xl p-8 shadow-[4px_4px_0px_0px_#18181b]">
            <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">No active reports. Community is clean and healthy!</p>
          </div>
        )}
      </div>
    </div>
  );
}
