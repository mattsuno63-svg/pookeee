"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useUser } from "@/hooks/useUser";
import { useTournament } from "@/hooks/useTournaments";
import { useRegistrations } from "@/hooks/useRegistrations";
import { useTournamentMessages, usePostTournamentMessage } from "@/hooks/useTournamentMessages";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";

export default function GruppoTorneoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useUser();
  const { data: tournament, isLoading } = useTournament(id);
  const { data: registrations } = useRegistrations(id);
  const { data: messages, isLoading: loadingMsg } = useTournamentMessages(id);
  const postMessage = usePostTournamentMessage(id);
  const [newMsg, setNewMsg] = useState("");

  const store = tournament?.store as { owner_id?: string; name?: string } | null;
  const isOwner = !!(user?.id && store?.owner_id === user.id);
  const isParticipant = !!(user && registrations?.some((r) => r.player_id === user.id));

  useEffect(() => {
    if (!user) {
      router.replace(`/login?redirect=/tornei/${id}/gruppo`);
      return;
    }
    if (tournament && !isOwner && !isParticipant) {
      router.replace(`/tornei/${id}`);
    }
  }, [user, tournament, isOwner, isParticipant, id, router]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !isOwner) return;
    try {
      await postMessage.mutateAsync(newMsg.trim());
      setNewMsg("");
    } catch {}
  };

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

  if (!user) return null;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href={`/tornei/${id}`}
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent mb-6"
          >
            ← Torna al torneo
          </Link>
          <h1 className="font-zentry text-2xl font-bold uppercase mb-2">Gruppo torneo</h1>
          <p className="text-muted mb-6">{tournament.name} • {store?.name}</p>

          {isOwner && (
            <form onSubmit={handlePost} className="mb-8">
              <textarea
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Scrivi un messaggio ai partecipanti..."
                className="w-full min-h-[100px] px-4 py-3 rounded-xl bg-foreground/5 border border-white/10 focus:border-accent outline-none resize-none"
                disabled={postMessage.isPending}
              />
              <Button
                type="submit"
                variant="accent"
                className="mt-2"
                disabled={!newMsg.trim() || postMessage.isPending}
                isLoading={postMessage.isPending}
              >
                Invia (tutti riceveranno una notifica)
              </Button>
            </form>
          )}

          {!isOwner && (
            <p className="text-sm text-muted mb-6">
              Solo l&apos;organizzatore può scrivere. Qui puoi leggere i messaggi.
            </p>
          )}

          {loadingMsg ? (
            <div className="animate-pulse text-muted">Caricamento messaggi...</div>
          ) : !messages?.length ? (
            <p className="text-muted">Nessun messaggio ancora.</p>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => {
                const author = m.author as { nickname?: string | null; avatar_url?: string | null };
                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar
                        src={author?.avatar_url ?? undefined}
                        fallback={author?.nickname ?? "?"}
                        size="sm"
                      />
                      <div>
                        <span className="font-medium">{author?.nickname ?? "Organizzatore"}</span>
                        <span className="text-xs text-muted ml-2">
                          {formatDate(m.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-foreground/90">{m.message}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
