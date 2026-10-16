"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  relatedExceptionId: string | null;
  read: boolean;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationBell({
  initialNotifications,
  exceptionLinkBase,
}: {
  initialNotifications: NotificationItem[];
  exceptionLinkBase: string | null;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<NotificationItem | null>(null);

  useEffect(() => {
    const source = new EventSource("/api/notifications/stream");
    source.onmessage = (event) => {
      const notification: NotificationItem = JSON.parse(event.data);
      setNotifications((current) => {
        if (current.some((n) => n.id === notification.id)) return current;
        return [notification, ...current].slice(0, 5);
      });
      setToast(notification);
    };
    return () => source.close();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  async function markRead(id: string) {
    setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch {
      // Best-effort — local state already reflects "read".
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-foreground/70 transition hover:text-accent"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-severity-severe px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-10 z-20 w-80 rounded-lg border border-dark-slate/10 bg-app-surface p-2 shadow-lg">
            <p className="px-2 py-1 text-sm font-medium text-foreground">Notifications</p>
            {notifications.length === 0 ? (
              <p className="px-2 py-3 text-sm text-foreground/60">No notifications yet.</p>
            ) : (
              <ul className="flex max-h-96 flex-col gap-1 overflow-y-auto">
                {notifications.map((n) => {
                  const body = (
                    <div
                      className={`rounded-md px-2 py-2 text-sm transition ${
                        n.read ? "text-foreground/60" : "bg-accent/5 text-foreground"
                      } hover:bg-accent/10`}
                    >
                      <p>{n.message}</p>
                      <p className="mt-0.5 text-xs text-foreground/50">{timeAgo(n.createdAt)}</p>
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {exceptionLinkBase && n.relatedExceptionId ? (
                        <Link
                          href={`${exceptionLinkBase}/${n.relatedExceptionId}`}
                          onClick={() => {
                            if (!n.read) markRead(n.id);
                            setOpen(false);
                          }}
                        >
                          {body}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={() => !n.read && markRead(n.id)}
                        >
                          {body}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {toast &&
        createPortal(
          // Portaled straight to <body> — this needs to be fixed to the real
          // viewport regardless of any ancestor's CSS (e.g. a container-type
          // wrapper elsewhere in the shell changes the containing block for
          // ordinary `fixed` descendants; a portal sidesteps that entirely).
          <div className="fixed right-6 top-16 z-50 w-80 rounded-lg border border-accent/30 bg-app-surface p-3 text-sm text-foreground shadow-xl">
            <p className="font-medium text-accent">New notification</p>
            <p className="mt-1">{toast.message}</p>
          </div>,
          document.body,
        )}
    </div>
  );
}
