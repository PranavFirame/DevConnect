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
      <div className="max-w-md mx-auto py-16 text-center">
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-sm text-slate-500 mb-6">
          Moderator or Administrator credentials are required to view this dashboard.
        </p>
        <Link href="/" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-amber-500" />
          <span>Community Moderation Center</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review user-flagged content, maintain community safety, and resolve issues.
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : reports.length > 0 ? (
          reports.map((r) => (
            <div
              key={r.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  Reason: {r.reason}
                </span>
                <span className="text-xs text-slate-400">
                  Status: <strong>{r.status}</strong>
                </span>
              </div>

              {r.discussion && (
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span>Reported discussion: </span>
                  <Link
                    href={`/discussions/${r.discussion.slug}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    &ldquo;{r.discussion.title}&rdquo;
                  </Link>
                </div>
              )}

              {r.comment && (
                <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg">
                  <span className="text-slate-400 block mb-1">Reported comment snippet:</span>
                  &ldquo;{r.comment.content}&rdquo;
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-400">Reported by @{r.reporter.username}</span>

                {r.status === 'PENDING' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(r.id, 'RESOLVED')}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Resolve</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(r.id, 'DISMISSED')}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg font-medium transition-colors"
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
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
            <p className="text-sm text-slate-500">No active reports. Community is clean and healthy!</p>
          </div>
        )}
      </div>
    </div>
  );
}
