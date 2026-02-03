"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { RecurringSchedule } from "@/types/database";
import type { RecurringFrequency } from "@/types/database";

export function useRecurringSchedules(ownerId: string | undefined) {
  const supabase = createClient();

  const query = useQuery({
    queryKey: ["recurring-schedules", ownerId],
    queryFn: async () => {
      if (!ownerId) return [];
      const { data: stores } = await supabase.from("stores").select("id").eq("owner_id", ownerId);
      const storeIds = stores?.map((s) => s.id) ?? [];
      if (storeIds.length === 0) return [];
      const { data, error } = await supabase
        .from("recurring_schedules")
        .select("*")
        .in("store_id", storeIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as RecurringSchedule[];
    },
    enabled: !!ownerId,
  });

  return query;
}

export interface CreateRecurringInput {
  store_id: string;
  name: string;
  template: Record<string, unknown>;
  frequency: RecurringFrequency;
  day_of_week: number | null;
  day_of_month: number | null;
  time: string;
}

export function useCreateRecurringSchedule(ownerId: string | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: CreateRecurringInput) => {
      if (!ownerId) throw new Error("Non autenticato");
      const { data, error } = await supabase
        .from("recurring_schedules")
        .insert({
          store_id: input.store_id,
          name: input.name.trim(),
          template: input.template,
          frequency: input.frequency,
          day_of_week: input.day_of_week,
          day_of_month: input.day_of_month,
          time: input.time,
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data as RecurringSchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-schedules", ownerId] });
    },
  });

  return mutation;
}

export function useGenerateNextTournament(ownerId: string | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      if (!ownerId) throw new Error("Non autenticato");

      const { data: schedule, error: sErr } = await supabase
        .from("recurring_schedules")
        .select("*, store:stores!inner(owner_id)")
        .eq("id", scheduleId)
        .single();
      if (sErr || !schedule) throw sErr || new Error("Ricorrenza non trovata");

      const store = schedule.store as { owner_id: string };
      if (store.owner_id !== ownerId) throw new Error("Non autorizzato");

      const t = schedule.template as Record<string, unknown>;
      const time = (schedule.time as string) || "18:00";
      const frequency = schedule.frequency as string;
      const dayOfWeek = schedule.day_of_week as number | null;
      const dayOfMonth = schedule.day_of_month as number | null;

      const nextDate = computeNextOccurrence(frequency, dayOfWeek, dayOfMonth);
      if (!nextDate) throw new Error("Impossibile calcolare la prossima data");

      const { data: tournament, error } = await supabase
        .from("tournaments")
        .insert({
          store_id: schedule.store_id,
          name: (t.name as string) || schedule.name,
          game: (t.game as string) || "magic",
          format: (t.format as string) || "swiss",
          start_date: nextDate,
          start_time: time,
          description: (t.description as string) || null,
          rules: (t.rules as string) || null,
          prizes: (t.prizes as string) || null,
          image_url: (t.image_url as string) || null,
          max_participants: (t.max_participants as number) ?? null,
          min_participants: (t.min_participants as number) ?? 2,
          entry_fee: (t.entry_fee as number) ?? 0,
          registration_closes_minutes_before: (t.registration_closes_minutes_before as number) ?? 30,
          is_recurring: true,
          recurring_schedule_id: scheduleId,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from("recurring_schedules")
        .update({ next_occurrence: nextDate })
        .eq("id", scheduleId);

      return tournament;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-schedules", ownerId] });
      queryClient.invalidateQueries({ queryKey: ["owner-tournaments", ownerId] });
    },
  });

  return mutation;
}

function computeNextOccurrence(
  frequency: string,
  dayOfWeek: number | null,
  dayOfMonth: number | null
): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (frequency === "weekly" && dayOfWeek != null) {
    const diff = (dayOfWeek - today.getDay() + 7) % 7;
    const next = new Date(today);
    next.setDate(next.getDate() + (diff === 0 ? 7 : diff));
    return next.toISOString().slice(0, 10);
  }

  if (frequency === "biweekly" && dayOfWeek != null) {
    const diff = (dayOfWeek - today.getDay() + 7) % 7;
    const next = new Date(today);
    next.setDate(next.getDate() + (diff === 0 ? 14 : diff + 7));
    return next.toISOString().slice(0, 10);
  }

  if (frequency === "monthly" && dayOfMonth != null) {
    const next = new Date(today.getFullYear(), today.getMonth(), Math.min(dayOfMonth, 28));
    if (next <= today) {
      next.setMonth(next.getMonth() + 1);
    }
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(dayOfMonth, lastDay));
    return next.toISOString().slice(0, 10);
  }

  return null;
}

export function useDeleteRecurringSchedule(ownerId: string | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      if (!ownerId) throw new Error("Non autenticato");
      const { error } = await supabase.from("recurring_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-schedules", ownerId] });
    },
  });

  return mutation;
}
