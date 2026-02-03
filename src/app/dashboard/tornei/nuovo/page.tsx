"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useStores } from "@/hooks/useStores";
import { useCreateTournament } from "@/hooks/useTournaments";
import { useTemplate, useCreateTemplate } from "@/hooks/useTemplates";
import { useCreateRecurringSchedule } from "@/hooks/useRecurringSchedules";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { Modal } from "@/components/ui/Modal";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { GAMES, FORMATS, DAYS_OF_WEEK, RECURRING_FREQUENCIES } from "@/lib/constants";

const defaultFormData = {
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
};

export default function NuovoTorneoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");

  const { owner } = useUser();
  const { data: stores } = useStores(owner?.id);
  const { data: template } = useTemplate(templateId);
  const createTournament = useCreateTournament(owner?.id);
  const createTemplate = useCreateTemplate(owner?.id);
  const createRecurring = useCreateRecurringSchedule(owner?.id);

  const [formData, setFormData] = useState({
    ...defaultFormData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [recurringDayOfWeek, setRecurringDayOfWeek] = useState(5);
  const [recurringDayOfMonth, setRecurringDayOfMonth] = useState(15);

  useEffect(() => {
    if (stores?.length && !formData.store_id) {
      setFormData((p) => ({ ...p, store_id: stores[0].id }));
    }
  }, [stores, formData.store_id]);

  useEffect(() => {
    if (template?.template && typeof template.template === "object" && stores?.length) {
      const t = template.template as Record<string, unknown>;
      const validStoreId = t.store_id && stores.some((s) => s.id === t.store_id) ? (t.store_id as string) : undefined;
      setFormData((p) => ({
        ...p,
        store_id: validStoreId || p.store_id,
        name: (t.name as string) || p.name,
        game: (t.game as string) || "magic",
        format: (t.format as string) || "swiss",
        start_time: (t.start_time as string) || "18:00",
        description: (t.description as string) ?? "",
        rules: (t.rules as string) ?? "",
        prizes: (t.prizes as string) ?? "",
        max_participants: t.max_participants != null ? String(t.max_participants) : "",
        min_participants: t.min_participants != null ? String(t.min_participants) : "2",
        entry_fee: t.entry_fee != null ? String(t.entry_fee) : "0",
        registration_closes_minutes_before: t.registration_closes_minutes_before != null ? String(t.registration_closes_minutes_before) : "30",
        image_url: (t.image_url as string) ?? "",
      }));
    }
  }, [template]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const buildTemplatePayload = () => ({
    store_id: formData.store_id,
    name: formData.name,
    game: formData.game,
    format: formData.format,
    start_time: formData.start_time,
    description: formData.description || undefined,
    rules: formData.rules || undefined,
    prizes: formData.prizes || undefined,
    max_participants: formData.max_participants ? parseInt(formData.max_participants, 10) : undefined,
    min_participants: parseInt(formData.min_participants, 10) || 2,
    entry_fee: parseFloat(formData.entry_fee) || 0,
    registration_closes_minutes_before: parseInt(formData.registration_closes_minutes_before, 10) || 30,
    image_url: formData.image_url?.trim() || undefined,
  });

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;
    try {
      await createTemplate.mutateAsync({
        name: templateName.trim(),
        template: buildTemplatePayload(),
      });
      setShowTemplateModal(false);
      setTemplateName("");
    } catch (err) {
      setErrors({ form: (err as Error).message });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!formData.store_id) {
      setErrors({ store_id: "Seleziona una sede" });
      return;
    }
    if (!formData.name.trim()) {
      setErrors({ name: "Il nome è obbligatorio" });
      return;
    }
    if (!formData.start_date) {
      setErrors({ start_date: "La data è obbligatoria" });
      return;
    }
    try {
      let recurringScheduleId: string | null = null;

      if (isRecurring) {
        const schedule = await createRecurring.mutateAsync({
          store_id: formData.store_id,
          name: formData.name,
          template: buildTemplatePayload(),
          frequency: recurringFrequency,
          day_of_week: recurringFrequency !== "monthly" ? recurringDayOfWeek : null,
          day_of_month: recurringFrequency === "monthly" ? recurringDayOfMonth : null,
          time: formData.start_time,
        });
        recurringScheduleId = schedule.id;
      }

      const t = await createTournament.mutateAsync({
        store_id: formData.store_id,
        name: formData.name,
        game: formData.game as "magic" | "pokemon" | "onepiece" | "yugioh" | "other",
        format: formData.format as "swiss" | "single_elimination" | "round_robin" | "other",
        start_date: formData.start_date,
        start_time: formData.start_time,
        image_url: formData.image_url?.trim() || undefined,
        description: formData.description || undefined,
        rules: formData.rules || undefined,
        prizes: formData.prizes || undefined,
        max_participants: formData.max_participants ? parseInt(formData.max_participants, 10) : undefined,
        min_participants: parseInt(formData.min_participants, 10) || 2,
        entry_fee: parseFloat(formData.entry_fee) || 0,
        registration_closes_minutes_before: parseInt(formData.registration_closes_minutes_before, 10) || 30,
        is_recurring: isRecurring,
        recurring_schedule_id: recurringScheduleId,
      });
      router.push(`/dashboard/tornei/${t.id}`);
    } catch (err) {
      setErrors({ form: (err as Error).message });
    }
  };

  if (!stores?.length) {
    return (
      <div>
        <p className="text-muted mb-4">Devi creare almeno una sede prima di creare un torneo.</p>
        <Link href="/dashboard/sedi/nuova">
          <Button variant="accent">Crea sede</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <Link href="/dashboard/tornei" className="text-muted hover:text-foreground text-sm mb-4 inline-block">
          ← Torna ai tornei
        </Link>
        <h1 className="font-zentry text-3xl font-bold uppercase">Nuovo torneo</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Sede *"
          value={formData.store_id}
          onChange={(e) => handleChange("store_id", e.target.value)}
          options={stores.map((s) => ({ value: s.id, label: s.name }))}
          error={errors.store_id}
        />

        <Input
          label="Nome torneo *"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="es. Standard Friday"
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
            min={new Date().toISOString().slice(0, 10)}
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
        />
        <Input
          label="Descrizione"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Breve descrizione"
        />
        <Input
          label="Regolamento"
          value={formData.rules}
          onChange={(e) => handleChange("rules", e.target.value)}
        />
        <Input
          label="Premi"
          value={formData.prizes}
          onChange={(e) => handleChange("prizes", e.target.value)}
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Max partecipanti"
            type="number"
            min="2"
            value={formData.max_participants}
            onChange={(e) => handleChange("max_participants", e.target.value)}
            placeholder="Illimitato"
          />
          <Input
            label="Min partecipanti"
            type="number"
            min="2"
            value={formData.min_participants}
            onChange={(e) => handleChange("min_participants", e.target.value)}
          />
          <div>
            <label className="block text-sm font-robert font-medium mb-1.5">
              Costo iscrizione (€)
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const current = parseFloat(formData.entry_fee) || 0;
                  setFormData(p => ({ ...p, entry_fee: Math.max(0, current - 0.50).toFixed(2) }));
                }}
                className="w-10 h-10 p-0"
              >
                -
              </Button>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.entry_fee}
                onChange={(e) => handleChange("entry_fee", e.target.value)}
                className="text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const current = parseFloat(formData.entry_fee) || 0;
                  setFormData(p => ({ ...p, entry_fee: (current + 0.50).toFixed(2) }));
                }}
                className="w-10 h-10 p-0"
              >
                +
              </Button>
            </div>
          </div>
        </div>

        <Input
          label="Chiudi iscrizioni X min prima"
          type="number"
          min="0"
          value={formData.registration_closes_minutes_before}
          onChange={(e) => handleChange("registration_closes_minutes_before", e.target.value)}
        />

        <div className="rounded-lg border border-border p-4 space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded border-border bg-foreground/5 text-accent focus:ring-accent"
            />
            <span className="font-robert font-medium">Torneo ricorrente</span>
          </label>
          {isRecurring && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
              <Select
                label="Frequenza"
                value={recurringFrequency}
                onChange={(e) => setRecurringFrequency(e.target.value as "weekly" | "biweekly" | "monthly")}
                options={RECURRING_FREQUENCIES.map((f) => ({ value: f.value, label: f.label }))}
              />
              {recurringFrequency !== "monthly" ? (
                <Select
                  label="Giorno della settimana"
                  value={String(recurringDayOfWeek)}
                  onChange={(e) => setRecurringDayOfWeek(parseInt(e.target.value, 10))}
                  options={DAYS_OF_WEEK.map((d) => ({ value: String(d.value), label: d.label }))}
                />
              ) : (
                <Input
                  label="Giorno del mese (1-31)"
                  type="number"
                  min="1"
                  max="31"
                  value={String(recurringDayOfMonth)}
                  onChange={(e) => setRecurringDayOfMonth(parseInt(e.target.value, 10) || 1)}
                />
              )}
              <p className="text-sm text-muted sm:col-span-2">
                Il primo torneo userà la data selezionata sopra. Le ricorrenze successive verranno create dalla Programmazione.
              </p>
            </div>
          )}
        </div>

        {errors.form && (
          <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">{errors.form}</p>
        )}

        <div className="flex flex-wrap gap-4 items-center">
          <Button type="submit" variant="accent" isLoading={createTournament.isPending || createRecurring.isPending}>
            Crea torneo
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowTemplateModal(true)}
            isLoading={createTemplate.isPending}
          >
            Crea template
          </Button>
          <Link href="/dashboard/tornei">
            <Button type="button" variant="outline">
              Annulla
            </Button>
          </Link>
        </div>
      </form>

      <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="Salva come template">
        <form onSubmit={handleSaveTemplate} className="space-y-4">
          <Input
            label="Nome template"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="es. Standard Friday"
            required
          />
          <p className="text-sm text-muted">
            Salverai le impostazioni attuali (gioco, formato, regole, premi, ecc.) per riutilizzarle creando nuovi tornei.
          </p>
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowTemplateModal(false)}>
              Annulla
            </Button>
            <Button type="submit" variant="accent" isLoading={createTemplate.isPending}>
              Salva template
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
