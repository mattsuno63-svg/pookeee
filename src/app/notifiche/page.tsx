"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useUser } from "@/hooks/useUser";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

const LIQUID_GLASS = "bg-white/5 backdrop-blur-xl border border-white/10";

export default function NotifichePage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const { data: notifications, isLoading } = useNotifications(user?.id);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead(user?.id);

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace("/login?redirect=/notifiche");
    }
  }, [user, userLoading, router]);

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Caricamento...</div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20 pb-20 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Hero titolo + azione */}
          <section className="relative overflow-hidden rounded-2xl p-6 border border-white/10 bg-gradient-to-br from-accent/10 via-transparent to-transparent">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <h1 className="font-zentry text-3xl font-bold uppercase tracking-tight">Notifiche</h1>
              {notifications && notifications.some((n) => !n.read) && (
                <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
                  Segna tutte come lette
                </Button>
              )}
            </div>
          </section>

          {isLoading ? (
            <div className="animate-pulse text-muted py-12">Caricamento...</div>
          ) : !notifications || notifications.length === 0 ? (
            <div className={`rounded-2xl ${LIQUID_GLASS} shadow-xl p-12 text-center text-muted`}>
              Nessuna notifica
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => {
                const tid = (n.data as { tournament_id?: string })?.tournament_id;
                const href = tid
                  ? n.type === "tournament_message"
                    ? `/tornei/${tid}/gruppo`
                    : `/tornei/${tid}`
                  : null;
                const content = (
                  <div
                    key={n.id}
                    className={`rounded-2xl ${LIQUID_GLASS} p-4 transition-colors ${
                      href ? "hover:bg-white/10 cursor-pointer" : ""
                    } ${!n.read ? "ring-1 ring-accent/30 bg-accent/5" : "opacity-90"}`}
                  >
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-robert font-bold text-foreground">{n.title}</h3>
                        {n.message && <p className="text-sm text-muted mt-1 line-clamp-2">{n.message}</p>}
                        <p className="text-xs text-muted mt-2">{formatDate(n.created_at)}</p>
                      </div>
                      {!n.read && !href && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markRead.mutate({ id: n.id, userId: user.id })}
                        >
                          Segna letta
                        </Button>
                      )}
                      {href && (
                        <span className="text-muted shrink-0 self-center" aria-hidden>
                          →
                        </span>
                      )}
                    </div>
                  </div>
                );
                if (href) {
                  return (
                    <Link
                      key={n.id}
                      href={href}
                      onClick={() => !n.read && markRead.mutate({ id: n.id, userId: user.id })}
                    >
                      {content}
                    </Link>
                  );
                }
                return content;
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
