"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useTournament, useUpdateTournament, useTournamentActions } from "@/hooks/useTournaments";
import { useRegistrations } from "@/hooks/useRegistrations";
import { useStores } from "@/hooks/useStores";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { GAMES, FORMATS, TOURNAMENT_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatTime } from "@/lib/utils";
import { ExportSocial } from "@/components/features/ExportSocial";

export default function ModificaTorneoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { owner } = useUser();
  const { data: tournament, isLoading } = useTournament(id);
  const { data: registrations } = useRegistrations(tournament ? id : null);
  const { data: stores } = useStores(owner?.id);
  const updateTournament = useUpdateTournament(owner?.id);
  const actions = useTournamentActions(owner?.id);

  const [formData, setFormData] = useState({
    store_id: "",
    name: "",
    game: "magic",
    format: "swiss",
    start_date: "",
    start_time: "18:00",
    description: "",
    rules: "",
    prizes: "",
    max_participants: "",
    min_participants: "2",
    entry_fee: "0",
    registration_closes_minutes_before: "30",
    image_url: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPublishedSuccess, setShowPublishedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (tournament) {
      setFormData({
        store_id: tournament.store_id,
        name: tournament.name,
        game: tournament.game,
        format: tournament.format ?? "swiss",
        start_date: tournament.start_date,
        start_time: (tournament.start_time as string)?.slice(0, 5) ?? "18:00",
        description: tournament.description ?? "",
        rules: tournament.rules ?? "",
        prizes: tournament.prizes ?? "",
        max_participants: tournament.max_participants?.toString() ?? "",
        min_participants: (tournament.min_participants ?? 2).toString(),
        entry_fee: (tournament.entry_fee ?? 0).toString(),
        registration_closes_minutes_before: (tournament.registration_closes_minutes_before ?? 30).toString(),
        image_url: (tournament as { image_url?: string }).image_url ?? "",
      });
    }
  }, [tournament]);

  useEffect(() => {
    const justPublished = sessionStorage.getItem(`tournament-${id}-just-published`);
    if (justPublished === 'true') {
      setShowPublishedSuccess(true);
      sessionStorage.removeItem(`tournament-${id}-just-published`);
    }
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!formData.name.trim()) {
      setErrors({ name: "Il nome è obbligatorio" });
      return;
    }
    if (!formData.start_date) {
      setErrors({ start_date: "La data è obbligatoria" });
      return;
    }
    try {
      await updateTournament.mutateAsync({
        id,
        ...formData,
        image_url: formData.image_url?.trim() || undefined,
        game: formData.game as "magic" | "pokemon" | "onepiece" | "yugioh" | "other",
        format: formData.format as "swiss" | "single_elimination" | "round_robin" | "other",
        max_participants: formData.max_participants ? parseInt(formData.max_participants, 10) : undefined,
        min_participants: parseInt(formData.min_participants, 10) || 2,
        entry_fee: parseFloat(formData.entry_fee) || 0,
        registration_closes_minutes_before: parseInt(formData.registration_closes_minutes_before, 10) || 30,
      });
      router.push("/dashboard/tornei");
    } catch (err) {
      setErrors({ form: (err as Error).message });
    }
  };

  if (isLoading || !tournament) {
    return <div className="animate-pulse text-muted">Caricamento...</div>;
  }

  const store = tournament.store as { name?: string } | null;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/dashboard/tornei" className="text-muted hover:text-foreground text-sm mb-4 inline-block">
          ← Torna ai tornei
        </Link>
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="font-zentry text-3xl font-bold uppercase">{tournament.name}</h1>
          <Badge>{TOURNAMENT_STATUS_LABELS[tournament.status] ?? tournament.status}</Badge>
        </div>
        <p className="text-sm text-muted mt-1">
          {store?.name} • {formatDate(tournament.start_date)} {formatTime(tournament.start_time)}
        </p>
      </div>

      {/* Azioni e export */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-3">
          <Link href={`/dashboard/tornei/${id}/iscrizioni`}>
            <Button variant="outline">Gestisci iscrizioni</Button>
          </Link>
          <Link href={`/tornei/${id}/gruppo`}>
            <Button variant="outline">💬 Gruppo torneo</Button>
          </Link>
          {tournament.status === "draft" && (
            <Button
              variant="accent"
              isLoading={actions.publish.isPending}
              onClick={() => {
                actions.publish.mutate(id, {
                  onSuccess: () => {
                    sessionStorage.setItem(`tournament-${id}-just-published`, 'true');
                    setShowPublishedSuccess(true);
                  }
                });
              }}
            >
              Pubblica torneo
            </Button>
          )}
          {tournament.status === "published" && (
            <>
              <Button
                variant="outline"
                isLoading={actions.closeRegistrations.isPending}
                onClick={() => actions.closeRegistrations.mutate(id)}
              >
                Chiudi iscrizioni
              </Button>
              <Button
                variant="accent"
                isLoading={actions.start.isPending}
                onClick={() => actions.start.mutate(id)}
              >
                Avvia torneo
              </Button>
            </>
          )}
          {(tournament.status === "closed" || tournament.status === "in_progress") && (
            <Link href={`/dashboard/tornei/${id}/completa`}>
              <Button variant="accent">Completa torneo</Button>
            </Link>
          )}
        </div>

        {/* Podio: visibile quando il torneo è completato */}
        {tournament.status === "completed" && (tournament.results as { position: number; player_id: string }[] | null)?.length > 0 && (
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-6">
              <h3 className="font-robert font-bold text-sm uppercase tracking-wider text-accent mb-4">
                Podio
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((pos) => {
                  const res = (tournament.results as { position: number; player_id: string }[]).find((r) => r.position === pos);
                  const reg = (registrations ?? []).find((r) => r.player_id === res?.player_id);
                  const player = reg?.player as { nickname?: string | null; avatar_url?: string | null } | null;
                  const label = pos === 1 ? "1°" : pos === 2 ? "2°" : "3°";
                  return (
                    <div key={pos} className="flex items-center gap-3 p-3 rounded-xl bg-background/50">
                      <span className="font-zentry font-bold text-accent w-8">{label}</span>
                      <Avatar src={player?.avatar_url ?? undefined} fallback={player?.nickname ?? "?"} size="sm" />
                      <span className="font-medium">{player?.nickname ?? "Giocatore"}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted mt-3">Per modificare i risultati, contatta il supporto o crea un nuovo torneo.</p>
            </CardContent>
          </Card>
        )}

        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
          <h3 className="font-robert font-bold text-sm uppercase tracking-wider text-muted mb-4">
            Scarica per social
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-foreground/80">Story (9:16)</p>
              <ExportSocial tournament={tournament} format="story" compact />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-foreground/80">Post (1:1)</p>
              <ExportSocial tournament={tournament} format="post" compact />
            </div>
          </div>
          <p className="text-xs text-muted mt-3">Il template verrà migliorato in seguito.</p>
        </div>
      </div>

      {/* Form modifica - sempre visibile */}
      <form onSubmit={handleSubmit} className="space-y-6">
          <Select
            label="Sede *"
            value={formData.store_id}
            onChange={(e) => handleChange("store_id", e.target.value)}
            options={(stores ?? []).map((s) => ({ value: s.id, label: s.name }))}
          />

          <Input
            label="Nome torneo *"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            error={errors.name}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Gioco *"
              value={formData.game}
              onChange={(e) => handleChange("game", e.target.value)}
              options={GAMES.map((g) => ({ value: g.value, label: g.label }))}
            />
            <Select
              label="Formato *"
              value={formData.format}
              onChange={(e) => handleChange("format", e.target.value)}
              options={FORMATS.map((f) => ({ value: f.value, label: f.label }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              label="Data inizio *"
              value={formData.start_date}
              onChange={(v) => handleChange("start_date", v)}
              error={errors.start_date}
            />
            <Input
              label="Ora inizio"
              type="time"
              value={formData.start_time}
              onChange={(e) => handleChange("start_time", e.target.value)}
            />
          </div>

          <ImageUpload
            label="Immagine torneo"
            value={formData.image_url}
            onChange={(url) => handleChange("image_url", url)}
            bucket="tournament-images"
            folderId={id}
          />
          <div>
            <label className="block text-sm font-robert font-medium text-foreground mb-1.5">Descrizione</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Descrizione del torneo..."
              className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent font-robert text-sm resize-none min-h-[100px]"
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-robert font-medium text-foreground mb-1.5">Regolamento</label>
            <textarea
              value={formData.rules}
              onChange={(e) => handleChange("rules", e.target.value)}
              placeholder="Regole del torneo..."
              className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent font-robert text-sm resize-none min-h-[80px]"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-robert font-medium text-foreground mb-1.5">Premi</label>
            <textarea
              value={formData.prizes}
              onChange={(e) => handleChange("prizes", e.target.value)}
              placeholder="Premi in palio..."
              className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent font-robert text-sm resize-none min-h-[80px]"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Max partecipanti"
              type="number"
              min="2"
              value={formData.max_participants}
              onChange={(e) => handleChange("max_participants", e.target.value)}
            />
            <Input
              label="Min partecipanti"
              type="number"
              min="2"
              value={formData.min_participants}
              onChange={(e) => handleChange("min_participants", e.target.value)}
            />
            <Input
              label="Costo (€)"
              type="number"
              min="0"
              step="0.01"
              value={formData.entry_fee}
              onChange={(e) => handleChange("entry_fee", e.target.value)}
            />
          </div>

          {errors.form && (
            <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">{errors.form}</p>
          )}

          {registrations && registrations.length > 0 && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-xs text-blue-200">
                ℹ️ Tutti gli iscritti ({registrations.length}) riceveranno una notifica delle modifiche.
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" variant="accent" isLoading={updateTournament.isPending}>
              Salva modifiche
            </Button>
            <Link href="/dashboard/tornei">
              <Button type="button" variant="outline">
                Annulla
              </Button>
            </Link>
          </div>
        </form>

      {/* Modale successo pubblicazione */}
      <Modal
        isOpen={showPublishedSuccess}
        onClose={() => setShowPublishedSuccess(false)}
        title="🎉 Torneo pubblicato!"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-foreground">
            Il tuo torneo <strong>{tournament?.name}</strong> è ora visibile pubblicamente!
          </p>
          <div className="space-y-2">
            <Button
              variant="accent"
              className="w-full"
              onClick={() => {
                const url = `${window.location.origin}/tornei/${id}`;
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? "✓ Link copiato!" : "📋 Copia link torneo"}
            </Button>
            <Link href={`/tornei/${id}`}>
              <Button variant="outline" className="w-full">
                👁️ Vedi pagina pubblica
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted text-center">
            Condividi il link sui social o scarica la locandina qui sopra!
          </p>
        </div>
      </Modal>
    </div>
  );
}
