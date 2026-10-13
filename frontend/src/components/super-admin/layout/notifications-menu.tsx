"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { markAllAsRead, markAsRead } from "@/features/notifications/actions";
import { cn } from "@/lib/utils";

export type HeaderNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function SuperAdminNotificationsMenu({
  initialNotifications,
  unreadCount,
}: {
  initialNotifications: HeaderNotification[];
  unreadCount: number;
}) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initialNotifications);
  const [unread, setUnread] = useState(unreadCount);
  const [syncedProps, setSyncedProps] = useState({ initialNotifications, unreadCount });
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  if (
    syncedProps.initialNotifications !== initialNotifications ||
    syncedProps.unreadCount !== unreadCount
  ) {
    setSyncedProps({ initialNotifications, unreadCount });
    setItems(initialNotifications);
    setUnread(unreadCount);
  }

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {unread > 0 ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await markAllAsRead();
                    setItems((prev) =>
                      prev.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })),
                    );
                    setUnread(0);
                  });
                }}
                className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              No notifications yet.
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (item.readAt) return;
                      startTransition(async () => {
                        await markAsRead(item.id);
                        setItems((prev) =>
                          prev.map((row) =>
                            row.id === item.id
                              ? { ...row, readAt: new Date().toISOString() }
                              : row,
                          ),
                        );
                        setUnread((value) => Math.max(0, value - 1));
                      });
                    }}
                    className={cn(
                      "flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-slate-50",
                      !item.readAt && "bg-blue-50/40",
                    )}
                  >
                    <span className="text-sm font-semibold text-slate-900">{item.title}</span>
                    <span className="line-clamp-2 text-xs text-slate-500">{item.body}</span>
                    <span className="text-[11px] text-slate-400">{relativeTime(item.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
