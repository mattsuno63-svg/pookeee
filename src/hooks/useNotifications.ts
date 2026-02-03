"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types/database";

export function useNotifications(userId: string | undefined) {
  const supabase = createClient();

  const query = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!userId,
    refetchInterval: 30000, // Polling ogni 30 secondi
    refetchOnWindowFocus: true, // Aggiorna quando torni sulla tab
    refetchOnMount: true, // Aggiorna al mount del componente
  });

  return query;
}

export function useUnreadCount(userId: string | undefined) {
  const supabase = createClient();

  const query = useQuery({
    queryKey: ["notifications-unread", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!userId,
    refetchInterval: 30000, // Polling ogni 30 secondi
    refetchOnWindowFocus: true, // Aggiorna quando torni sulla tab
    refetchOnMount: true, // Aggiorna al mount del componente
  });

  return query;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const mutation = useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread", userId] });
    },
  });

  return mutation;
}

export function useMarkAllNotificationsRead(userId: string | undefined) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread", userId] });
    },
  });

  return mutation;
}
