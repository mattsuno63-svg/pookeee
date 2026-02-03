"use client";

import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useOwnerTournaments, useTournamentActions } from "@/hooks/useTournaments";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import { GAMES, TOURNAMENT_STATUS_LABELS } from "@/lib/constants";

export default function TorneiPage() {
  const { owner } = useUser();
  const { data: tournaments, isLoading, error } = useOwnerTournaments(owner?.id);
  const actions = useTournamentActions(owner?.id);

  if (isLoading) {
    return <div className="animate-pulse text-muted">Caricamento...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">Errore: {(error as Error).message}</div>
    );
  }

  const statusColor: Record<string, "default" | "accent" | "primary" | "success" | "warning" | "error" | "outline"> = {
    draft: "outline",
    published: "accent",
    closed: "warning",
    in_progress: "primary",
    completed: "success",
    cancelled: "error",
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-zentry text-3xl font-bold uppercase">I tuoi tornei</h1>
        <Link href="/dashboard/tornei/nuovo">
          <Button variant="accent">+ Nuovo torneo</Button>
        </Link>
      </div>

      {!tournaments || tournaments.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted mb-6">Non hai ancora creato nessun torneo.</p>
            <Link href="/dashboard/tornei/nuovo">
              <Button variant="accent">Crea il primo torneo</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tournaments.map((t) => {
            const store = t.store as { name?: string; slug?: string } | null;
            const game = GAMES.find((g) => g.value === t.game);
            return (
              <Card key={t.id} variant="interactive">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <h3 className="font-robert font-bold text-lg">{t.name}</h3>
                    <p className="text-sm text-muted">
                      {game?.label ?? t.game} • {store?.name ?? "Sede"} • {formatDate(t.start_date)} {formatTime(t.start_time)}
                    </p>
                  </div>
                  <Badge variant={statusColor[t.status] ?? "default"}>
                    {TOURNAMENT_STATUS_LABELS[t.status] ?? t.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-sm text-foreground/80">
                      {t.entry_fee > 0 ? formatCurrency(Number(t.entry_fee)) : "Gratuito"}
                    </span>
                    {t.max_participants && (
                      <span className="text-sm text-muted">• Max {t.max_participants} partecipanti</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/dashboard/tornei/${t.id}`}>
                      <Button variant="outline" size="sm">
                        Modifica
                      </Button>
                    </Link>
                    <Link href={`/dashboard/tornei/${t.id}/iscrizioni`}>
                      <Button variant="outline" size="sm">
                        Iscrizioni
                      </Button>
                    </Link>
                    {t.status === "draft" && (
                      <Button
                        size="sm"
                        variant="accent"
                        isLoading={actions.publish.isPending}
                        onClick={() => actions.publish.mutate(t.id)}
                      >
                        Pubblica
                      </Button>
                    )}
                    {t.status === "published" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          isLoading={actions.closeRegistrations.isPending}
                          onClick={() => actions.closeRegistrations.mutate(t.id)}
                        >
                          Chiudi iscrizioni
                        </Button>
                        <Button
                          size="sm"
                          variant="accent"
                          isLoading={actions.start.isPending}
                          onClick={() => actions.start.mutate(t.id)}
                        >
                          Avvia torneo
                        </Button>
                      </>
                    )}
                    {t.status === "closed" && (
                      <Link href={`/dashboard/tornei/${t.id}/completa`}>
                        <Button size="sm" variant="accent">
                          Inserisci risultati
                        </Button>
                      </Link>
                    )}
                    {t.status === "in_progress" && (
                      <Link href={`/dashboard/tornei/${t.id}/completa`}>
                        <Button size="sm" variant="accent">
                          Completa torneo
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
