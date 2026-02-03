"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTournaments } from "@/hooks/useTournaments";
import { useUser } from "@/hooks/useUser";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GAMES, PROVINCES } from "@/lib/constants";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const ITEMS_PER_PAGE = 10;

export default function TorneiPage() {
  const [game, setGame] = useState<string>("");
  const [province, setProvince] = useState<string>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [hasSetDefaultProvince, setHasSetDefaultProvince] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { profile, user } = useUser();
  const userProvince = profile?.province ?? null;

  // Query per ottenere i tornei a cui l'utente è iscritto
  const supabase = createClient();
  const { data: myRegistrations } = useQuery({
    queryKey: ["my-registrations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("registrations")
        .select("tournament_id")
        .eq("player_id", user.id)
        .in("status", ["pending", "confirmed", "present"]);
      return data?.map(r => r.tournament_id) ?? [];
    },
    enabled: !!user?.id,
  });

  // Default: mostra tornei nella provincia dell'utente (se impostata)
  useEffect(() => {
    if (!hasSetDefaultProvince && profile && userProvince && !province) {
      setProvince(userProvince);
      setHasSetDefaultProvince(true);
    }
  }, [hasSetDefaultProvince, profile, userProvince, province]);

  const { data: tournaments, isLoading, error } = useTournaments({
    game: (game || undefined) as "magic" | "pokemon" | "onepiece" | "yugioh" | "other" | undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  const filtered = useMemo(() => {
    let list = tournaments ?? [];
    if (province) {
      const provInfo = PROVINCES.find((p) => p.value === province);
      const provinceLabel = provInfo?.label ?? "";
      list = list.filter((t) => {
        const store = t.store as { province?: string | null; city?: string | null } | null;
        const storeProv = (store?.province ?? "").trim();
        const storeCity = (store?.city ?? "").trim();
        if (!storeProv && !storeCity) return false;
        return (
          storeProv === province ||
          storeProv.toUpperCase() === province ||
          storeProv === provinceLabel ||
          (storeCity && provinceLabel && storeCity.toLowerCase() === provinceLabel.toLowerCase())
        );
      });
    }
    return list;
  }, [tournaments, province]);

  // Paginazione
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedTournaments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  // Reset pagina quando cambiano i filtri
  useEffect(() => {
    setCurrentPage(1);
  }, [game, province, fromDate]);

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20 pb-20">
        {/* Hero video: sticky, resta fermo mentre scrolli */}
        <section className="sticky top-0 h-[60vh] overflow-hidden -z-10">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="/files/hero-1.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="relative max-w-6xl mx-auto px-4 text-center flex flex-col justify-center h-full">
            <h1 className="font-zentry text-8xl md:text-9xl lg:text-[12rem] font-bold uppercase tracking-tight mb-4 text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)] leading-none">
              Tornei
            </h1>
            <p className="text-white/90 text-lg md:text-xl max-w-xl mx-auto drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)] font-robert">
              Cerca i tornei TCG nella tua provincia
            </p>
          </div>
        </section>

        {/* Contenuto: scorre sopra il video e lo copre (parallax), min-h per coprire ~98% del video */}
        <div className="relative bg-background rounded-t-[2.5rem] -mt-8 pt-8 min-h-[60vh]">
          <div className="max-w-7xl mx-auto px-4">
          {/* Filtri: liquid glass + icone + angoli arrotondati */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-12 p-5 md:p-6 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/15 mx-auto w-full max-w-4xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-center gap-3 flex-1 min-w-[180px]">
              <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 12h.01M12 12h.01M18 12h.01M6 6h.01M12 6h.01M18 6h.01M6 18h.01M12 18h.01M18 18h.01" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 flex flex-col items-center">
                <label className="block w-full text-center font-robert text-xs uppercase tracking-wider text-white/60 mb-1">Gioco</label>
                <Select
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  options={[{ value: "", label: "Tutti i giochi" }, ...GAMES.map((g) => ({ value: g.value, label: g.label }))]}
                  className="tornei-select w-full [&_button]:rounded-2xl [&_button]:overflow-hidden [&_button>span]:flex-1 [&_button>span]:text-center bg-white/5 border-white/10 text-foreground font-robert"
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 flex-1 min-w-[180px]">
              <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 flex flex-col items-center">
                <label className="block w-full text-center font-robert text-xs uppercase tracking-wider text-white/60 mb-1">Provincia</label>
                <Select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  options={[{ value: "", label: "Tutte le province" }, ...PROVINCES.filter((p) => p.value).map((p) => ({ value: p.value, label: p.label }))]}
                  className="tornei-select w-full [&_button]:rounded-2xl [&_button]:overflow-hidden [&_button>span]:flex-1 [&_button>span]:text-center bg-white/5 border-white/10 text-foreground font-robert"
                  title={!userProvince ? "Imposta la provincia nel profilo" : undefined}
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 flex-1 min-w-[180px]">
              <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 flex flex-col items-center">
                <label className="block w-full text-center font-robert text-xs uppercase tracking-wider text-white/60 mb-1">Da</label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="date-no-hint w-full rounded-2xl bg-white/5 border-white/10 font-robert text-foreground text-center [color-scheme:dark]"
                  placeholder=" "
                />
              </div>
            </div>

            {(game || province || fromDate || toDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setGame("");
                  setProvince("");
                  setFromDate("");
                  setToDate("");
                }}
                className="whitespace-nowrap font-robert uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/10 rounded-2xl border border-white/10"
              >
                <svg className="w-4 h-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Resetta
              </Button>
            )}
          </div>

          {!userProvince && (
            <div className="text-center mb-8">
              <Link
                href="/profilo/modifica"
                className="inline-flex items-center gap-2 text-sm font-robert text-accent hover:text-accent/90 transition-colors"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Imposta la tua provincia nel profilo per vedere i tornei vicini di default
              </Link>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-24">
              <div className="animate-pulse text-muted">Caricamento...</div>
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-12">{(error as Error).message}</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10">
              <p className="text-muted">Nessun torneo trovato. Prova a modificare i filtri.</p>
            </div>
          ) : (
            <>
              {/* Griglia tornei: 1 colonna mobile, 2+ desktop, card alte per 2 righe visibili */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {paginatedTournaments.map((t) => {
                  const store = t.store as { name?: string; slug?: string; city?: string; province?: string } | null;
                  const g = GAMES.find((x) => x.value === t.game);
                  const tImg = (t as { image_url?: string }).image_url;
                  return (
                    <Link
                      key={t.id}
                      href={`/tornei/${t.id}`}
                      className="group w-full block"
                    >
                      {/* Card: altezza fissa per 2 righe su desktop, 1 su mobile */}
                      <div className="h-[calc(50vh-120px)] md:h-[calc(50vh-100px)] min-h-[280px] max-h-[400px] rounded-2xl overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/10 transition-all duration-300 flex flex-col">
                        <div className="relative h-[50%] shrink-0 bg-primary/20 overflow-hidden">
                          {tImg ? (
                            <img src={tImg} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-4xl opacity-40">{g?.label?.[0] ?? "?"}</span>
                            </div>
                          )}
                          {myRegistrations?.includes(t.id) ? (
                            <div className="absolute top-2 right-2">
                              <Badge variant="default" className="shadow-lg bg-green-600/90 text-white border-green-400/50">
                                ✓ Iscritto
                              </Badge>
                            </div>
                          ) : t.status === "published" ? (
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-accent text-background text-xs font-medium">
                              Aperto
                            </span>
                          ) : null}
                        </div>
                        <div className="flex-1 p-3 md:p-4 flex flex-col justify-between min-h-0">
                          <div>
                            <h3 className="font-robert font-bold text-sm md:text-base line-clamp-2 mb-1">{t.name}</h3>
                            <p className="text-xs text-muted line-clamp-1">{g?.label ?? t.game} • {store?.name ?? "Sede"}</p>
                            <p className="text-xs text-muted mt-0.5">
                              {formatDate(t.start_date)} • {formatTime(t.start_time)}
                            </p>
                            {t.entry_fee > 0 && (
                              <p className="text-xs text-accent font-medium mt-1">{formatCurrency(Number(t.entry_fee))}</p>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2 pt-2 border-t border-white/10">
                            <div className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/5 hover:bg-accent/20 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-xs">Dettagli</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Paginazione */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 pb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-xl border border-white/10 disabled:opacity-30"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Mostra solo alcune pagine per non avere troppi bottoni
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg font-robert text-sm transition-colors ${
                              page === currentPage
                                ? "bg-accent text-background font-bold"
                                : "bg-white/5 text-white/70 hover:bg-white/10"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }
                      // Mostra "..." tra i gap
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="text-white/40 px-1">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-xl border border-white/10 disabled:opacity-30"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                  
                  <span className="ml-4 text-xs text-white/50 font-robert">
                    {filtered.length} tornei
                  </span>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
