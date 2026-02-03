"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Tournament, TournamentWithStore, CreateTournamentInput } from "@/types/database";
import type { GameType, TournamentFormat, TournamentStatus } from "@/types/database";

export type TournamentFilters = {
  game?: GameType;
  city?: string;
  fromDate?: string;
  toDate?: string;
  status?: TournamentStatus;
  storeId?: string;
};

export function useTournamentsForStore(storeId: string | undefined) {
  const result = useQuery({
    queryKey: ["tournaments-store", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tournaments")
        .select("*, store:stores(*)")
        .eq("store_id", storeId)
        .in("status", ["published", "closed", "in_progress", "completed"])
        .order("start_date", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data as TournamentWithStore[];
    },
    enabled: !!storeId,
  });
  return result;
}

export function useTournaments(filters?: TournamentFilters) {
  const supabase = createClient();

  const query = useQuery({
    queryKey: ["tournaments", filters ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("tournaments")
        .select("*, store:stores(*)")
        .in("status", ["published", "closed", "in_progress"])
        .order("start_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (filters?.game) q = q.eq("game", filters.game);
      if (filters?.fromDate) q = q.gte("start_date", filters.fromDate);
      if (filters?.toDate) q = q.lte("start_date", filters.toDate);
      if (filters?.storeId) q = q.eq("store_id", filters.storeId);

      // City filter: fetch and filter client-side (Supabase nested filter varies by version)

      const { data, error } = await q;
      if (error) throw error;
      let result = (data ?? []) as TournamentWithStore[];
      if (filters?.city) {
        const cityLower = filters.city.toLowerCase().trim();
        result = result.filter((t) => (t.store?.city ?? "").toLowerCase().includes(cityLower));
      }
      return result;
    },
  });

  return query;
}

export function useOwnerTournaments(ownerId: string | undefined) {
  const supabase = createClient();

  const query = useQuery({
    queryKey: ["owner-tournaments", ownerId],
    queryFn: async () => {
      if (!ownerId) return [];
      const { data: stores } = await supabase.from("stores").select("id").eq("owner_id", ownerId);
      const storeIds = stores?.map((s) => s.id) ?? [];
      if (storeIds.length === 0) return [];
      const { data, error } = await supabase
        .from("tournaments")
        .select("*, store:stores(*)")
        .in("store_id", storeIds)
        .order("start_date", { ascending: false })
        .order("start_time", { ascending: false });
      if (error) throw error;
      return data as TournamentWithStore[];
    },
    enabled: !!ownerId,
  });

  return query;
}

export function useTournament(id: string | null) {
  const supabase = createClient();

  const query = useQuery({
    queryKey: ["tournament", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("tournaments")
        .select("*, store:stores(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as TournamentWithStore;
    },
    enabled: !!id,
  });

  return query;
}

export function useCreateTournament(ownerId: string | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: CreateTournamentInput) => {
      if (!ownerId) throw new Error("Non autenticato");
      const { data, error } = await supabase
        .from("tournaments")
        .insert({
          store_id: input.store_id,
          name: input.name.trim(),
          game: input.game,
          format: input.format,
          start_date: input.start_date,
          start_time: input.start_time,
          description: input.description?.trim() || null,
          rules: input.rules?.trim() || null,
          prizes: input.prizes?.trim() || null,
          image_url: input.image_url?.trim() || null,
          max_participants: input.max_participants ?? null,
          min_participants: input.min_participants ?? 2,
          entry_fee: input.entry_fee ?? 0,
          registration_closes_minutes_before: input.registration_closes_minutes_before ?? 30,
          is_recurring: input.is_recurring ?? false,
          recurring_schedule_id: input.recurring_schedule_id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      await supabase.rpc("notify_admins", {
        p_type: "tournament_created",
        p_title: "Nuovo torneo creato",
        p_message: `${(data as Tournament).name} – in bozza`,
        p_data: { tournament_id: (data as Tournament).id },
      });
      return data as Tournament;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-tournaments", ownerId] });
    },
  });

  return mutation;
}

export function useUpdateTournament(ownerId: string | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateTournamentInput> & { id: string }) => {
      if (!ownerId) throw new Error("Non autenticato");
      const updates: Record<string, unknown> = {};
      if (input.store_id !== undefined) updates.store_id = input.store_id;
      if (input.name !== undefined) updates.name = input.name.trim();
      if (input.game !== undefined) updates.game = input.game;
      if (input.format !== undefined) updates.format = input.format;
      if (input.start_date !== undefined) updates.start_date = input.start_date;
      if (input.start_time !== undefined) updates.start_time = input.start_time;
      if (input.description !== undefined) updates.description = input.description?.trim() || null;
      if (input.rules !== undefined) updates.rules = input.rules?.trim() || null;
      if (input.prizes !== undefined) updates.prizes = input.prizes?.trim() || null;
      if (input.image_url !== undefined) updates.image_url = input.image_url?.trim() || null;
      if (input.max_participants !== undefined) updates.max_participants = input.max_participants;
      if (input.min_participants !== undefined) updates.min_participants = input.min_participants;
      if (input.entry_fee !== undefined) updates.entry_fee = input.entry_fee;
      if (input.registration_closes_minutes_before !== undefined)
        updates.registration_closes_minutes_before = input.registration_closes_minutes_before;

      const { data, error } = await supabase
        .from("tournaments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      if (data?.name) {
        await supabase.rpc("notify_tournament_participants", {
          p_tournament_id: id,
          p_title: "Torneo aggiornato",
          p_message: `Il torneo "${data.name}" è stato aggiornato. Controlla data, orari e dettagli.`,
          p_data: { tournament_id: id },
          p_type: "tournament_updated",
        });
      }
      return data as Tournament;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["owner-tournaments", ownerId] });
      queryClient.invalidateQueries({ queryKey: ["tournament", id] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });

  return mutation;
}

export function useTournamentActions(ownerId: string | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const publish = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("tournaments")
        .update({ status: "published" })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await supabase.rpc("notify_admins", {
        p_type: "tournament_published",
        p_title: "Torneo pubblicato",
        p_message: data?.name ? `${data.name} – iscrizioni aperte` : "Un torneo è stato pubblicato",
        p_data: { tournament_id: id },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-tournaments", ownerId] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });

  const start = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("tournaments")
        .update({ status: "in_progress" })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await supabase.rpc("notify_admins", {
        p_type: "tournament_started",
        p_title: "Torneo avviato",
        p_message: data?.name ? `${data.name} – in corso` : "Un torneo è stato avviato",
        p_data: { tournament_id: id },
      });
      await supabase.rpc("notify_tournament_participants", {
        p_tournament_id: id,
        p_title: "Torneo avviato",
        p_message: data?.name ? `Il torneo "${data.name}" è iniziato!` : "Il torneo è iniziato.",
        p_data: { tournament_id: id },
        p_type: "tournament_updated",
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-tournaments", ownerId] });
    },
  });

  const closeRegistrations = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("tournaments")
        .update({ status: "closed" })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await supabase.rpc("notify_tournament_participants", {
        p_tournament_id: id,
        p_title: "Iscrizioni chiuse",
        p_message: data?.name ? `Le iscrizioni per "${data.name}" sono state chiuse.` : "Le iscrizioni del torneo sono state chiuse.",
        p_data: { tournament_id: id },
        p_type: "tournament_updated",
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-tournaments", ownerId] });
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("tournaments")
        .update({ status: "cancelled" })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await supabase.rpc("notify_tournament_participants", {
        p_tournament_id: id,
        p_title: "Torneo annullato",
        p_message: data?.name ? `Il torneo "${data.name}" è stato annullato.` : "Il torneo è stato annullato.",
        p_data: { tournament_id: id },
        p_type: "tournament_updated",
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-tournaments", ownerId] });
    },
  });

  const complete = useMutation({
    mutationFn: async ({ id, results }: { id: string; results: { position: number; player_id: string; points: number }[] }) => {
      const { data, error } = await supabase.rpc("complete_tournament", {
        p_tournament_id: id,
        p_results: results,
      });
      if (error) throw error;
      const { data: t } = await supabase.from("tournaments").select("*").eq("id", id).single();
      if (t?.name) {
        await supabase.rpc("notify_tournament_participants", {
          p_tournament_id: id,
          p_title: "Torneo concluso",
          p_message: `Il torneo "${t.name}" è concluso. Controlla i risultati e il podio!`,
          p_data: { tournament_id: id },
          p_type: "tournament_updated",
        });
      }
      return t;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["owner-tournaments", ownerId] });
      queryClient.invalidateQueries({ queryKey: ["tournament", id] });
      queryClient.invalidateQueries({ queryKey: ["registrations", id] });
    },
  });

  return { publish, start, closeRegistrations, cancel, complete };
}
