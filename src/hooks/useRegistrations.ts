"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Registration } from "@/types/database";

export interface RegistrationWithPlayer extends Registration {
  player: { id: string; nickname: string | null; avatar_url: string | null };
}

export function useRegistrations(tournamentId: string | null) {
  const supabase = createClient();

  const query = useQuery({
    queryKey: ["registrations", tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];
      const { data, error } = await supabase
        .from("registrations")
        .select(`
          *,
          player:profiles!player_id(id, nickname, avatar_url)
        `)
        .eq("tournament_id", tournamentId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as RegistrationWithPlayer[];
    },
    enabled: !!tournamentId,
  });

  return query;
}

export function useMyRegistrations(playerId: string | undefined) {
  const supabase = createClient();

  const query = useQuery({
    queryKey: ["my-registrations", playerId],
    queryFn: async () => {
      if (!playerId) return [];
      const { data, error } = await supabase
        .from("registrations")
        .select(`
          *,
          tournament:tournaments(*, store:stores(*))
        `)
        .eq("player_id", playerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!playerId,
  });

  return query;
}

export function useRegisterForTournament(playerId: string | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      if (!playerId) throw new Error("Devi effettuare il login per iscriverti");

      // Controlla se esiste già una registrazione (anche withdrawn/cancelled)
      const { data: existing } = await supabase
        .from("registrations")
        .select("id")
        .eq("tournament_id", tournamentId)
        .eq("player_id", playerId)
        .maybeSingle();

      let data;
      if (existing) {
        const { data: updated, error } = await supabase
          .from("registrations")
          .update({ status: "pending", payment_status: "pending" })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        data = updated;
      } else {
        const { data: inserted, error } = await supabase
          .from("registrations")
          .insert({
            tournament_id: tournamentId,
            player_id: playerId,
            status: "pending",
            payment_status: "pending",
          })
          .select()
          .single();
        if (error) throw error;
        data = inserted;
      }

      const { data: tournament } = await supabase
        .from("tournaments")
        .select("store_id")
        .eq("id", tournamentId)
        .single();

      if (tournament?.store_id) {
        const { data: store } = await supabase.from("stores").select("owner_id").eq("id", tournament.store_id).single();
        if (store?.owner_id) {
          await supabase.from("notifications").insert({
            user_id: store.owner_id,
            type: "new_registration",
            title: "Nuova iscrizione",
            message: "Un giocatore si è iscritto a un torneo",
            data: { tournament_id: tournamentId, player_id: playerId },
          });
        }
      }

      return data;
    },
    onSuccess: (_, tournamentId) => {
      queryClient.invalidateQueries({ queryKey: ["registrations", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["my-registrations", playerId] });
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
    },
  });

  return mutation;
}

export function useUpdateRegistration() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      status,
      payment_status,
      paid_at,
    }: {
      id: string;
      status?: string;
      payment_status?: string;
      paid_at?: string | null;
    }) => {
      const updates: Record<string, unknown> = {};
      if (status !== undefined) updates.status = status;
      if (payment_status !== undefined) updates.payment_status = payment_status;
      if (paid_at !== undefined) updates.paid_at = paid_at;
      if (status === "present") updates.checked_in_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("registrations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["registrations", data.tournament_id] });
    },
  });

  return mutation;
}

export function useBulkCheckIn(tournamentId: string | null) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!tournamentId) throw new Error("Torneo non specificato");
      const { data, error } = await supabase.rpc("bulk_checkin_tournament", {
        p_tournament_id: tournamentId,
      });
      if (error) throw error;
      return data as { success: boolean; count: number };
    },
    onSuccess: (_, tournamentId) => {
      queryClient.invalidateQueries({ queryKey: ["registrations", tournamentId] });
    },
  });

  return mutation;
}

export function useWithdrawRegistration(playerId: string | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ registrationId, tournamentId }: { registrationId: string; tournamentId: string }) => {
      if (!playerId) throw new Error("Non autenticato");
      const { error } = await supabase
        .from("registrations")
        .update({ status: "withdrawn" })
        .eq("id", registrationId)
        .eq("player_id", playerId);
      if (error) throw error;

      // Notifica al commerciante
      const { data: tournament } = await supabase
        .from("tournaments")
        .select("store_id, name")
        .eq("id", tournamentId)
        .single();
      if (tournament?.store_id) {
        const { data: store } = await supabase
          .from("stores")
          .select("owner_id")
          .eq("id", tournament.store_id)
          .single();
        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", playerId)
          .single();
        const nick = (profile?.nickname as string) ?? "Un giocatore";
        if (store?.owner_id) {
          await supabase.from("notifications").insert({
            user_id: store.owner_id,
            type: "registration_withdrawn",
            title: "Disiscrizione",
            message: `${nick} si è disiscritto da "${tournament.name}"`,
            data: { tournament_id: tournamentId, player_id: playerId },
          });
        }
      }
    },
    onSuccess: (_, { tournamentId }) => {
      queryClient.invalidateQueries({ queryKey: ["registrations", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["my-registrations", playerId] });
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
    },
  });

  return mutation;
}

export function useDeleteRegistration() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: reg } = await supabase.from("registrations").select("tournament_id").eq("id", id).single();
      const { error } = await supabase.from("registrations").delete().eq("id", id);
      if (error) throw error;
      return reg?.tournament_id;
    },
    onSuccess: (tournamentId) => {
      if (tournamentId) queryClient.invalidateQueries({ queryKey: ["registrations", tournamentId] });
    },
  });

  return mutation;
}
