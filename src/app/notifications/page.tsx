'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { formatTimeAgo } from '@/lib/utils';
import { Bell, CheckCheck, MessageSquare, CheckCircle2, Sparkles } from 'lucide-react';

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
        <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 rounded-3xl p-8 shadow-[4px_4px_0px_0px_#18181b]">
          <h2 className="text-xl font-black mb-2">Notifications</h2>
          <p className="text-xs font-medium text-zinc-500 mb-6">Log in to view your activity notifications.</p>
          <Link href="/login" className="inline-block bg-[#42ed91] text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider brutal-btn">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      <Sidebar />

      <div className="flex-1 min-w-0 space-y-6">
        <div className="bg-[#ffe5dd] dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-6 sm:p-7 shadow-[4px_4px_0px_0px_#18181b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#ffb800] border-2 border-zinc-900 text-zinc-900 mb-2 shadow-[2px_2px_0px_0px_#18181b]">
              <Bell className="h-3.5 w-3.5" />
              Activity Feed
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
              Activity Notifications
            </h1>
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-medium mt-1">
              Updates on replies, accepted solutions, and community points.
            </p>
          </div>

          {notifications.some((n) => !n.read) && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-wider bg-white border-2 border-zinc-900 px-4 py-2 rounded-xl brutal-btn"
            >
              <CheckCheck className="h-4 w-4 text-[#42ed91]" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        <div className="space-y-3.5">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-[#f4f0e6] dark:bg-zinc-800 border-2 border-zinc-900 animate-pulse" />
              ))}
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-5 rounded-2xl border-2 transition-all flex items-start gap-4 ${
                  n.read
                    ? 'border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[3px_3px_0px_0px_#18181b]'
                    : 'border-zinc-900 bg-[#fff4d1] dark:bg-zinc-800 shadow-[4px_4px_0px_0px_#42ed91]'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-white border-2 border-zinc-900 text-[#42ed91] shadow-[1.5px_1.5px_0px_0px_#18181b]">
                  {n.type === 'ACCEPTED_SOLUTION' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <MessageSquare className="h-5 w-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                    <span className="font-black text-sm text-zinc-900 dark:text-white">{n.title}</span>
                    <span className="font-bold">{formatTimeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-medium">{n.message}</p>
                  {n.linkUrl && (
                    <Link
                      href={n.linkUrl}
                      className="inline-block mt-2 text-xs font-black uppercase tracking-wider text-[#42ed91] hover:underline"
                    >
                      View discussion →
                    </Link>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white dark:bg-zinc-900 border-2 border-zinc-900 rounded-2xl p-8 shadow-[4px_4px_0px_0px_#18181b]">
              <p className="text-sm font-bold text-zinc-500">No notifications to display.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
