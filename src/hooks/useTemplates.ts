"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { TournamentTemplate } from "@/types/database";

export function useTemplate(id: string | null) {
  const supabase = createClient();

  const query = useQuery({
    queryKey: ["template", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("tournament_templates")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as TournamentTemplate;
    },
    enabled: !!id,
  });

  return query;
}

export function useTemplates(ownerId: string | undefined) {
  const supabase = createClient();

  const query = useQuery({
    queryKey: ["templates", ownerId],
    queryFn: async () => {
      if (!ownerId) return [];
      const { data, error } = await supabase
        .from("tournament_templates")
        .select("*")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TournamentTemplate[];
    },
    enabled: !!ownerId,
  });

  return query;
}

export function useCreateTemplate(ownerId: string | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ name, template }: { name: string; template: Record<string, unknown> }) => {
      if (!ownerId) throw new Error("Non autenticato");
      const { data, error } = await supabase
        .from("tournament_templates")
        .insert({ owner_id: ownerId, name: name.trim(), template })
        .select()
        .single();
      if (error) throw error;
      return data as TournamentTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", ownerId] });
    },
  });

  return mutation;
}

export function useDeleteTemplate(ownerId: string | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      if (!ownerId) throw new Error("Non autenticato");
      const { error } = await supabase
        .from("tournament_templates")
        .delete()
        .eq("id", id)
        .eq("owner_id", ownerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", ownerId] });
    },
  });

  return mutation;
}
