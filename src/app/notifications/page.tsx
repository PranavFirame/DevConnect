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
      <div className="max-w-md mx-auto py-16 text-center dev-card p-8">
        <h2 className="text-xl font-bold text-[#17181D] mb-2">Notifications</h2>
        <p className="text-sm text-[#697386] mb-6">Log in to view your activity notifications.</p>
        <Link href="/login" className="btn-primary px-5 py-2.5 text-sm font-semibold inline-block">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#17181D] flex items-center gap-2">
            <Bell className="h-6 w-6 text-[#F45170]" />
            <span>Activity Notifications</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#697386] mt-1">
            Updates on discussions, replies, accepted answers, and points earned.
          </p>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#F45170] hover:text-[#E63D60] bg-[#FFF0F3] border border-[#F45170]/20 px-3 py-1.5 rounded-lg transition-colors"
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
              <div key={i} className="h-16 rounded-xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                n.read
                  ? 'border-[#E5E7EB] bg-white text-[#697386]'
                  : 'border-[#F45170]/30 bg-[#FFF0F3]/30 font-medium'
              }`}
            >
              <div className="mt-0.5 p-2 rounded-lg bg-slate-100 text-[#17181D]">
                {n.type === 'ACCEPTED_SOLUTION' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <MessageSquare className="h-4 w-4 text-[#F45170]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs text-[#697386] mb-1">
                  <span className="font-bold text-[#17181D]">{n.title}</span>
                  <span>{formatTimeAgo(n.createdAt)}</span>
                </div>
                <p className="text-xs sm:text-sm text-[#17181D]">{n.message}</p>
                {n.linkUrl && (
                  <Link
                    href={n.linkUrl}
                    className="inline-block mt-2 text-xs font-semibold text-[#F45170] hover:underline"
                  >
                    View discussion →
                  </Link>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="dev-card text-center py-12 p-8 text-[#697386] text-sm">
            <p>No notifications to display.</p>
          </div>
        )}
      </div>
    </div>
  );
}
