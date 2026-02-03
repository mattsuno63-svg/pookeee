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
  
  // Tornei futuri a cui è iscritto
  const upcomingRegs = (registrations ?? []).filter(
    (r) => r.tournament && ["published", "closed"].includes(r.tournament.status) && r.status !== "withdrawn"
  );
  
  // Social links (se presenti)
  const socials = (profile as { social_links?: Record<string, string> }).social_links ?? {};

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
                {/* Social links */}
                {Object.keys(socials).length > 0 && (
                  <div className="flex gap-3 mt-4 justify-center sm:justify-start">
                    {socials.instagram && (
                      <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-accent/20 transition-colors" title="Instagram">
                        <svg className="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                    )}
                    {socials.discord && (
                      <a href={socials.discord} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-accent/20 transition-colors" title="Discord">
                        <svg className="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                      </a>
                    )}
                    {socials.twitter && (
                      <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-accent/20 transition-colors" title="Twitter/X">
                        <svg className="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                    )}
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

          {/* Tornei futuri */}
          {upcomingRegs.length > 0 && (
            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="py-6">
                <h2 className="font-robert font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="text-2xl" aria-hidden>📅</span>
                  Iscritto a
                </h2>
                <ul className="space-y-2">
                  {upcomingRegs.slice(0, 5).map((r) => {
                    const t = r.tournament;
                    if (!t) return null;
                    const gameLabel = GAMES.find((x) => x.value === t.game)?.label ?? t.game;
                    return (
                      <li key={r.id}>
                        <Link
                          href={`/tornei/${t.id}`}
                          className="flex flex-wrap items-center gap-3 py-3 px-3 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <span className="w-10 text-center text-accent text-sm">→</span>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium block truncate">{t.name}</span>
                            <span className="text-sm text-muted">
                              {formatDate(t.start_date)} · {gameLabel}
                              {t.store?.name && ` · ${t.store.name}`}
                            </span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

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
