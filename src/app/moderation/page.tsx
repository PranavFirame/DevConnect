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
      <div className="max-w-md mx-auto py-16 text-center dev-card p-8">
        <h2 className="text-xl font-bold text-[#17181D] mb-2">Access Denied</h2>
        <p className="text-sm text-[#697386] mb-6">
          Moderator or Administrator credentials are required to view this dashboard.
        </p>
        <Link href="/" className="btn-primary px-5 py-2.5 text-sm font-semibold inline-block">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-[#E5E7EB] pb-4">
        <h1 className="text-2xl font-extrabold text-[#17181D] flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-amber-500" />
          <span>Community Moderation Center</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#697386] mt-1">
          Review user-flagged content, maintain community safety, and resolve issues.
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : reports.length > 0 ? (
          reports.map((r) => (
            <div
              key={r.id}
              className="dev-card p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700">
                  Reason: {r.reason}
                </span>
                <span className="text-xs text-[#697386]">
                  Status: <strong className="text-[#17181D]">{r.status}</strong>
                </span>
              </div>

              {r.discussion && (
                <div className="text-xs text-[#17181D]">
                  <span className="text-[#697386]">Reported discussion: </span>
                  <Link
                    href={`/discussions/${r.discussion.slug}`}
                    className="font-bold text-[#F45170] hover:underline"
                  >
                    &ldquo;{r.discussion.title}&rdquo;
                  </Link>
                </div>
              )}

              {r.comment && (
                <div className="text-xs text-[#17181D] bg-[#F5F6F8] p-3 rounded-xl border border-[#E5E7EB]">
                  <span className="text-[#697386] block mb-1">Reported comment snippet:</span>
                  &ldquo;{r.comment.content}&rdquo;
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] text-xs">
                <span className="text-[#697386]">Reported by @{r.reporter.username}</span>

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
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-[#17181D] border border-slate-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
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
          <div className="dev-card text-center py-12 p-8 text-[#697386] text-sm">
            <p>No active reports. Community is clean and healthy!</p>
          </div>
        )}
      </div>
    </div>
  );
}
