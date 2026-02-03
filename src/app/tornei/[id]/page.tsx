"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTournament } from "@/hooks/useTournaments";
import { useRegistrations, useRegisterForTournament, useWithdrawRegistration } from "@/hooks/useRegistrations";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { GAMES, FORMATS } from "@/lib/constants";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";

export default function TorneoDettaglioPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, owner, profile } = useUser();
  const { data: tournament, isLoading, error } = useTournament(id);
  const register = useRegisterForTournament(user?.id);
  const withdraw = useWithdrawRegistration(user?.id);
  const { data: registrations } = useRegistrations(tournament ? id : null);
  const myReg = user && registrations?.find((r) => r.player_id === user.id && !["withdrawn", "cancelled"].includes(r.status));
  const alreadyRegistered = !!myReg;
  const [showConfirmRegister, setShowConfirmRegister] = useState(false);
  const [showConfirmWithdraw, setShowConfirmWithdraw] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Parallax effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Verifica se l'utente è il creatore del torneo
  const storeData = tournament?.store as { owner_id?: string } | null;
  const isCreator = owner?.id && storeData?.owner_id === owner.id;

  if (isLoading || !tournament) {
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

  if (error) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-16 flex items-center justify-center">
          <p className="text-red-500">{(error as Error).message}</p>
        </main>
        <Footer />
      </>
    );
  }

  const store = tournament.store as { name?: string; slug?: string; city?: string; address?: string } | null;
  const game = GAMES.find((g) => g.value === tournament.game);
  const format = FORMATS.find((f) => f.value === tournament.format);
  const tImg = (tournament as { image_url?: string }).image_url;
  const canRegister =
    tournament.status === "published" &&
    user &&
    !alreadyRegistered &&
    (!tournament.max_participants || (registrations?.length ?? 0) < tournament.max_participants);

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20 pb-20">
        {/* Hero con immagine */}
        <section className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-transparent to-background" />
          {tImg ? (
            <div className="h-[40vh] min-h-[280px] max-h-[400px] w-full overflow-hidden">
              <div
                className="w-full h-full will-change-transform"
                style={{
                  transform: `translateY(${scrollY * 0.3}px)`,
                  backgroundImage: `url(${tImg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  scale: '1.1',
                }}
              />
            </div>
          ) : (
            <div className="h-[30vh] min-h-[200px] bg-gradient-to-br from-primary/50 to-accent/20 flex items-center justify-center">
              <span className="text-8xl font-zentry font-bold text-white/20">
                {game?.label?.[0] ?? "T"}
              </span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
          <div className="absolute bottom-6 left-0 right-0 max-w-4xl mx-auto px-4">
            <Link
              href="/tornei"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors mb-4"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tutti i tornei
            </Link>
            <h1 className="font-zentry text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight">
              {tournament.name}
            </h1>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-3 py-1 rounded-full bg-white/10 text-sm font-medium">
                {game?.label ?? tournament.game}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-sm font-medium">
                {format?.label ?? tournament.format}
              </span>
              {tournament.status === "published" && (
                <span className="px-3 py-1 rounded-full bg-accent text-background text-sm font-medium">
                  Iscrizioni aperte
                </span>
              )}
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 -mt-4 relative z-10">
          {/* CTA Iscrizione */}
          <div className="flex flex-wrap gap-4 items-center justify-between mb-10 p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10">
            <div>
              <p className="text-2xl font-zentry font-bold">
                {formatDate(tournament.start_date)} · ore {formatTime(tournament.start_time)}
              </p>
              <p className="text-muted mt-1">
                {tournament.entry_fee > 0 ? formatCurrency(Number(tournament.entry_fee)) : "Gratuito"}
                {tournament.max_participants && ` · Max ${tournament.max_participants} partecipanti`}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {isCreator && (
                <Link href={`/dashboard/tornei/${id}/iscrizioni`}>
                  <Button
                    variant="accent"
                    size="lg"
                    className="rounded-2xl px-6"
                  >
                    👥 Gestisci iscritti
                  </Button>
                </Link>
              )}
              {canRegister && (
                <>
                  <Button
                    variant="accent"
                    size="lg"
                    isLoading={register.isPending}
                    onClick={() => setShowConfirmRegister(true)}
                    className="rounded-2xl px-8"
                  >
                    Iscriviti
                  </Button>
                  <Modal
                    isOpen={showConfirmRegister}
                    onClose={() => setShowConfirmRegister(false)}
                    title="Conferma iscrizione"
                    size="md"
                  >
                    <div className="mb-4">
                      <p className="text-foreground mb-2">
                        Vuoi iscriverti al torneo <strong>{tournament.name}</strong>?
                      </p>
                      {tournament.entry_fee > 0 && (
                        <p className="text-foreground text-lg font-semibold">
                          Costo: {formatCurrency(Number(tournament.entry_fee))}.
                        </p>
                      )}
                      
                      <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <p className="text-xs text-amber-200">
                          ⚠️ Il tuo nickname <strong>{profile?.nickname ?? "sconosciuto"}</strong> sarà visibile 
                          pubblicamente nella lista iscritti.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end flex-shrink-0">
                      <Button variant="outline" onClick={() => setShowConfirmRegister(false)}>
                        Annulla
                      </Button>
                      <Button
                        variant="accent"
                        isLoading={register.isPending}
                        onClick={() => {
                          register.mutate(id);
                          setShowConfirmRegister(false);
                        }}
                      >
                        ✓ Sì
                      </Button>
                    </div>
                  </Modal>
                </>
              )}
              {!user && tournament.status === "published" && (
                <Link href={`/login?redirect=/tornei/${id}`}>
                  <Button variant="accent" size="lg" className="rounded-2xl px-8">
                    Accedi per iscriverti
                  </Button>
                </Link>
              )}
              {register.isSuccess && (
                <span className="px-4 py-2 rounded-2xl bg-green-500/20 text-green-400 font-medium">
                  ✓ Iscrizione effettuata!
                </span>
              )}
              {alreadyRegistered && (
                <>
                  <Link href={`/tornei/${id}/gruppo`}>
                    <Button variant="outline" size="lg" className="rounded-2xl">
                      💬 Gruppo torneo
                    </Button>
                  </Link>
                  {tournament.status === "published" && (
                    <>
                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-2xl text-red-400 border-red-400/50 hover:bg-red-500/10"
                        isLoading={withdraw.isPending}
                        onClick={() => setShowConfirmWithdraw(true)}
                      >
                        Disiscriviti
                      </Button>
                      <Modal
                        isOpen={showConfirmWithdraw}
                        onClose={() => setShowConfirmWithdraw(false)}
                        title="Conferma disiscrizione"
                        size="md"
                      >
                        <p className="text-foreground mb-6">
                          Sei sicuro di volerti disiscrivere dal torneo <strong>{tournament.name}</strong>?
                        </p>
                        <div className="flex gap-3 justify-end">
                          <Button variant="outline" onClick={() => setShowConfirmWithdraw(false)}>
                            Annulla
                          </Button>
                          <Button
                            variant="default"
                            className="bg-red-600 hover:bg-red-700"
                            isLoading={withdraw.isPending}
                            onClick={() => {
                              if (myReg) {
                                withdraw.mutate(
                                  { registrationId: myReg.id, tournamentId: id },
                                  { onSuccess: () => setShowConfirmWithdraw(false) }
                                );
                              }
                            }}
                          >
                            Conferma
                          </Button>
                        </div>
                      </Modal>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Layout Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto mb-8">
            {/* Sede - Span 2 colonne su large */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10">
              <h3 className="font-robert font-bold text-lg mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Sede
              </h3>
              <Link
                href={`/negozio/${store?.slug ?? ""}`}
                className="text-accent hover:underline font-medium text-lg"
              >
                {store?.name}
              </Link>
              {store?.city && <p className="text-muted">{store.city}</p>}
              {store?.address && <p className="text-sm text-muted mt-1">{store.address}</p>}
            </div>
            
            {/* Info rapide */}
            <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10">
              <h3 className="font-robert font-bold text-sm uppercase text-muted mb-3">Info</h3>
              <div className="space-y-2 text-sm">
                <p>👥 Max: {tournament.max_participants ?? "∞"}</p>
                <p>⏱️ Chiusura: {tournament.registration_closes_minutes_before} min prima</p>
                <p>🎯 Formato: {format?.label}</p>
              </div>
            </div>
            
            {/* Descrizione - Full width */}
            {tournament.description && (
              <div className="md:col-span-2 lg:col-span-3 p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10">
                <h3 className="font-robert font-bold text-lg mb-3">Descrizione</h3>
                <p className="whitespace-pre-wrap text-muted leading-relaxed">{tournament.description}</p>
              </div>
            )}
            
            {/* Regolamento e Premi affiancati */}
            {tournament.rules && (
              <div className="md:col-span-1 lg:col-span-2 p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10">
                <h3 className="font-robert font-bold text-lg mb-3">Regolamento</h3>
                <p className="whitespace-pre-wrap text-muted leading-relaxed text-sm">{tournament.rules}</p>
              </div>
            )}
            
            {tournament.prizes && (
              <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10">
                <h3 className="font-robert font-bold text-lg mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Premi
                </h3>
                <p className="whitespace-pre-wrap text-muted leading-relaxed text-sm">{tournament.prizes}</p>
              </div>
            )}
          </div>

          {/* Vincitori: visibile quando il torneo è completato */}
          {tournament.status === "completed" && Array.isArray(tournament.results) && (tournament.results as { position: number; player_id: string }[]).length > 0 && (
            <div className="mb-8 p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 border-accent/30">
              <h3 className="font-robert font-bold text-lg mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Vincitori
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((pos) => {
                  const res = (tournament.results as { position: number; player_id: string }[]).find((r) => r.position === pos);
                  const reg = registrations?.find((r) => r.player_id === res?.player_id);
                  const player = reg?.player as { nickname?: string | null; avatar_url?: string | null } | null;
                  const label = pos === 1 ? "1° posto" : pos === 2 ? "2° posto" : "3° posto";
                  return (
                    <div key={pos} className="flex items-center gap-3 p-4 rounded-2xl bg-background/50">
                      <span className="font-zentry font-bold text-accent text-lg">{pos === 1 ? "1°" : pos === 2 ? "2°" : "3°"}</span>
                      <Avatar src={player?.avatar_url ?? undefined} fallback={player?.nickname ?? "?"} size="md" />
                      {res?.player_id ? (
                        <Link href={`/giocatore/${res.player_id}`}>
                          <span className="font-medium hover:text-accent cursor-pointer transition-colors">
                            {player?.nickname ?? "Giocatore"}
                          </span>
                        </Link>
                      ) : (
                        <span className="font-medium">{player?.nickname ?? "Giocatore"}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="text-center pt-8">
            <Link href="/tornei" className="text-muted hover:text-accent text-sm transition-colors">
              ← Torna all&apos;elenco tornei
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
