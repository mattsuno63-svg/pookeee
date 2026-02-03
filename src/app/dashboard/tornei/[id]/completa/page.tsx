"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useTournament, useTournamentActions } from "@/hooks/useTournaments";
import { useRegistrations } from "@/hooks/useRegistrations";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Select } from "@/components/ui/Select";

export default function CompletaTorneoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data: tournament, isLoading } = useTournament(id);
  const { data: registrations } = useRegistrations(id);
  const { owner } = useUser();
  const complete = useTournamentActions(owner?.id).complete;

  const [results, setResults] = useState<{ position: number; player_id: string; points: number }[]>([]);
  const [podium1, setPodium1] = useState("");
  const [podium2, setPodium2] = useState("");
  const [podium3, setPodium3] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const presentRegs = (registrations ?? []).filter((r) => r.status === "present" || r.status === "confirmed");
  const presentIds = new Set(presentRegs.map((r) => r.player_id));

  const playerOptions = [
    { value: "", label: "— Seleziona giocatore" },
    ...presentRegs.map((r) => {
      const p = r.player as { nickname?: string | null } | null;
      return { value: r.player_id, label: p?.nickname ?? "Giocatore" };
    }),
  ];

  useEffect(() => {
    if (presentRegs.length && results.length === 0) {
      setResults(
        presentRegs.map((r, i) => ({
          position: i + 1,
          player_id: r.player_id,
          points: 0,
        }))
      );
    }
  }, [presentRegs]);

  const buildResultsFromPodium = (): { position: number; player_id: string; points: number }[] => {
    const chosen = [podium1, podium2, podium3].filter(Boolean);
    const chosenSet = new Set(chosen);
    const rest = presentRegs.filter((r) => !chosenSet.has(r.player_id));
    const n = presentRegs.length;
    const out: { position: number; player_id: string; points: number }[] = [];
    chosen.forEach((player_id, i) => {
      out.push({ position: i + 1, player_id, points: Math.max(0, n - i) });
    });
    rest.forEach((r, i) => {
      out.push({ position: chosen.length + i + 1, player_id: r.player_id, points: Math.max(0, n - chosen.length - i) });
    });
    return out;
  };

  const handleCompleteWithPodium = async () => {
    const chosen = [podium1, podium2, podium3].filter(Boolean);
    if (chosen.length === 0) {
      setError("Seleziona almeno un vincitore (1° posto).");
      return;
    }
    const uniq = new Set(chosen);
    if (uniq.size !== chosen.length) {
      setError("1°, 2° e 3° devono essere giocatori diversi.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = buildResultsFromPodium();
      await complete.mutateAsync({ id, results: res });
      router.push(`/dashboard/tornei/${id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const movePlayer = (fromIdx: number, toIdx: number) => {
    setResults((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, { ...removed, position: toIdx + 1 });
      return next.map((r, i) => ({ ...r, position: i + 1 }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const withPoints = results.map((r, i) => ({
        ...r,
        points: Math.max(0, presentRegs.length - i),
      }));
      await complete.mutateAsync({ id, results: withPoints });
      router.push(`/dashboard/tornei/${id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !tournament) {
    return <div className="animate-pulse text-muted">Caricamento...</div>;
  }

  if (!["closed", "in_progress"].includes(tournament.status)) {
    return (
      <div>
        <p className="text-muted mb-4">Questo torneo non può essere completato in questo stato.</p>
        <Link href={`/dashboard/tornei/${id}`}>
          <Button>Torna al torneo</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <Link href={`/dashboard/tornei/${id}`} className="text-muted hover:text-foreground text-sm mb-4 inline-block">
          ← Torna al torneo
        </Link>
        <h1 className="font-zentry text-3xl font-bold uppercase">Inserisci risultati</h1>
        <p className="text-muted">{tournament.name}</p>
      </div>

      {/* Podio rapido: 3 vincitori e completa */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-robert font-bold text-sm uppercase tracking-wider text-accent">
            Podio rapido
          </h3>
          <p className="text-sm text-muted">
            Imposta 1°, 2° e 3° posto. Gli altri partecipanti verranno classificati dopo. Puoi impostare solo il vincitore se preferisci.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="1° posto"
              value={podium1}
              onChange={(e) => setPodium1(e.target.value)}
              options={playerOptions}
            />
            <Select
              label="2° posto"
              value={podium2}
              onChange={(e) => setPodium2(e.target.value)}
              options={playerOptions}
            />
            <Select
              label="3° posto"
              value={podium3}
              onChange={(e) => setPodium3(e.target.value)}
              options={playerOptions}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex flex-wrap gap-3 items-center">
            <Button
              type="button"
              variant="accent"
              isLoading={saving}
              disabled={presentRegs.length === 0 || (!podium1 && !podium2 && !podium3)}
              onClick={handleCompleteWithPodium}
            >
              Completa con questo podio
            </Button>
            <button
              type="button"
              className="text-sm text-muted hover:text-foreground underline"
              onClick={async () => {
                if (presentRegs.length === 0) return;
                setError("");
                setSaving(true);
                try {
                  const n = presentRegs.length;
                  const res = presentRegs.map((r, i) => ({
                    position: i + 1,
                    player_id: r.player_id,
                    points: Math.max(0, n - i),
                  }));
                  await complete.mutateAsync({ id, results: res });
                  router.push(`/dashboard/tornei/${id}`);
                } catch (err) {
                  setError((err as Error).message);
                } finally {
                  setSaving(false);
                }
              }}
              disabled={presentRegs.length === 0 || saving}
            >
              Completa senza podio (classifica tutti in ordine)
            </button>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted border-t border-border pt-4">
        Oppure ordina manualmente tutti i partecipanti qui sotto e invia la classifica completa.
      </p>

      <form onSubmit={handleSubmit}>
        <p className="text-sm text-muted mb-4">
          Ordina i giocatori dalla posizione 1 alla fine. Usa le frecce per spostare.
        </p>

        <div className="space-y-2 mb-6">
          {results.map((r, idx) => {
            const reg = presentRegs.find((pr) => pr.player_id === r.player_id);
            const player = reg?.player as { nickname?: string | null; avatar_url?: string | null } | null;
            return (
              <Card key={r.player_id}>
                <CardContent className="py-3 flex items-center gap-4">
                  <span className="font-bold text-accent w-8">#{r.position}</span>
                  <Avatar
                    src={player?.avatar_url ?? undefined}
                    fallback={player?.nickname ?? "?"}
                    size="sm"
                  />
                  <Link href={`/giocatore/${r.player_id}`} className="flex-1">
                    <span className="hover:text-accent cursor-pointer transition-colors">
                      {player?.nickname ?? "Giocatore"}
                    </span>
                  </Link>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => movePlayer(idx, Math.max(0, idx - 1))}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-foreground/10 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => movePlayer(idx, Math.min(results.length - 1, idx + 1))}
                      disabled={idx === results.length - 1}
                      className="p-1 rounded hover:bg-foreground/10 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {presentRegs.length === 0 && (
          <p className="text-muted mb-6">Nessun giocatore presente. Effettua i check-in prima di completare.</p>
        )}

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <div className="flex gap-4">
          <Button
            type="submit"
            variant="accent"
            isLoading={saving}
            disabled={presentRegs.length === 0}
          >
            Completa torneo
          </Button>
          <Link href={`/dashboard/tornei/${id}`}>
            <Button type="button" variant="outline">
              Annulla
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
