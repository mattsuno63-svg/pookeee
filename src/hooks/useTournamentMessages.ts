"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { TournamentMessage } from "@/types/database";

export interface TournamentMessageWithAuthor extends TournamentMessage {
  author: { id: string; nickname: string | null; avatar_url: string | null };
}

export function useTournamentMessages(tournamentId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["tournament-messages", tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];
      const { data, error } = await supabase
        .from("tournament_messages")
        .select(`
          *,
          author:profiles!author_id(id, nickname, avatar_url)
        `)
        .eq("tournament_id", tournamentId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as TournamentMessageWithAuthor[];
    },
    enabled: !!tournamentId,
  });
}

export function usePostTournamentMessage(tournamentId: string | null) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string) => {
      if (!tournamentId) throw new Error("Tournament non specificato");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Devi effettuare il login");

      const { data: msg, error } = await supabase
        .from("tournament_messages")
        .insert({
          tournament_id: tournamentId,
          author_id: user.id,
          message: message.trim(),
        })
        .select()
        .single();
      if (error) throw error;

      await supabase.rpc("notify_tournament_participants", {
        p_tournament_id: tournamentId,
        p_title: "Nuovo messaggio nel gruppo torneo",
        p_message: message.trim().slice(0, 100) + (message.trim().length > 100 ? "..." : ""),
        p_data: { tournament_id: tournamentId, message_id: msg.id },
      });

      return msg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-messages", tournamentId] });
    },
  });
}
