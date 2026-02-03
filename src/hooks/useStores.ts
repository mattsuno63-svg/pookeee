"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Store, CreateStoreInput } from "@/types/database";
import { generateSlug, validateStoreName, isSlugReserved } from "@/lib/utils";

export function useStores(ownerId: string | undefined) {
  const supabase = createClient();

  const query = useQuery({
    queryKey: ["stores", ownerId],
    queryFn: async () => {
      if (!ownerId) return [];
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Store[];
    },
    enabled: !!ownerId,
  });

  return query;
}

export function useStore(slug: string | null, options?: { publicOnly?: boolean }) {
  const supabase = createClient();

  const query = useQuery({
    queryKey: ["store", slug],
    queryFn: async () => {
      if (!slug) return null;
      let q = supabase.from("stores").select("*").eq("slug", slug);
      if (options?.publicOnly) {
        q = q.eq("is_active", true);
      }
      const { data, error } = await q.single();
      if (error) throw error;
      return data as Store;
    },
    enabled: !!slug,
  });

  return query;
}

export function useStoreById(id: string | null) {
  const supabase = createClient();

  const query = useQuery({
    queryKey: ["store", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("stores").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Store;
    },
    enabled: !!id,
  });

  return query;
}

export function useCreateStore(ownerId: string | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: CreateStoreInput) => {
      if (!ownerId) throw new Error("Sessione scaduta. Effettua nuovamente il login.");
      const validation = validateStoreName(input.name);
      if (!validation.valid) throw new Error(validation.error);
      let slug = generateSlug(input.name);
      if (isSlugReserved(slug)) throw new Error("Questo nome non è disponibile");

      const tryInsert = async (s: string) => {
        const { data, error } = await supabase
          .from("stores")
          .insert({
            owner_id: ownerId,
            name: input.name.trim(),
            slug: s,
            description: input.description?.trim() || null,
            address: input.address?.trim() || null,
            city: input.city?.trim() || null,
            province: input.province?.trim() || null,
            postal_code: input.postal_code?.trim() || null,
            phone: input.phone?.trim() || null,
            email: input.email?.trim() || null,
            website: input.website?.trim() || null,
            logo_url: input.logo_url?.trim() || null,
            banner_url: input.banner_url?.trim() || null,
            gallery_images: input.gallery_images ?? [],
            social_links: input.social_links ?? {},
            opening_hours: input.opening_hours ?? {},
          })
          .select()
          .single();
        return { data, error };
      };

      let result = await tryInsert(slug);
      if (result.error?.code === "23505" && result.error?.message?.includes("slug")) {
        slug = `${slug}-${Date.now().toString(36)}`;
        result = await tryInsert(slug);
      }
      if (result.error) throw result.error;
      return result.data as Store;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores", ownerId] });
    },
  });

  return mutation;
}

export function useUpdateStore(ownerId: string | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateStoreInput> & { id: string }) => {
      if (!ownerId) throw new Error("Non autenticato");
      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) {
        const validation = validateStoreName(input.name);
        if (!validation.valid) throw new Error(validation.error);
        updates.name = input.name.trim();
        updates.slug = generateSlug(input.name);
      }
      if (input.description !== undefined) updates.description = input.description?.trim() || null;
      if (input.address !== undefined) updates.address = input.address?.trim() || null;
      if (input.city !== undefined) updates.city = input.city?.trim() || null;
      if (input.province !== undefined) updates.province = input.province?.trim() || null;
      if (input.postal_code !== undefined) updates.postal_code = input.postal_code?.trim() || null;
      if (input.phone !== undefined) updates.phone = input.phone?.trim() || null;
      if (input.email !== undefined) updates.email = input.email?.trim() || null;
      if (input.website !== undefined) updates.website = input.website?.trim() || null;
      if (input.logo_url !== undefined) updates.logo_url = input.logo_url?.trim() || null;
      if (input.banner_url !== undefined) updates.banner_url = input.banner_url?.trim() || null;
      if (input.gallery_images !== undefined) updates.gallery_images = input.gallery_images;
      if (input.latitude !== undefined) updates.latitude = input.latitude;
      if (input.longitude !== undefined) updates.longitude = input.longitude;
      if (input.social_links !== undefined) updates.social_links = input.social_links;
      if (input.opening_hours !== undefined) updates.opening_hours = input.opening_hours;

      const { data, error } = await supabase
        .from("stores")
        .update(updates)
        .eq("id", id)
        .eq("owner_id", ownerId)
        .select()
        .single();
      if (error) throw error;
      return data as Store;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores", ownerId] });
    },
  });

  return mutation;
}

export function useDeleteStore(ownerId: string | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      if (!ownerId) throw new Error("Non autenticato");
      const { error } = await supabase.from("stores").delete().eq("id", id).eq("owner_id", ownerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores", ownerId] });
    },
  });

  return mutation;
}

/**
 * Hook per verificare in tempo reale se il nome/slug di un negozio è disponibile
 */
export function useCheckStoreName(name: string, excludeId?: string) {
  const supabase = createClient();
  const slug = generateSlug(name);

  const query = useQuery({
    queryKey: ["store-name-check", slug],
    queryFn: async () => {
      if (!name.trim() || name.trim().length < 3) {
        return { available: false, reason: "too_short" };
      }
      
      // Verifica nome riservato
      if (isSlugReserved(slug)) {
        return { available: false, reason: "reserved" };
      }
      
      // Verifica se esiste già
      let q = supabase.from("stores").select("id, name").eq("slug", slug);
      if (excludeId) {
        q = q.neq("id", excludeId);
      }
      const { data, error } = await q.maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        return { available: false, reason: "taken", existingName: data.name };
      }
      
      return { available: true };
    },
    enabled: name.trim().length >= 3,
    staleTime: 5000, // Cache per 5 secondi
  });

  return query;
}
