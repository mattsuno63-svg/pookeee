"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTournament } from "@/hooks/useTournaments";
import { useRegistrations, useUpdateRegistration, useDeleteRegistration, useBulkCheckIn } from "@/hooks/useRegistrations";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";

export default function IscrizioniPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: tournament, isLoading } = useTournament(id);
  const { data: registrations, isLoading: loadingRegs } = useRegistrations(id);
  const updateReg = useUpdateRegistration();
  const deleteReg = useDeleteRegistration();
  const bulkCheckIn = useBulkCheckIn(id);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  if (isLoading || !tournament) {
    return <div className="animate-pulse text-muted">Caricamento...</div>;
  }

  const store = tournament.store as { name?: string } | null;
  const regs = registrations ?? [];
  const filtered = filterStatus === "all" ? regs : regs.filter((r) => r.status === filterStatus);
  const canManage = ["published", "closed", "in_progress"].includes(tournament.status);
  const notYetPresent = regs.filter((r) => r.status !== "present" && !["withdrawn", "cancelled"].includes(r.status));
  const presentCount = regs.filter((r) => r.status === "present").length;

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/dashboard/tornei/${id}`} className="text-muted hover:text-foreground text-sm mb-4 inline-block">
          ← Torna al torneo
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-zentry text-3xl font-bold uppercase">Iscrizioni</h1>
          <Link href={`/tornei/${id}/gruppo`}>
            <Button variant="outline" size="sm">💬 Gruppo torneo</Button>
          </Link>
        </div>
        <p className="text-muted">{tournament.name} • {store?.name}</p>
      </div>

      {/* Check-in: barra rapida + pulsante Check-in tutti */}
      {canManage && tournament.status !== "completed" && regs.length > 0 && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-robert font-bold text-sm uppercase tracking-wider text-accent">Check-in partecipanti</h3>
              <p className="text-sm text-muted mt-1">
                {presentCount} presenti
                {notYetPresent.length > 0 && ` • ${notYetPresent.length} da segnare come presenti`}
              </p>
            </div>
            {notYetPresent.length > 0 ? (
              <Button
                variant="accent"
                size="sm"
                isLoading={bulkCheckIn.isPending}
                onClick={() => bulkCheckIn.mutate()}
              >
                ✓ Check-in tutti ({notYetPresent.length})
              </Button>
            ) : (
              <span className="text-sm text-muted">Tutti segnati come presenti</span>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {["all", "pending", "confirmed", "present", "absent"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filterStatus === s ? "bg-accent text-background" : "bg-foreground/5 hover:bg-foreground/10"
            }`}
          >
            {s === "all" ? "Tutti" : s === "pending" ? "In attesa" : s === "confirmed" ? "Confermati" : s === "present" ? "Presenti" : "Assenti"}
          </button>
        ))}
      </div>

      {loadingRegs ? (
        <div className="animate-pulse text-muted">Caricamento iscrizioni...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted">
              {regs.length === 0 ? "Nessuna iscrizione ancora." : "Nessun risultato con questo filtro."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((reg) => {
            const player = reg.player as { nickname?: string | null; avatar_url?: string | null } | null;
            return (
              <Card key={reg.id}>
                <CardContent className="py-4 flex flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={player?.avatar_url ?? undefined}
                      fallback={player?.nickname ?? "?"}
                      size="md"
                    />
                    <div>
                      <Link href={`/giocatore/${reg.player_id}`} className="font-medium hover:text-accent transition-colors">
                        {player?.nickname ?? "Giocatore"}
                      </Link>
                      <p className="text-sm text-muted">
                        Iscritto il {formatDate(reg.created_at)} •{" "}
                        <Badge variant={reg.payment_status === "paid" ? "success" : "outline"}>
                          {reg.payment_status === "paid" ? "Pagato" : "Da pagare"}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{reg.status}</Badge>
                    {canManage && (
                      <div className="flex gap-1">
                        {reg.payment_status !== "paid" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateReg.mutate({ id: reg.id, payment_status: "paid", paid_at: new Date().toISOString() })}
                          >
                            Marca pagato
                          </Button>
                        )}
                        {reg.status !== "present" && tournament.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateReg.mutate({ id: reg.id, status: "present" })}
                          >
                            Check-in
                          </Button>
                        )}
                        {reg.status === "present" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateReg.mutate({ id: reg.id, status: "absent" })}
                          >
                            Assente
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400"
                          onClick={() => deleteReg.mutate(reg.id)}
                        >
                          Rimuovi
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-sm text-muted">
        {regs.length} iscrizioni totali
        {tournament.max_participants && ` • Max ${tournament.max_participants}`}
      </p>
    </div>
  );
}
