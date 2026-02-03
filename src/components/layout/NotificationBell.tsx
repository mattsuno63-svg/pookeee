"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useNotifications, useUnreadCount, useMarkNotificationRead } from "@/hooks/useNotifications";
import { formatDate } from "@/lib/utils";
import type { Notification } from "@/types/database";

const LIQUID_GLASS = "bg-white/5 backdrop-blur-xl border border-white/10";

export function NotificationBell({ userId }: { userId: string | undefined }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: notifications } = useNotifications(userId);
  const { data: count } = useUnreadCount(userId);
  const markRead = useMarkNotificationRead();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<Notification | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());

  // Chiudi dropdown al cambio pagina
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Click outside per chiudere
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  // Realtime: nuova notifica -> popup
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as Notification;
          if (n && userId) {
            setToast(n);
            setTimeout(() => setToast(null), 5000);
            queryClientRef.current.invalidateQueries({ queryKey: ["notifications", userId] });
            queryClientRef.current.invalidateQueries({ queryKey: ["notifications-unread", userId] });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Polling fallback: rileva nuove notifiche confrontando IDs
  useEffect(() => {
    if (!notifications?.length) return;
    const ids = new Set(notifications.map((n) => n.id));
    const prev = knownIdsRef.current;
    const added = notifications.find((n) => !prev.has(n.id) && !n.read);
    if (added && prev.size > 0) {
      setToast(added);
      setTimeout(() => setToast(null), 5000);
    }
    knownIdsRef.current = ids;
  }, [notifications]);

  const handleNotifClick = useCallback(
    (n: Notification) => {
      if (!n.read && userId) markRead.mutate({ id: n.id, userId });
    },
    [userId, markRead]
  );

  if (!userId) return null;

  const recent = (notifications ?? []).slice(0, 5);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center p-2 rounded-full hover:bg-foreground/10 transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`Notifiche${(count ?? 0) > 0 ? ` (${count} non lette)` : ""}`}
      >
        <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {(count ?? 0) > 0 && (
          <span
            className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full ring-2 ring-background"
            title={`${count ?? 0} non lette`}
            aria-hidden
          />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />
          <div
            className={`absolute right-0 top-full mt-2 w-80 max-h-[70vh] overflow-hidden rounded-2xl ${LIQUID_GLASS} shadow-2xl z-50 flex flex-col`}
          >
            <div className="p-3 border-b border-white/10">
              <h3 className="font-robert font-bold text-sm">Notifiche</h3>
            </div>
            <div className="overflow-y-auto flex-1 max-h-64">
              {recent.length === 0 ? (
                <p className="p-4 text-sm text-muted">Nessuna notifica</p>
              ) : (
                recent.map((n) => {
                  const tid = (n.data as { tournament_id?: string })?.tournament_id;
                  const href = tid
                    ? n.type === "tournament_message"
                      ? `/tornei/${tid}/gruppo`
                      : `/tornei/${tid}`
                    : null;
                  const content = (
                    <div
                      key={n.id}
                      className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!n.read ? "bg-accent/5" : ""}`}
                      onClick={() => {
                        handleNotifClick(n);
                        if (href) {
                          setOpen(false);
                        }
                      }}
                    >
                      <h4 className="font-robert font-medium text-sm line-clamp-1">{n.title}</h4>
                      {n.message && <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.message}</p>}
                      <p className="text-xs text-muted mt-1">{formatDate(n.created_at)}</p>
                    </div>
                  );
                  if (href) {
                    return (
                      <Link
                        key={n.id}
                        href={href}
                        onClick={() => {
                          handleNotifClick(n);
                          setOpen(false);
                        }}
                      >
                        {content}
                      </Link>
                    );
                  }
                  return content;
                })
              )}
            </div>
            <Link
              href="/notifiche"
              onClick={() => setOpen(false)}
              className="block p-3 text-center text-sm font-medium text-accent hover:bg-white/5 transition-colors border-t border-white/10"
            >
              Vai a tutte le notifiche
            </Link>
          </div>
        </>
      )}

      {/* Toast popup nuova notifica */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-[100] w-80 max-w-[calc(100vw-2rem)] rounded-2xl ${LIQUID_GLASS} shadow-2xl p-4 animate-slide-in-right`}
          role="alert"
        >
          <p className="font-robert font-bold text-sm">{toast.title}</p>
          {toast.message && <p className="text-xs text-muted mt-1 line-clamp-2">{toast.message}</p>}
          <button
            type="button"
            onClick={() => setToast(null)}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 text-muted"
            aria-label="Chiudi"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
