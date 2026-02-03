"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useUser } from "@/hooks/useUser";
import { useMyRegistrations } from "@/hooks/useRegistrations";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GAMES } from "@/lib/constants";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";

export default function MieiTorneiPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const { data: registrations, isLoading } = useMyRegistrations(user?.id);

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace("/login?redirect=/miei-tornei");
    }
  }, [user, userLoading, router]);

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Caricamento...</div>
      </div>
    );
  }

  const upcoming = (registrations ?? []).filter((r) => {
    const t = r.tournament as { start_date?: string; status?: string } | null;
    return t?.start_date && new Date(t.start_date) >= new Date() && !["completed", "cancelled"].includes(t.status ?? "");
  });
  const past = (registrations ?? []).filter((r) => {
    const t = r.tournament as { start_date?: string; status?: string } | null;
    return t && (!t.start_date || new Date(t.start_date) < new Date() || t.status === "completed");
  });

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-zentry text-3xl font-bold uppercase mb-8">I miei tornei</h1>

          {isLoading ? (
            <div className="animate-pulse text-muted">Caricamento...</div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div className="mb-8">
                  <h2 className="font-robert font-bold mb-4">Prossimi</h2>
                  <div className="space-y-4">
                    {upcoming.map((r) => {
                      const t = r.tournament as {
                        id?: string;
                        name?: string;
                        game?: string;
                        start_date?: string;
                        start_time?: string;
                        entry_fee?: number;
                        status?: string;
                        store?: { name?: string; slug?: string };
                      } | null;
                      const g = GAMES.find((x) => x.value === t?.game);
                      return (
                        <Card key={r.id} variant="interactive">
                          <CardContent className="py-4 flex justify-between items-start gap-4">
                            <Link href={`/tornei/${t?.id}`} className="flex-1 min-w-0">
                              <h3 className="font-robert font-bold">{t?.name}</h3>
                              <p className="text-sm text-muted">
                                {g?.label} • {(t?.store as { name?: string })?.name} • {formatDate(t?.start_date ?? "")} {formatTime(t?.start_time ?? "")}
                              </p>
                              <div className="flex gap-2 mt-2 flex-wrap">
                                <Badge>{r.status}</Badge>
                                <Badge variant={r.payment_status === "paid" ? "success" : "outline"}>
                                  {r.payment_status === "paid" ? "Pagato" : "Da pagare"}
                                </Badge>
                              </div>
                            </Link>
                            <Link href={`/tornei/${t?.id}/gruppo`} className="text-sm text-accent hover:underline shrink-0">
                              💬 Gruppo
                            </Link>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {past.length > 0 && (
                <div>
                  <h2 className="font-robert font-bold mb-4">Storico</h2>
                  <div className="space-y-4">
                    {past.map((r) => {
                      const t = r.tournament as {
                        id?: string;
                        name?: string;
                        game?: string;
                        start_date?: string;
                        store?: { name?: string };
                      } | null;
                      const g = GAMES.find((x) => x.value === t?.game);
                      return (
                        <Link key={r.id} href={`/tornei/${t?.id}`}>
                          <Card variant="interactive">
                            <CardContent className="py-4 flex justify-between items-center">
                              <div>
                                <h3 className="font-robert font-bold">{t?.name}</h3>
                                <p className="text-sm text-muted">
                                  {g?.label} • {t?.store?.name} • {formatDate(t?.start_date ?? "")}
                                </p>
                                {r.position && (
                                  <Badge variant="accent" className="mt-2">#{r.position}</Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {upcoming.length === 0 && past.length === 0 && (
                <Card>
                  <CardContent className="py-16 text-center">
                    <p className="text-muted mb-6">Non ti sei ancora iscritto a nessun torneo.</p>
                    <Link href="/tornei">
                      <span className="text-accent hover:underline">Cerca tornei</span>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
