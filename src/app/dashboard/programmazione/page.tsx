"use client";

import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useStores } from "@/hooks/useStores";
import { useRecurringSchedules, useGenerateNextTournament, useDeleteRecurringSchedule } from "@/hooks/useRecurringSchedules";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { RECURRING_FREQUENCIES, DAYS_OF_WEEK } from "@/lib/constants";

export default function ProgrammazionePage() {
  const { owner } = useUser();
  const { data: stores } = useStores(owner?.id);
  const { data: schedules, isLoading } = useRecurringSchedules(owner?.id);
  const generateNext = useGenerateNextTournament(owner?.id);
  const deleteSchedule = useDeleteRecurringSchedule(owner?.id);

  const freqLabel = (f: string) => RECURRING_FREQUENCIES.find((x) => x.value === f)?.label ?? f;
  const dayLabel = (d: number | null) => (d != null ? DAYS_OF_WEEK.find((x) => x.value === d)?.label ?? "" : "");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-zentry text-3xl font-bold uppercase">Programmazione ricorrente</h1>
        <p className="text-muted mt-2">
          Le ricorrenze si creano quando crei un torneo con &quot;Torneo ricorrente&quot; attivo. Qui puoi generare il prossimo torneo da ogni ricorrenza.
        </p>
        <Link href="/dashboard/tornei/nuovo" className="inline-block mt-4">
          <Button variant="accent">Nuovo torneo (con ricorrenza)</Button>
        </Link>
      </div>

      {!stores?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted mb-4">Crea prima una sede.</p>
            <Link href="/dashboard/sedi/nuova">
              <Button variant="accent">Crea sede</Button>
            </Link>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="animate-pulse text-muted">Caricamento...</div>
      ) : !schedules || schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted mb-4">Nessuna ricorrenza attiva.</p>
            <p className="text-sm text-muted mb-4">
              Crea un torneo e spunta &quot;Torneo ricorrente&quot; per definire una ricorrenza settimanale, bisettimanale o mensile.
            </p>
            <Link href="/dashboard/tornei/nuovo">
              <Button variant="outline">Vai a Nuovo torneo</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {schedules.filter((s) => s.is_active).map((s) => (
            <Card key={s.id}>
              <CardHeader className="flex flex-row justify-between items-start">
                <div>
                  <h3 className="font-robert font-bold text-lg">{s.name}</h3>
                  <p className="text-sm text-muted mt-1">
                    {freqLabel(s.frequency)}
                    {s.frequency !== "monthly" && s.day_of_week != null && ` • ${dayLabel(s.day_of_week)}`}
                    {s.frequency === "monthly" && s.day_of_month != null && ` • Giorno ${s.day_of_month}`}
                    {` • ore ${(s.time as string)?.slice(0, 5) ?? "18:00"}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="accent"
                    size="sm"
                    isLoading={generateNext.isPending}
                    onClick={() => generateNext.mutate(s.id)}
                  >
                    Genera prossimo torneo
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400"
                    onClick={() => window.confirm("Eliminare questa ricorrenza?") && deleteSchedule.mutate(s.id)}
                  >
                    Elimina
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {s.next_occurrence && (
                  <p className="text-sm text-muted">
                    Prossima data prevista: {new Date(s.next_occurrence).toLocaleDateString("it-IT")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
