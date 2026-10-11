'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatTimeAgo } from '@/lib/utils';
import { Bell, CheckCheck, MessageSquare, CheckCircle2 } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
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
            query MyNotifications {
              notifications(limit: 30) {
                id
                type
                title
                message
                linkUrl
                read
                createdAt
              }
            }
          `,
        }),
      });

      const json = await res.json();
      if (json.data?.notifications) {
        setNotifications(json.data.notifications);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const handleMarkAllRead = async () => {
    if (!token) return;
    await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `
          mutation MarkAllRead {
            markAllNotificationsAsRead
          }
        `,
      }),
    });

    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  if (!authLoading && !user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <h2 className="text-xl font-bold mb-2">Notifications</h2>
        <p className="text-sm text-slate-500 mb-6">Log in to view your activity notifications.</p>
        <Link href="/login" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-600" />
            <span>Activity Notifications</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Updates on discussions, replies, accepted answers, and points earned.
          </p>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-lg transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                n.read
                  ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                  : 'border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 font-medium'
              }`}
            >
              <div className="mt-0.5 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600">
                {n.type === 'ACCEPTED_SOLUTION' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-900 dark:text-white">{n.title}</span>
                  <span>{formatTimeAgo(n.createdAt)}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{n.message}</p>
                {n.linkUrl && (
                  <Link
                    href={n.linkUrl}
                    className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    View discussion →
                  </Link>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
            <p className="text-sm text-slate-500">No notifications to display.</p>
          </div>
        )}
      </div>
    </div>
  );
}
