"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { Profile } from "@/types/database";
import type { Registration } from "@/types/database";
import { Card, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { GAMES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

type RegWithTournament = Registration & {
  position: number | null;
  tournament: {
    id: string;
    name: string;
    game: string;
    start_date: string;
    start_time: string;
    status: string;
    store: { name: string; slug: string } | null;
  } | null;
};

export default function ProfiloPubblicoPage() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile-public", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!id,
  });

  const { data: registrations } = useQuery({
    queryKey: ["profile-registrations", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registrations")
        .select(`
          id,
          tournament_id,
          player_id,
          status,
          position,
          points,
          created_at,
          tournament:tournaments(
            id,
            name,
            game,
            start_date,
            start_time,
            status,
            store:stores(name, slug)
          )
        `)
        .eq("player_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RegWithTournament[];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-16 flex items-center justify-center">
          <div className="animate-pulse text-muted">Caricamento...</div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-16 flex flex-col items-center justify-center gap-4">
          <p className="text-muted">Profilo non trovato</p>
          <Link href="/tornei" className="text-accent hover:underline">
            Cerca tornei
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const stats = (profile.stats as { played?: number; won?: number; top3?: number } | null) ?? {};
  const played = stats.played ?? 0;
  const won = stats.won ?? 0;
  const top3 = stats.top3 ?? 0;
  const regs = (registrations ?? []).filter((r) => r.tournament?.status === "completed");
  const wins = regs.filter((r) => r.position === 1);
  const history = regs.slice(0, 15);
  const preferredGames = profile.preferred_games ?? [];
  const elo = (profile.elo as Record<string, number> | null) ?? {};
  const hasElo = Object.keys(elo).length > 0;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20 pb-20">
        {/* Hero profilo */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-primary/10 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(var(--accent),0.15),transparent)]" />
          <div className="relative max-w-4xl mx-auto px-4 pt-12 pb-16">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
              <div className="relative">
                <div className="ring-4 ring-accent/30 ring-offset-4 ring-offset-background rounded-2xl p-1">
                  <Avatar
                    src={profile.avatar_url ?? undefined}
                    fallback={profile.nickname ?? "?"}
                    size="xl"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="font-zentry text-3xl md:text-4xl font-bold uppercase tracking-tight">
                  {profile.nickname ?? "Giocatore"}
                </h1>
                {(profile.city || profile.province) && (
                  <p className="text-muted mt-1 flex items-center justify-center sm:justify-start gap-1">
                    <span aria-hidden>📍</span>
                    {[profile.city, profile.province].filter(Boolean).join(", ")}
                  </p>
                )}
                {profile.bio && (
                  <p className="text-muted mt-3 max-w-xl">{profile.bio}</p>
                )}
                {preferredGames.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                    {preferredGames.map((g) => {
                      const game = GAMES.find((x) => x.value === g);
                      return (
                        <Badge key={g} variant="outline" className="text-xs">
                          {game?.label ?? g}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 -mt-6 space-y-8">
          {/* Statistiche */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
              <CardContent className="pt-6 pb-6 text-center">
                <div className="text-3xl md:text-4xl font-zentry font-bold text-foreground">{played}</div>
                <div className="text-sm text-muted mt-1">Tornei giocati</div>
              </CardContent>
            </Card>
            <Card className="border-accent/30 bg-accent/5 overflow-hidden">
              <CardContent className="pt-6 pb-6 text-center">
                <div className="text-3xl md:text-4xl font-zentry font-bold text-accent">{won}</div>
                <div className="text-sm text-muted mt-1">Vittorie</div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
              <CardContent className="pt-6 pb-6 text-center">
                <div className="text-3xl md:text-4xl font-zentry font-bold text-foreground">{top3}</div>
                <div className="text-sm text-muted mt-1">Podi (top 3)</div>
              </CardContent>
            </Card>
          </div>

          {/* ELO (se presente) */}
          {hasElo && (
            <Card>
              <CardContent className="py-5">
                <h2 className="font-robert font-bold text-sm uppercase tracking-wider text-muted mb-3">ELO</h2>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(elo).map(([game, value]) => {
                    const g = GAMES.find((x) => x.value === game);
                    return (
                      <div key={game} className="px-4 py-2 rounded-xl bg-foreground/5 border border-border/50">
                        <span className="text-sm text-muted">{g?.label ?? game}</span>
                        <span className="ml-2 font-bold text-accent">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tornei vinti */}
          {wins.length > 0 && (
            <Card>
              <CardContent className="py-6">
                <h2 className="font-robert font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="text-2xl" aria-hidden>🏆</span>
                  Tornei vinti
                </h2>
                <ul className="space-y-3">
                  {wins.map((r) => {
                    const t = r.tournament;
                    if (!t) return null;
                    const gameLabel = GAMES.find((x) => x.value === t.game)?.label ?? t.game;
                    return (
                      <li key={r.id}>
                        <Link
                          href={`/tornei/${t.id}`}
                          className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-foreground/5 hover:bg-foreground/10 border border-transparent hover:border-accent/30 transition-colors"
                        >
                          <span className="font-zentry font-bold text-accent w-8">1°</span>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium block truncate">{t.name}</span>
                            <span className="text-sm text-muted">
                              {formatDate(t.start_date)} · {gameLabel}
                              {t.store?.name && ` · ${t.store.name}`}
                            </span>
                          </div>
                          <span className="text-muted text-sm">→</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Storico tornei */}
          {history.length > 0 && (
            <Card>
              <CardContent className="py-6">
                <h2 className="font-robert font-bold text-lg mb-4">Storico tornei</h2>
                <ul className="space-y-2">
                  {history.map((r) => {
                    const t = r.tournament;
                    if (!t) return null;
                    const gameLabel = GAMES.find((x) => x.value === t.game)?.label ?? t.game;
                    const pos = r.position;
                    const posLabel = pos === 1 ? "1°" : pos === 2 ? "2°" : pos === 3 ? "3°" : pos ? `#${pos}` : "—";
                    return (
                      <li key={r.id}>
                        <Link
                          href={`/tornei/${t.id}`}
                          className="flex flex-wrap items-center gap-3 py-3 px-3 rounded-lg hover:bg-foreground/5 transition-colors"
                        >
                          <span
                            className={`w-10 text-center font-bold text-sm ${
                              pos === 1 ? "text-accent" : pos && pos <= 3 ? "text-foreground" : "text-muted"
                            }`}
                          >
                            {posLabel}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium block truncate">{t.name}</span>
                            <span className="text-sm text-muted">
                              {formatDate(t.start_date)} · {gameLabel}
                            </span>
                          </div>
                          <span className="text-muted text-sm">→</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Targhe */}
          {profile.badges && profile.badges.length > 0 && (
            <Card>
              <CardContent className="py-6">
                <h2 className="font-robert font-bold text-lg mb-4">Targhe</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.badges.map((b) => (
                    <Badge key={b} variant="accent">
                      {b}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {regs.length === 0 && wins.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted">Nessun torneo completato ancora.</p>
                <Link href="/tornei" className="text-accent hover:underline text-sm mt-2 inline-block">
                  Scopri i tornei
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
